import { Metadata } from "next"
import { notFound } from "next/navigation"
import { siteConfig } from "@/config/site"
import prisma from "@/lib/prisma"
import { ConfirmationReceipt } from "./confirmation-receipt"

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: `Your order confirmation at ${siteConfig.name}.`,
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: {
            include: {
              content: {
                select: { title: true },
              },
            },
          },
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  const orderJson = JSON.parse(JSON.stringify(order))

  const settings = await prisma.setting.findMany()
  const heroBg = settings.find((s) => s.key === "hero_bg_cart")?.value || "/images/bg/bg6.jpg"

  return (
    <>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Order Confirmed</h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Thank you for your order! We&apos;ll get started on it right away.
            </p>
          </div>
        </div>
      </section>
      <ConfirmationReceipt order={orderJson} />
    </>
  )
}
