export const siteConfig = {
  name: "32Smiles Dental Clinic",
  tagline: "Dental Care Solution",
  description:
    "Premium dental care in Victoria Island, Lagos. Services include teeth whitening, root canal, dental implants, and cosmetic dentistry.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://32smiless.vercel.app",
  contact: {
    phone: "+(234) 810 368 7424",
    email: "admin@32smiles.com",
    address: "3B Fabac Close, off Ligali Ayorinde Street, Victoria Island, Lagos, Nigeria",
    website: "www.32smiles.com",
  },
  business: {
    hours: {
      monday: "8:00am - 4:30pm",
      tuesday: "8:00am - 4:30pm",
      wednesday: "8:00am - 4:30pm",
      thursday: "8:00am - 4:30pm",
      friday: "8:00am - 3:00pm",
      saturday: "Closed",
      sunday: "8:00am - 4:30pm",
    },
  },
  social: {
    facebook: "#",
    twitter: "#",
    instagram: "#",
    linkedin: "#",
  },
  mission:
    "To promote a genuine and confident smile through excellent oral health care",
  features: [
    "Qualified Doctors",
    "24x7 Emergency Services",
    "General Medical",
    "State-of-the-art Technology",
    "Flexible Appointments",
    "Outdoor Checkup",
    "Easy and Affordable Billing",
    "Feel like Home Services",
  ],
} as const
