import { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { CheckoutForm } from "./checkout-form"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const metadata: Metadata = {
  title: "Checkout",
  description: `Complete your order at ${siteConfig.name}.`,
}

export default async function CheckoutPage() {
  const settings = await prisma.setting.findMany()
  const session = await auth()

  let initialUser: { name: string; email: string; phone: string; address: string } | null = null
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true, phone: true, address: true },
    })
    if (user?.name && user?.email) {
      initialUser = {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
      }
    }
  }

  return (
    <>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_cart', '/images/bg/bg6.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Checkout</h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Fill in your details to complete your order
            </p>
          </div>
        </div>
      </section>
      <CheckoutForm initialUser={initialUser} />
    </>
  )
}
