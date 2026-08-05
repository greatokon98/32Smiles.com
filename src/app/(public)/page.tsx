import Link from "next/link"
import Image from "next/image"
import { siteConfig } from "@/config/site"
import prisma from "@/lib/prisma"
import { Phone, ArrowRight, Shield, Clock, Heart, Award, CheckCircle2, Stethoscope } from "lucide-react"
import { ClinicJsonLd } from "@/features/seo/JsonLd"
import { ImageCarousel } from "./image-carousel"
import { HeroTextCycler } from "./hero-text-cycler"
import { StatsCounter } from "./stats-counter"
import { InsuranceSection } from "./insurance-section"
import { DentalJourney } from "./dental-journey"
import { TestimonialsCarousel } from "./testimonials-carousel"
import { BlogCarousel } from "./blog-carousel"
import { AnimatedSection } from "./section-animation"
import { TransformationsCarousel } from "./transformations-carousel"

export const revalidate = 300


function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export default async function HomePage() {
  const settings = await prisma.setting.findMany()

  const [services, testimonials, recentPosts, featuredTeam, galleryItems] = await Promise.all([
    prisma.content.findMany({
      where: { type: "SERVICE", status: "PUBLISHED", deletedAt: null, featured: true },
      include: { service: true, featuredImage: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.content.findMany({
      where: { type: "TESTIMONIAL", status: "PUBLISHED", deletedAt: null },
      include: { testimonial: { include: { photoFile: true } }, featuredImage: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.content.findMany({
      where: { type: "BLOG_POST", status: "PUBLISHED", deletedAt: null },
      include: { blogPost: true, author: { select: { name: true } }, featuredImage: true },
      take: 3,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.teamMember.findFirst({
      where: {
        content: { type: "TEAM_MEMBER", status: "PUBLISHED", deletedAt: null },
        isFeatured: true,
      },
      include: {
        content: { include: { featuredImage: true } },
        photoFile: true,
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.content.findMany({
      where: { type: "GALLERY_ITEM", status: "PUBLISHED", deletedAt: null, galleryItem: { category: "transformations" } },
      include: {
        galleryItem: { include: { imageFile: true, fullImageFile: true } },
        featuredImage: true,
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ])

  const heroTaglines = [
    getSetting(settings, "hero_tagline_1", "Advanced Care, Gentle Touch"),
    getSetting(settings, "hero_tagline_2", "Expert Dentists, Warm Smiles"),
    getSetting(settings, "hero_tagline_3", "Modern Technology, Real Results"),
    getSetting(settings, "hero_tagline_4", "Your Comfort, Our Commitment"),
  ].filter(Boolean)

  const statsYears = getSetting(settings, "stats_years", "10")
  const statsPatients = getSetting(settings, "stats_patients", "5000")
  const statsSatisfaction = getSetting(settings, "stats_satisfaction", "98")
  const statsEmergencyLabel = getSetting(settings, "stats_emergency_label", "24/7 Emergency Support")
  const insuranceCompanies = getSetting(settings, "insurance_companies", "Aetna, Cigna, Delta Dental, MetLife, Blue Cross, Guardian, Humana, UnitedHealthcare")
    .split(",").map((s) => s.trim()).filter(Boolean)
  const whyChooseUsImage = getSetting(settings, "why_choose_us_image", "")
  const serviceImages: Record<string, string> = (() => {
    const defaultItems = JSON.stringify({
      "root-canal": "/images/services/1.jpg",
      "teeth-whitening": "/images/services/2.jpg",
      "dental-implants": "/images/services/3.jpg",
      "cosmetic-dentistry": "/images/services/b1.jpg",
      "wisdom-teeth": "/images/services/single-service.jpg",
      "general-dentistry": "/images/services/1.jpg",
    })
    try { return JSON.parse(getSetting(settings, "service_fallback_images", defaultItems)) } catch { return JSON.parse(defaultItems) }
  })()
  const blogImages: string[] = (() => {
    const defaultItems = JSON.stringify(["/images/blog/1.jpg", "/images/blog/2.jpg", "/images/blog/3.jpg"])
    try { return JSON.parse(getSetting(settings, "blog_fallback_images", defaultItems)) } catch { return JSON.parse(defaultItems) }
  })()
  const beforeAfterImages: string[] = (() => {
    const defaultItems = JSON.stringify(["/images/before-after/1.jpg", "/images/before-after/2.jpg", "/images/before-after/3.jpg"])
    try { return JSON.parse(getSetting(settings, "before_after_fallback_images", defaultItems)) } catch { return JSON.parse(defaultItems) }
  })()

  const features = [
    { icon: Award, title: "Qualified Doctors", desc: "Our team of experienced dentists provides the highest quality care." },
    { icon: Clock, title: "24/7 Emergency", desc: "We're here for you around the clock for dental emergencies." },
    { icon: Shield, title: "Advanced Technology", desc: "State-of-the-art equipment for precise and comfortable treatments." },
    { icon: Heart, title: "Patient Comfort", desc: "We ensure every visit is comfortable and stress-free." },
  ]

  const fallbackServices = [
    { title: "Root Canal", desc: "Treatment to save severely damaged or infected teeth.", slug: "root-canal" },
    { title: "Teeth Whitening", desc: "Professional whitening for a brighter, more confident smile.", slug: "teeth-whitening" },
    { title: "Dental Implants", desc: "Permanent replacement for missing teeth with natural-looking results.", slug: "dental-implants" },
    { title: "Cosmetic Dentistry", desc: "Enhance the appearance of your smile with our cosmetic treatments.", slug: "cosmetic-dentistry" },
    { title: "Wisdom Teeth", desc: "Safe and comfortable removal of problematic wisdom teeth.", slug: "wisdom-teeth" },
    { title: "General Dentistry", desc: "Comprehensive oral health care for the whole family.", slug: "general-dentistry" },
  ]

  const fallbackTestimonials = [
    { name: "Eric Dimgba", quote: "The support was great, the staff was very helpful and the products were top notch.", rating: 5 },
    { name: "Sanni Vivian", quote: "Their services are great, unique, smart and fast, hard to find anywhere in the country.", rating: 5 },
    { name: "Mary James", quote: "They have great facilities and quality equipments, best of its kind anywhere in the country.", rating: 5 },
    { name: "Lucy Brown", quote: "I am over the moon with my smile and no longer feel self-conscious about my missing tooth.", rating: 5 },
  ]

  type DisplayService = { title: string; desc: string; slug: string; imageUrl?: string }

  const displayServices: DisplayService[] = services.length > 0
    ? services.map((s) => ({ title: s.title, desc: s.excerpt || "", slug: s.slug, imageUrl: s.featuredImage?.url }))
    : fallbackServices.map((s) => ({ ...s, imageUrl: undefined }))

  const displayTestimonials = testimonials.length > 0
    ? testimonials.map((t) => ({ name: t.testimonial?.clientName || t.title, quote: t.excerpt || "", photoUrl: t.testimonial?.photoFile?.url || t.featuredImage?.url || "", rating: t.testimonial?.rating || 5 }))
    : fallbackTestimonials

  const dbGalleryItems = galleryItems
    .map((item) => ({
      imageUrl: item.galleryItem?.imageFile?.url || item.featuredImage?.url || "",
      fullImageUrl: item.galleryItem?.fullImageFile?.url || "",
      caption: item.galleryItem?.caption || item.title,
    }))
    .filter((item) => item.imageUrl)

  const displayGallery = dbGalleryItems.length > 0
    ? dbGalleryItems
    : beforeAfterImages.map((url) => ({ imageUrl: url, fullImageUrl: "", caption: "Successful Treatment" }))

  const dentistPhoto = featuredTeam?.photoFile?.url
    ? { url: featuredTeam.photoFile.url, title: featuredTeam.content.title }
    : null
  const sliderImageUrl = getSetting(settings, "homepage_slider_image", "/images/gallery/3.jpg")
  const sliderImages = [dentistPhoto, { url: sliderImageUrl, title: "Smile Transformation" }].filter(Boolean) as { url: string; title: string }[]

  return (
    <>
      <ClinicJsonLd />

      <AnimatedSection>
        <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_homepage', '/images/bg/bg1.jpg')})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 to-transparent" />
          <div className="relative container mx-auto px-4 py-24 lg:py-36">
            <div className="max-w-2xl">
              <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                Welcome to {siteConfig.name}
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Your Smile, <span className="text-primary-200">Our Priority</span>
              </h1>
              <div className="mb-10">
                <HeroTextCycler taglines={heroTaglines} />
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/appointment"
                  className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                >
                  Book Appointment
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                  className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all inline-flex items-center gap-2"
                >
                  <Phone className="h-5 w-5" />
                  {siteConfig.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <StatsCounter
        years={statsYears}
        patients={statsPatients}
        satisfaction={statsSatisfaction}
        emergencyLabel={statsEmergencyLabel}
      />

      <AnimatedSection>
        <section className="py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 max-w-[400px] mx-auto w-full">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* {insuranceCompanies.length > 0 && <InsuranceSection companies={insuranceCompanies} />} */}

      <AnimatedSection>
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">What We Offer</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">Our Dental Services</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Comprehensive dental services tailored to your needs.
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {displayServices.map((service, i) => (
                  <Link
                    key={i}
                    href={`/services/${service.slug}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-md transition-all w-full max-w-[400px]"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      <Image
                        src={service.imageUrl || serviceImages[service.slug] || "/images/services/1.jpg"}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">{service.desc}</p>
                      <span className="text-primary-600 text-xs font-semibold inline-flex items-center gap-1">
                        Learn More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-center mt-8">
              <Link
                href="/services"
                className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
              >
                View All Services <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <DentalJourney />

      <AnimatedSection>
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">About Our Dentist</span>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-6">
                  {featuredTeam?.content.title || "Expert Dental Care"}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {featuredTeam?.bio || "With years of experience and a passion for creating beautiful smiles, our lead dentist combines clinical excellence with a gentle, patient-centered approach. Every treatment is tailored to your unique needs."}
                </p>
                {featuredTeam && (
                  <div className="space-y-3 mb-8">
                    <p className="flex items-center gap-3 text-gray-700">
                      <Stethoscope className="h-5 w-5 text-primary-600 shrink-0" />
                      <span className="font-medium">{featuredTeam.specialty}</span>
                    </p>
                    <p className="flex items-center gap-3 text-gray-700">
                      <Award className="h-5 w-5 text-primary-600 shrink-0" />
                      <span>{featuredTeam.credentials}</span>
                    </p>
                  </div>
                )}
                <Link
                  href="/team"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Meet Our Team <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {sliderImages.length > 0 && (
                <div className="relative h-80 lg:h-96">
                  {sliderImages.length > 1 ? (
                    <ImageCarousel images={sliderImages} />
                  ) : (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                      <Image
                        src={sliderImages[0].url}
                        alt={sliderImages[0].title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="py-16 lg:py-20 bg-gradient-to-r from-primary-700 to-primary-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_homepage_cta', '/images/bg/bg2.jpg')})` }} />
          <div className="relative container mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready for Your Best Smile?</h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto text-lg">
              Schedule your appointment today and experience the {siteConfig.name} difference.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/appointment"
                className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-all shadow-lg"
              >
                Book Appointment
              </Link>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all inline-flex items-center gap-2"
              >
                <Phone className="h-5 w-5" />
                {siteConfig.contact.phone}
              </a>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-6">
                  Committed to Your Dental Health
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  We combine expertise, advanced technology, and compassionate care to deliver the best dental experience for you and your family.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {siteConfig.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={whyChooseUsImage || featuredTeam?.photoFile?.url || "/images/team/1.jpg"}
                  alt="Why Choose Us"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute -bottom-4 -left-4 bg-primary-600 text-white p-5 rounded-xl shadow-lg">
                  <p className="text-2xl font-bold">10+</p>
                  <p className="text-primary-100 text-xs">Years of Excellence</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Results</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">Transformations</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                See the amazing results our patients have achieved.
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              <TransformationsCarousel items={displayGallery} />
            </div>
            <div className="text-center mt-8">
              <Link
                href="/gallery"
                className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
              >
                View Full Gallery <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">What Our Patients Say</h2>
            </div>
            <div className="max-w-6xl mx-auto">
              <TestimonialsCarousel testimonials={displayTestimonials} avatarImages={[getSetting(settings, "testimonial_avatar_1", "/images/testimonials/1.png"), getSetting(settings, "testimonial_avatar_2", "/images/testimonials/2.png"), getSetting(settings, "testimonial_avatar_3", "/images/testimonials/3.png"), getSetting(settings, "testimonial_avatar_4", "/images/testimonials/1.jpg")]} />
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Blog</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">Latest Articles</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Stay informed with our latest dental health tips and news.
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              <BlogCarousel posts={recentPosts} blogImages={blogImages} />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* <section className="py-12 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-gray-500 mb-6">Trusted by leading brands</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            <Image src="/images/payment-card-logo-sm.png" alt="Payment Methods" width={200} height={40} className="h-8 w-auto" />
          </div>
        </div>
      </section> */}
    </>
  )
}
