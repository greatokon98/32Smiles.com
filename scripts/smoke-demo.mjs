#!/usr/bin/env node
// Demo smoke suite — runs against a local dev server (localhost:3000).
// Covers: public routes, shop E2E, auth/RBAC (5 roles), admin sections,
// patient portal, change-password, and a no-leaks pass.
//
// Usage:  node scripts/smoke-demo.mjs

import { chromium } from "playwright"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

const DEV_LOG = "/tmp/smiles-dev.log"

function logTail() {
  try {
    return readFileSync(DEV_LOG, "utf8")
  } catch {
    return ""
  }
}

const BASE = process.env.BASE_URL || "http://localhost:3000"
const accounts = {
  superadmin: ["superadmin@demo.local", "Superadmin123!"],
  admin: ["admin@demo.local", "Admin123!"],
  editor: ["editor@demo.local", "Editor123!"],
  receptionist: ["receptionist@demo.local", "Receptionist123!"],
  patient: ["patient@demo.local", "Patient123!"],
}

let failures = 0
let passes = 0
const results = []

function report(section, name, ok, detail = "") {
  ok ? passes++ : failures++
  results.push({ section, name, ok, detail })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

function psql(sql) {
  return execSync(
    `/Applications/Postgres.app/Contents/Versions/latest/bin/psql -d smiles_demo_bangalore -tAc "${sql.replace(/"/g, '\\"')}"`,
    { encoding: "utf8" }
  ).trim()
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
page.setDefaultTimeout(15000)

const globalErrors = []
page.on("pageerror", (e) => globalErrors.push(`pageerror: ${e.message}`))
page.on("console", (m) => {
  if (m.type() === "error") globalErrors.push(`console: ${m.text()}`)
})
page.on("requestfailed", (r) => {
  const err = r.failure()?.errorText || ""
  if (/favicon|\.map$|ERR_NETWORK_IO_SUSPENDED|aborted/i.test(r.url() + " " + err)) return
  globalErrors.push(`requestfailed: ${r.url()} ${err}`)
})
page.on("response", (r) => {
  if (r.status() >= 500) globalErrors.push(`HTTP ${r.status()}: ${r.url()}`)
})

async function clearGlobalErrors() {
  globalErrors.length = 0
}

async function goto(url, opts = {}) {
  const res = await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 30000, ...opts })
  await page.waitForTimeout(400)
  return res
}

async function login(email, password) {
  await goto("/admin/login")
  await page.fill("#email", email)
  await page.fill("#password", password)
  await Promise.all([
    page.waitForURL(/\/admin\/dashboard|\/dashboard/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(500)
  return page.url()
}

async function logout() {
  await page.goto(BASE + "/admin/login", { waitUntil: "load", timeout: 30000 })
}

// ────────────────────────── 1. PUBLIC ROUTES ──────────────────────────
console.log("\n== Public routes ==")
const publicRoutes = [
  "/",
  "/about",
  "/services",
  "/services/dental-implants",
  "/products",
  "/products/fluoride-toothpaste-100g",
  "/blog",
  "/blog/dental-tourism-in-bangalore",
  "/education/patient",
  "/education/patient/understanding-tooth-sensitivity",
  "/faq",
  "/gallery",
  "/team",
  "/contact",
  "/appointment",
  "/cart",
  "/checkout",
  "/search",
  "/insurance",
]
for (const route of publicRoutes) {
  const res = await goto(route)
  const status = res?.status() || 0
  const bad = status >= 400
  report("Public", `${status} ${route}`, !bad, bad ? `status ${status}` : "")
}
// currency sanity on products page
{
  const res = await goto("/products")
  const html = await page.content()
  const hasINR = /₹/.test(html) && !/₦/.test(html)
  report("Public", "products page shows ₹ (INR)", hasINR, hasINR ? "" : "missing ₹ / found ₦")
}

// ────────────────────────── 1.5 LOGIN REDIRECT (#1 / #3) ──────────────
console.log("\n== Login redirect (callbackUrl) ==")
{
  // unauthenticated /dashboard/orders → 307 to login carrying callbackUrl
  const probeCtx = await browser.newContext()
  const probeReq = await probeCtx.request.get(BASE + "/dashboard/orders", { maxRedirects: 0 })
  const probeLocation = probeReq.headers()["location"] || ""
  report(
    "Login",
    "unauth /dashboard/orders 307 → /admin/login?callbackUrl",
    probeReq.status() === 307 && /admin\/login\?callbackUrl=%2Fdashboard%2Forders/.test(probeLocation),
    `status ${probeReq.status()} ${probeLocation}`
  )
  await probeCtx.close()

  const ctx2 = await browser.newContext()
  const p2 = await ctx2.newPage()
  p2.setDefaultTimeout(15000)

  // VIEWER login with safe callbackUrl=/checkout → lands back on /checkout
  await p2.goto(BASE + "/admin/login?callbackUrl=/checkout", { waitUntil: "domcontentloaded", timeout: 30000 })
  await p2.fill("#email", accounts.patient[0])
  await p2.fill("#password", accounts.patient[1])
  await Promise.all([
    p2.waitForURL((u) => u.pathname === "/checkout", { timeout: 20000 }),
    p2.click('button[type="submit"]'),
  ])
  await p2.waitForTimeout(400)
  report("Login", "VIEWER login with callbackUrl=/checkout lands on /checkout", p2.url().endsWith("/checkout"), p2.url())

  // VIEWER login with unsafe callbackUrl=/admin/dashboard → blocked to /dashboard
  await p2.goto(BASE + "/admin/login?callbackUrl=/admin/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 })
  await p2.fill("#email", accounts.patient[0])
  await p2.fill("#password", accounts.patient[1])
  await Promise.all([
    p2.waitForURL((u) => u.pathname === "/dashboard", { timeout: 20000 }),
    p2.click('button[type="submit"]'),
  ])
  await p2.waitForTimeout(400)
  const blocked = p2.url().endsWith("/dashboard") && !p2.url().includes("/admin/")
  report("Login", "VIEWER unsafe admin callbackUrl blocked → /dashboard", blocked, p2.url())

  // VIEWER login with callbackUrl=/dashboard/orders → lands on orders (no orders yet → empty state, no logout)
  await p2.goto(BASE + "/admin/login?callbackUrl=/dashboard/orders", { waitUntil: "domcontentloaded", timeout: 30000 })
  await p2.fill("#email", accounts.patient[0])
  await p2.fill("#password", accounts.patient[1])
  await Promise.all([
    p2.waitForURL((u) => u.pathname === "/dashboard/orders", { timeout: 20000 }),
    p2.click('button[type="submit"]'),
  ])
  await p2.waitForTimeout(800)
  const emptyState = await p2.getByText("No orders yet").isVisible().catch(() => false)
  report(
    "Login",
    "VIEWER lands on /dashboard/orders with empty state (no logout)",
    p2.url().endsWith("/dashboard/orders") && emptyState,
    p2.url()
  )
  await ctx2.close()
}

// ────────────────────────── 2. SHOP E2E ───────────────────────────────
console.log("\n== Shop E2E (guest checkout) ==")
const guestEmail = `guest-${Date.now()}@demo.local`
let guestOrderNumber = ""
let guestOrderId = ""
let productId = ""

{
  // browse → detail
  await goto("/products")
  const firstLink = page.locator('a[href*="/products/"]:not([href*="/products?"])').first()
  await firstLink.click()
  await page.waitForURL(/\/products\//)
  productId = new URL(page.url()).pathname.split("/").pop()
  const detailOk = await page.getByText("Add to Cart").isVisible()
  report("Shop", "product detail page renders Add to Cart", detailOk)

  // add to cart
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.waitForTimeout(600)
  const badge = page.locator('button[aria-label="Shopping cart"] span')
  const badgeText = (await badge.count()) ? await badge.textContent() : ""
  report("Shop", "cart badge increments after add", badgeText === "1", `badge="${badgeText}"`)

  // cart page
  await goto("/cart")
  const cartHasItem = await page.getByText("Cart Items (1)").isVisible().catch(() => false)
  report("Shop", "cart page shows item", cartHasItem)

  // proceed to checkout (dedicated /checkout page)
  await page.getByRole("button", { name: "Proceed to Checkout" }).click()
  await page.waitForURL(/\/checkout/)
  await page.fill('input[type="text"]', "Guest Shopper")
  await page.fill('input[type="email"]', guestEmail)
  await page.fill('input[type="tel"]', "+919876543210")
  await page.locator("textarea").first().fill("24, 27th Main, HSR Layout, Bengaluru 560102")
  await page.getByRole("button", { name: /^Place Order/ }).click()
  await page.waitForURL(/\/order\/confirmation\//, { timeout: 20000 }).catch(() => {})
  const placed = await page.getByText("Order Placed Successfully!").isVisible().catch(() => false)
  report("Shop", "guest order placed (201)", placed)
  if (placed) {
    guestOrderNumber = (await page.locator("p.text-2xl.font-bold.text-primary-700").textContent()).trim()
    guestOrderId = guestOrderNumber
    report("Shop", `order number captured (${guestOrderNumber})`, true)
  }
}

  // confirmation page
if (guestOrderNumber) {
  const res = await goto(`/order/confirmation/${guestOrderNumber}`)
  const ok = res?.status() === 200
  const html = await page.content()
  report("Shop", "confirmation page renders", ok && /Order Placed Successfully/.test(html))
  report("Shop", "confirmation shows ₹", /₹/.test(html) && !/₦/.test(html))
}

// ────────────────────────── 3. PATIENT ORDER (logged-in) ──────────────
console.log("\n== Shop E2E (patient checkout) ==")
let patientOrderNumber = ""
{
  const url = await login(accounts.patient[0], accounts.patient[1])
  report("Auth", "patient login lands on /dashboard", url.endsWith("/dashboard"), url)

  await goto("/products")
  await page.locator('a[href*="/products/"]:not([href*="/products?"])').first().click()
  await page.waitForURL(/\/products\//)
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.waitForTimeout(500)
  await goto("/cart")
  await page.getByRole("button", { name: "Proceed to Checkout" }).click()
  await page.waitForURL(/\/checkout/)
  await page.locator("textarea").first().fill("12, 29th Cross, HSR Layout, Bengaluru 560102")
  await page.getByRole("button", { name: /^Place Order/ }).click()
  await page.waitForURL(/\/order\/confirmation\//, { timeout: 20000 }).catch(() => {})
  const placed = await page.getByText("Order Placed Successfully!").isVisible().catch(() => false)
  report("Shop", "patient order placed", placed)
  if (placed) {
    patientOrderNumber = (await page.locator("p.text-2xl.font-bold.text-primary-700").textContent()).trim()
    // patient portal shows it
    await goto("/dashboard/orders")
    const seen = await page.getByText(`#${patientOrderNumber}`).isVisible().catch(() => false)
    report("Shop", "order visible in patient portal /dashboard/orders", seen, patientOrderNumber)
    const inr = await page.getByText("₹").isVisible().catch(() => false)
    report("Shop", "patient orders show ₹ (INR)", inr)
  }
}

// ────────────────────────── 4. ADMIN (orders + status update) ─────────
console.log("\n== Admin: orders ==")
{
  const url = await login(accounts.superadmin[0], accounts.superadmin[1])
  report("Auth", "superadmin login lands on /admin/dashboard", url.includes("/admin/dashboard"), url)

  await goto("/admin/orders")
  const listShowsGuest = guestOrderNumber
    ? await page.getByText(guestOrderNumber).isVisible().catch(() => false)
    : false
  report("Shop", "admin sees guest order in /admin/orders", listShowsGuest)
  const listShowsPatient = patientOrderNumber
    ? await page.getByText(patientOrderNumber).isVisible().catch(() => false)
    : false
  report("Shop", "admin sees patient order in /admin/orders", listShowsPatient)

  // status update
  if (guestOrderNumber) {
    const row = page.locator(`button:has-text("${guestOrderNumber}")`).first()
    await row.click()
    await page.waitForTimeout(300)
    await row.locator('xpath=..').getByRole("button", { name: "CONFIRMED" }).click()
    await page.waitForTimeout(1500)
    const dbStatus = psql(`SELECT status FROM orders WHERE "orderNumber" = '${guestOrderNumber}'`)
    report("Shop", "admin updates order status → CONFIRMED", dbStatus === "CONFIRMED", `db="${dbStatus}"`)
  }
}

// ────────────────────────── 5. SUPERADMIN CHECKOUT + INLINE-FILL ──────
console.log("\n== Shop E2E (superadmin checkout + inline-fill) ==")
let superadminOrderNumber = ""
let inlineOrderNumber = ""
{
  // prefilled phone (seeded) → Place Order works as a logged-in staff account
  const url = await login(accounts.superadmin[0], accounts.superadmin[1])
  report("Shop", "superadmin login lands on /admin/dashboard", url.includes("/admin/dashboard"), url)

  await goto("/products")
  await page.locator('a[href*="/products/"]:not([href*="/products?"])').first().click()
  await page.waitForURL(/\/products\//)
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.waitForTimeout(500)
  await goto("/cart")
  await page.getByRole("button", { name: "Proceed to Checkout" }).click()
  await page.waitForURL(/\/checkout/)
  const phoneLocked = await page.locator('input[type="tel"]').isDisabled().catch(() => false)
  report("Shop", "superadmin checkout has phone prefilled from profile (locked)", phoneLocked)
  await page.locator("textarea").first().fill("24, 27th Main Road, HSR Layout, Bengaluru 560102")
  await page.getByRole("button", { name: /^Place Order/ }).click()
  await page.waitForURL(/\/order\/confirmation\//, { timeout: 20000 }).catch(() => {})
  const placed = await page.getByText("Order Placed Successfully!").isVisible().catch(() => false)
  report("Shop", "superadmin order placed (prefilled profile)", placed)
  if (placed) {
    superadminOrderNumber = (await page.locator("p.text-2xl.font-bold.text-primary-700").textContent()).trim()
    await goto(`/order/confirmation/${superadminOrderNumber}`)
    const html = await page.content()
    report("Shop", "superadmin confirmation shows ₹ (INR)", /₹/.test(html) && !/₦/.test(html))
  }
}

{
  // inline-fill regression: blank the superadmin profile phone + address,
  // checkout must show editable empty fields (no dashboard detour), and the
  // filled values must be persisted back to the profile on order.
  psql(`UPDATE users SET phone = NULL, address = NULL WHERE email = 'superadmin@demo.local'`)
  const url = await login(accounts.superadmin[0], accounts.superadmin[1])
  await goto("/products")
  await page.locator('a[href*="/products/"]:not([href*="/products?"])').first().click()
  await page.waitForURL(/\/products\//)
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.waitForTimeout(500)
  await goto("/cart")
  await page.getByRole("button", { name: "Proceed to Checkout" }).click()
  await page.waitForURL(/\/checkout/)
  const phoneEditable = await page.locator('input[type="tel"]').isEnabled().catch(() => false)
  const phoneEmpty = (await page.locator('input[type="tel"]').inputValue().catch(() => "x")) === ""
  const hintVisible = await page.getByText("Add your phone number", { exact: false }).isVisible().catch(() => false)
  report("Shop", "missing phone renders as editable empty field", phoneEditable && phoneEmpty && hintVisible)
  await page.locator('input[type="tel"]').fill("+919845001122")
  await page.locator("textarea").first().fill("24, 27th Main Road, HSR Layout, Bengaluru 560102")
  await page.getByRole("button", { name: /^Place Order/ }).click()
  await page.waitForURL(/\/order\/confirmation\//, { timeout: 20000 }).catch(() => {})
  const placedInline = await page.getByText("Order Placed Successfully!").isVisible().catch(() => false)
  report("Shop", "inline-filled order placed (no dashboard detour)", placedInline)
  if (placedInline) {
    inlineOrderNumber = (await page.locator("p.text-2xl.font-bold.text-primary-700").textContent()).trim()
  }
  const dbPhone = psql(`SELECT phone FROM users WHERE email = 'superadmin@demo.local'`)
  report("Shop", "filled phone persisted to profile", dbPhone === "+919845001122", `db="${dbPhone}"`)
}

// ────────────────────────── 6. STALE-CART HANDLING ─────────────────────
console.log("\n== Stale-cart handling ==")
{
  // API guard: a productId that no longer exists must return 409 STALE_ITEMS (not a FK 500)
  const res = await page.evaluate(async () => {
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Super Admin",
        customerEmail: "superadmin@demo.local",
        customerPhone: "+919845001122",
        deliveryAddress: "HSR Layout, Bengaluru",
        items: [{ productId: "bogus-product-id-000", quantity: 1, price: 100 }],
      }),
    })
    return { status: r.status, body: await r.json() }
  })
  report(
    "Stale",
    "API returns 409 STALE_ITEMS for missing product",
    res.status === 409 && res.body.code === "STALE_ITEMS",
    `status ${res.status}`
  )

  // on-load prune: a cart persisted in localStorage with a stale item is cleaned
  // automatically when the checkout page loads
  await page.evaluate(() => {
    localStorage.setItem(
      "32smiles_cart",
      JSON.stringify([
        { productId: "bogus-product-id-000", title: "Ghost Item", price: 100, quantity: 1, imageUrl: "", currency: "INR" },
      ])
    )
  })
  await goto("/checkout")
  await page.waitForTimeout(1500)
  const emptyCartShown = await page.getByText("Your cart is empty").isVisible().catch(() => false)
  const ghostGone = (await page.getByText("Ghost Item").count()) === 0
  report("Stale", "stale item auto-pruned on checkout load", emptyCartShown && ghostGone)
  await page.evaluate(() => localStorage.removeItem("32smiles_cart"))

  // cart page prunes stale items on load as well
  await page.evaluate(() => {
    localStorage.setItem(
      "32smiles_cart",
      JSON.stringify([
        { productId: "bogus-product-id-000", title: "Ghost Item", price: 100, quantity: 1, imageUrl: "", currency: "INR" },
      ])
    )
  })
  await goto("/cart")
  await page.waitForTimeout(1500)
  const cartPruned = await page.getByText("Your cart is empty").isVisible().catch(() => false)
  report("Stale", "stale item auto-pruned on cart load", cartPruned)
  await page.evaluate(() => localStorage.removeItem("32smiles_cart"))
}

// ────────────────────────── 7. ADMIN SECTIONS ─────────────────────────
console.log("\n== Admin sections (superadmin) ==")
await login(accounts.superadmin[0], accounts.superadmin[1])
const adminRoutes = [
  "/admin/dashboard",
  "/admin/appointments",
  "/admin/contacts",
  "/admin/content",
  "/admin/content/SERVICE",
  "/admin/media",
  "/admin/notifications",
  "/admin/orders",
  "/admin/roles",
  "/admin/settings",
  "/admin/users",
  "/admin/profile",
  "/admin/ai-studio",
  "/admin/ai",
  "/admin/ai/templates",
  "/admin/ai/usage",
  "/admin/analytics",
  "/admin/communication",
]
for (const route of adminRoutes) {
  const res = await goto(route)
  const status = res?.status() || 0
  report("Admin", `${status} ${route}`, status < 400, status >= 400 ? `status ${status}` : "")
}

// AI Studio graceful no-key behavior
{
  await goto("/admin/ai-studio")
  const hasStep1 = await page.getByText("Select Content Type").isVisible().catch(() => false)
  const hasBlogPost = await page.getByText("Blog Post").first().isVisible().catch(() => false)
  report("Admin", "AI Studio renders content-type wizard (no key needed)", hasStep1 && hasBlogPost)
}

// ────────────────────────── 8. RBAC ───────────────────────────────────
console.log("\n== RBAC (5 roles) ==")
const roleExpectations = [
  ["superadmin", /\/admin\/dashboard/],
  ["admin", /\/admin\/dashboard/],
  ["editor", /\/admin\/dashboard/],
  ["receptionist", /\/admin\/dashboard/],
  ["patient", /\/dashboard/],
]
for (const [role, pattern] of roleExpectations) {
  const url = await login(...accounts[role])
  const ok = pattern.test(url)
  report("RBAC", `${role} lands on ${url}`, ok)
}

// patient cannot access admin
{
  await login(...accounts.patient)
  await goto("/admin/dashboard")
  await page.waitForTimeout(1200)
  const url = page.url()
  report("RBAC", "patient blocked from /admin/dashboard", !url.includes("/admin/dashboard"), url)
}

// ────────────────────────── 9. PATIENT PORTAL ─────────────────────────
console.log("\n== Patient portal ==")
await login(...accounts.patient)
const patientRoutes = [
  "/dashboard",
  "/dashboard/appointments",
  "/dashboard/files",
  "/dashboard/notifications",
  "/dashboard/orders",
  "/dashboard/profile",
]
for (const route of patientRoutes) {
  const res = await goto(route)
  const status = res?.status() || 0
  report("Patient", `${status} ${route}`, status < 400, status >= 400 ? `status ${status}` : "")
}
{
  await goto("/dashboard/appointments")
  const appt = await page.getByText("Dental Implants").isVisible().catch(() => false)
  const confirmed = await page.getByText("Confirmed").first().isVisible().catch(() => false)
  report("Patient", "seeded appointment visible in patient portal", appt && confirmed)
}

// ────────────────────────── 9.5 EMAIL + NOTIFICATIONS (#2) ─────────────
console.log("\n== Emails + notifications (#2) ==")
let apptId = ""
{
  await login(...accounts.patient)

  // book an appointment as an EXISTING user → confirmation email must be emitted
  const tomorrow = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    while (d.getDay() === 6) d.setDate(d.getDate() + 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${dd}`
  })()
  const logBefore = logTail().length
  const booking = await page.evaluate(
    async ({ email, phone, date }) => {
      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: "Patient Demo",
          patientEmail: email,
          patientPhone: phone,
          appointmentDate: date,
          appointmentTime: "9:00 AM",
          serviceType: "Teeth Cleaning",
          notes: "smoke test",
        }),
      })
      return { status: r.status, body: await r.json() }
    },
    { email: accounts.patient[0], phone: "+919845001122", date: tomorrow }
  )
  report("Email", "existing-user appointment booking returns 201", booking.status === 201, `status ${booking.status} ${booking.body?.error || ""}`)
  report("Email", "existing-user booking reports accountCreated=false", booking.body?.accountCreated === false, `accountCreated=${booking.body?.accountCreated}`)
  apptId = booking.body?.appointment?.id || ""
  if (apptId) {
    const freshLog = logTail().slice(logBefore)
    const confirmLogged = freshLog.includes("Appointment Confirmed") && freshLog.includes(accounts.patient[0])
    report("Email", "confirmation email emitted for EXISTING user (dev log)", confirmLogged, confirmLogged ? "" : "no 'Appointment Confirmed' line in dev log")
    const staffNotifs = Number(psql(`SELECT COUNT(*) FROM notifications WHERE type = 'APPOINTMENT_BOOKED' AND data->>'appointmentId' = '${apptId}'`))
    report("Email", "staff notified on booking (SUPER_ADMIN+ADMIN+RECEPTIONIST)", staffNotifs === 3, `count=${staffNotifs}`)
  }

  // reminder cron: first run sends, second run dedupes
  if (apptId) {
    const r1 = await page.evaluate(() => fetch("/api/cron/appointment-reminders").then((r) => r.json()))
    report("Email", "reminder cron first run sends reminders", r1.reminded >= 1, `reminded=${r1.reminded} skipped=${r1.skipped}`)
    const r2 = await page.evaluate(() => fetch("/api/cron/appointment-reminders").then((r) => r.json()))
    report("Email", "reminder cron second run dedupes (0 new)", r2.reminded === 0, `reminded=${r2.reminded}`)
    const reminderNotifs = Number(psql(`SELECT COUNT(*) FROM notifications WHERE type = 'APPOINTMENT_REMINDER' AND data->>'appointmentId' = '${apptId}'`))
    report("Email", "in-app reminder notification created for patient", reminderNotifs === 1, `count=${reminderNotifs}`)
  }

  // order placed → staff notifications (assert on the patient order from section 3)
  if (patientOrderNumber) {
    const staffNotifs = Number(psql(`SELECT COUNT(*) FROM notifications WHERE type = 'SYSTEM_ALERT' AND data->>'orderNumber' = '${patientOrderNumber}'`))
    report("Email", "staff notified on order placed (SUPER_ADMIN+ADMIN+RECEPTIONIST)", staffNotifs === 3, `count=${staffNotifs}`)
  }

  // cleanup test artifacts
  if (apptId) {
    psql(`DELETE FROM notifications WHERE data->>'appointmentId' = '${apptId}'`)
    psql(`DELETE FROM appointments WHERE id = '${apptId}'`)
  }
  const patId = psql(`SELECT id FROM users WHERE email = '${accounts.patient[0]}'`)
  if (patId) {
    psql(`DELETE FROM notifications WHERE "userId" = '${patId}' AND type = 'APPOINTMENT_REMINDER'`)
  }
}

// ────────────────────────── 10. CHANGE PASSWORD ────────────────────────
console.log("\n== Change password + re-login ==")
{
  const newPass = "TempNewPass123!"
  await login(...accounts.patient)
  await goto("/dashboard/profile")
  const changed = await page.evaluate(async (pw) => {
    const r = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "Patient123!", newPassword: pw }),
    })
    return r.status
  }, newPass)
  report("Auth", "change password returns 200", changed === 200, `status ${changed}`)

  await logout()
  const url = await login(accounts.patient[0], newPass)
  report("Auth", "re-login with new password works", url.includes("/dashboard"), url)

  // restore original password
  const restored = await page.evaluate(async (pw) => {
    const r = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pw, newPassword: "Patient123!" }),
    })
    return r.status
  }, newPass)
  report("Auth", "restore original password", restored === 200, `status ${restored}`)
}

// ────────────────────────── 11. NO-LEAKS / CLEANUP ─────────────────────
console.log("\n== No-leaks / cleanup ==")
{
  // orphan order_items check (order_items must always have a parent order + product)
  const orphanItems = Number(psql(`SELECT COUNT(*) FROM order_items oi WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = oi."orderId") OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id = oi."productId")`))
  report("Leaks", "no orphan order_items (FK integrity)", orphanItems === 0, `found ${orphanItems}`)

  // products must reference real categories
  const orphanProducts = Number(psql(`SELECT COUNT(*) FROM products p WHERE NOT EXISTS (SELECT 1 FROM product_categories pc WHERE pc.id = p."productCategoryId")`))
  report("Leaks", "no products with missing category", orphanProducts === 0, `found ${orphanProducts}`)

  // cleanup test artifacts
  for (const num of [guestOrderNumber, patientOrderNumber, superadminOrderNumber, inlineOrderNumber]) {
    if (num) {
      psql(`DELETE FROM notifications WHERE data->>'orderNumber' = '${num}'`)
      psql(`DELETE FROM orders WHERE "orderNumber" = '${num}'`)
    }
  }
  const guestId = psql(`SELECT id FROM users WHERE email = '${guestEmail}'`)
  if (guestId) {
    psql(`DELETE FROM messages WHERE "senderId" = '${guestId}'`)
    psql(`DELETE FROM conversations WHERE "userAId" = '${guestId}' OR "userBId" = '${guestId}'`)
    psql(`DELETE FROM notifications WHERE "userId" = '${guestId}'`)
    psql(`DELETE FROM audit_logs WHERE "userId" = '${guestId}'`)
    psql(`DELETE FROM newsletter_subscribers WHERE "userId" = '${guestId}'`)
    psql(`DELETE FROM users WHERE id = '${guestId}'`)
  }
  const remainingOrders = Number(psql(`SELECT COUNT(*) FROM orders`))
  report("Leaks", "test orders removed (back to seeded state)", remainingOrders === 0, `orders=${remainingOrders}`)
  report("Leaks", "guest account removed", psql(`SELECT COUNT(*) FROM users WHERE email = '${guestEmail}'`) === "0")

  // browser-side errors gathered during run
  const consoleSeen = [...new Set(globalErrors.filter((e) => e.startsWith("console:")))]
  const hardSeen = [...new Set(globalErrors.filter((e) => !e.startsWith("console:") || !/401|Unauthorized|409|ERR_NETWORK_IO_SUSPENDED/.test(e)))]
  const hard = hardSeen.filter((e) => !/401|Unauthorized|409|aborted|net::ERR_ABORTED|ERR_NETWORK_IO_SUSPENDED/.test(e))
  report("Leaks", "no console/page/request errors during run", hard.length === 0, hard.slice(0, 5).join(" | "))
  if (consoleSeen.length) {
    report("Leaks", `console noise only (informational): ${consoleSeen.slice(0, 3).join(" | ")}`, true)
  }
}

await browser.close()

// ────────────────────────── SUMMARY ───────────────────────────────────
console.log(`\n=== Smoke results: ${passes} passed, ${failures} failed ===`)
if (failures > 0) {
  console.log("\nFailures:")
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`  [${r.section}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}`)
  }
  process.exit(1)
}
