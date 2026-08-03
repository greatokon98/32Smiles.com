import { siteConfig } from "@/config/site"

export const clinicInfo = {
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  phone: siteConfig.contact.phone,
  email: siteConfig.contact.email,
  address: {
    street: "3B Fabac Close, off Ligali Ayorinde Street",
    locality: "Victoria Island",
    region: "Lagos",
    country: "NG",
    postalCode: "",
    full: siteConfig.contact.address,
  },
  geo: {
    latitude: 6.4281,
    longitude: 3.4219,
  },
  openingHoursSpecification: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "08:00", closes: "16:30" },
    { dayOfWeek: ["Friday"], opens: "08:00", closes: "15:00" },
    { dayOfWeek: ["Sunday"], opens: "08:00", closes: "16:30" },
  ],
  social: siteConfig.social,
  logo: `${siteConfig.url}/images/logo.png`,
  image: `${siteConfig.url}/images/og-default.jpg`,
} as const
