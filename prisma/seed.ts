import { PrismaClient, ContentType, ContentStatus, AIProvider } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Create accounts (static passwords — 32smiles.com is not a registered domain,
  // so password-reset emails cannot be delivered; share credentials manually).
  const accounts: { email: string; password: string; name: string; role: string }[] = [
    { email: "superadmin@32smiles.com", password: "superadmin123", name: "Super Admin", role: "SUPER_ADMIN" },
    { email: "admin@32smiles.com", password: "admin123", name: "Admin", role: "ADMIN" },
    { email: "editor@32smiles.com", password: "editor123", name: "Editor", role: "EDITOR" },
    { email: "receptionist@32smiles.com", password: "receptionist123", name: "Receptionist", role: "RECEPTIONIST" },
    { email: "patient@32smiles.com", password: "patient123", name: "Patient", role: "VIEWER" },
  ]

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12)
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, role: account.role, name: account.name, isActive: true },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
        isActive: true,
      },
    })
    console.log("✅ Account ready:", user.email, `(${account.role})`)
  }

  const superAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: "superadmin@32smiles.com" },
    select: { id: true },
  })

  // 2. Create Product Categories
  const categories = [
    { name: "Toothpaste", slug: "toothpaste", sortOrder: 1 },
    { name: "Brushes", slug: "brushes", sortOrder: 2 },
    { name: "Kids Products", slug: "kids", sortOrder: 3 },
    { name: "Electrical Accessories", slug: "electrical", sortOrder: 4 },
    { name: "General Products", slug: "general", sortOrder: 5 },
  ]

  const createdCategories = []
  for (const cat of categories) {
    const created = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    createdCategories.push(created)
  }
  console.log("✅ Created Product Categories:", createdCategories.length)

  // 3. Create Services
  const services = [
    {
      title: "Root Canal",
      slug: "root-canal",
      excerpt: "Procedures to treat and preserve teeth with badly infected pulp through endodontic treatment.",
      body: "<p>Root canal treatment is a dental procedure used to treat infection at the center of a tooth. The infection can be caused by bacteria living in the mouth that invade the tooth when: a crack or chip in the tooth, deep decay, or repeated dental procedures.</p><p>During a root canal procedure, the nerve and pulp are removed, and the inside of the tooth is cleaned and sealed.</p>",
    },
    {
      title: "Teeth Whitening",
      slug: "teeth-whitening",
      excerpt: "A popular cosmetic dentistry treatment for enhancing and brightening your smile.",
      body: "<p>Teeth whitening is one of the most popular cosmetic dentistry treatments. It can make your teeth look better and give you a brighter, more confident smile.</p><p>Our professional teeth whitening treatments are safe, effective, and can significantly improve the appearance of your smile.</p>",
    },
    {
      title: "Wisdom Teeth",
      slug: "wisdom-teeth",
      excerpt: "Removal of problematic wisdom teeth due to decay, trauma, or disease.",
      body: "<p>Wisdom teeth are the last permanent teeth to appear. They usually come through between the ages of 17 and 25. Sometimes there isn't enough room for them, and they can become impacted.</p><p>We provide safe and comfortable wisdom teeth removal procedures.</p>",
    },
    {
      title: "Crowns & Bridges",
      slug: "crowns-bridges",
      excerpt: "Restoration of gum and jawbone infections from periodontal disease.",
      body: "<p>Dental crowns and bridges are fixed prosthetic devices. Unlike removable devices such as dentures, which you can take out and clean daily, crowns and bridges are cemented onto existing teeth or implants.</p>",
    },
    {
      title: "Cosmetic Dentistry",
      slug: "cosmetic-dentistry",
      excerpt: "Improvement of dental aesthetics in color, position, shape, size, and alignment.",
      body: "<p>Cosmetic dentistry focuses on improving the appearance of your mouth, teeth, and smile. Our cosmetic dentistry services include teeth whitening, bonding, veneers, crowns, and complete smile makeovers.</p>",
    },
    {
      title: "Dental Implants",
      slug: "dental-implants",
      excerpt: "Surgical grade root devices supporting permanent tooth prosthetics.",
      body: "<p>Dental implants are surgical-grade root devices that support permanent tooth prosthetics. They are designed to fuse with the bone and serve as a strong foundation for replacement teeth.</p><p>Our experienced implant surgeons use the latest technology to ensure successful outcomes.</p>",
    },
  ]

  for (const service of services) {
    const content = await prisma.content.upsert({
      where: { type_slug: { type: ContentType.SERVICE, slug: service.slug } },
      update: { title: service.title, excerpt: service.excerpt, body: service.body, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.SERVICE,
        slug: service.slug,
        title: service.title,
        excerpt: service.excerpt,
        body: service.body,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        service: {
          create: { sortOrder: services.indexOf(service) },
        },
      },
    })
  }
  console.log("✅ Created Services:", services.length)

  // 4. Create Team Members
  const teamMembers = [
    { name: "Dr. Linda Feldman", slug: "dr-linda-feldman", specialty: "Root Canals Dentist", bio: "Dr. Linda Feldman is a highly experienced root canal specialist with over 15 years of practice." },
    { name: "Dr. Jessica Brown", slug: "dr-jessica-brown", specialty: "Implant Surgeon", bio: "Dr. Jessica Brown is a board-certified implant surgeon specializing in dental implants and oral surgery." },
    { name: "Dr. Nicholas Bank", slug: "dr-nicholas-bank", specialty: "Cosmetic Dental Surgeon", bio: "Dr. Nicholas Bank is a renowned cosmetic dentist with expertise in smile transformations." },
    { name: "Dr. Brian Adam", slug: "dr-brian-adam", specialty: "Restorative Dentist", bio: "Dr. Brian Adam specializes in restorative dentistry, helping patients restore their smiles." },
  ]

  for (const member of teamMembers) {
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.TEAM_MEMBER, slug: member.slug } },
      update: { title: member.name, excerpt: member.specialty, body: member.bio, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.TEAM_MEMBER,
        slug: member.slug,
        title: member.name,
        excerpt: member.specialty,
        body: member.bio,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        teamMember: {
          create: {
            specialty: member.specialty,
            bio: member.bio,
            sortOrder: teamMembers.indexOf(member),
          },
        },
      },
    })
  }
  console.log("✅ Created Team Members:", teamMembers.length)

  // 5. Create Testimonials
  const testimonials = [
    { clientName: "Eric Dimgba", quote: "The support was great, the staff was very helpful and the products were top notch." },
    { clientName: "Sanni Vivian", quote: "Their services are great, unique, smart and fast, hard to find anywhere in the country." },
    { clientName: "Mary James", quote: "They have great facilities and quality equipments, best of its kind anywhere in the country." },
    { clientName: "Lucy Brown", quote: "I am over the moon with my smile and no longer feel self-conscious about my missing tooth." },
  ]

  for (const t of testimonials) {
    const slug = t.clientName.toLowerCase().replace(/\s+/g, "-")
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.TESTIMONIAL, slug } },
      update: { title: t.clientName, excerpt: t.quote, body: t.quote, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.TESTIMONIAL,
        slug,
        title: t.clientName,
        excerpt: t.quote,
        body: t.quote,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        testimonial: {
          create: {
            clientName: t.clientName,
            clientTitle: "Patient",
            rating: 5,
            sortOrder: testimonials.indexOf(t),
          },
        },
      },
    })
  }
  console.log("✅ Created Testimonials:", testimonials.length)

  // 6. Create Standalone FAQs
  const faqs = [
    { question: "What kind of toothbrush is recommended?", answer: "We recommend using a soft-bristled toothbrush with a small head. Electric toothbrushes can also be very effective when used properly.", category: "general" },
    { question: "How can I prevent gum disease?", answer: "Brush your teeth twice daily, floss daily, eat a balanced diet, avoid tobacco, and visit your dentist regularly for check-ups and cleanings.", category: "hygiene" },
    { question: "What causes bad breath?", answer: "Bad breath can be caused by food, poor oral hygiene, gum disease, dry mouth, or medical conditions. Regular brushing, flossing, and dental visits can help.", category: "hygiene" },
    { question: "Is teeth whitening safe?", answer: "Yes, professional teeth whitening is safe and effective. We use clinically proven treatments that protect your enamel while brightening your smile.", category: "treatment" },
    { question: "How often should I visit the dentist?", answer: "We recommend visiting the dentist every 6 months for routine check-ups and professional cleaning.", category: "general" },
  ]

  for (const faq of faqs) {
    const slug = faq.question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.FAQ, slug } },
      update: { title: faq.question, excerpt: faq.question, body: faq.answer, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.FAQ,
        slug,
        title: faq.question,
        excerpt: faq.question,
        body: faq.answer,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        faq: {
          create: {
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            isStandalone: true,
            sortOrder: faqs.indexOf(faq),
          },
        },
      },
    })
  }
  console.log("✅ Created FAQs:", faqs.length)

  // 7. Create Default Settings
  const settings = [
    { key: "site.name", value: "32Smiles Dental Clinic", group: "general", label: "Site Name" },
    { key: "site.tagline", value: "Dental Care Solution", group: "general", label: "Tagline" },
    { key: "site.description", value: "Premium dental care in Victoria Island, Lagos. Services include teeth whitening, root canal, dental implants, and cosmetic dentistry.", group: "general", label: "Site Description" },
    { key: "contact.phone", value: "+(234) 810 368 7424", group: "contact", label: "Phone Number" },
    { key: "contact.email", value: "admin@32smiles.com", group: "contact", label: "Email Address" },
    { key: "contact.address", value: "3B Fabac Close, off Ligali Ayorinde Street, Victoria Island, Lagos, Nigeria", group: "contact", label: "Address" },
    { key: "business.hours.monday", value: "8:00am - 4:30pm", group: "business", label: "Monday Hours" },
    { key: "business.hours.tuesday", value: "8:00am - 4:30pm", group: "business", label: "Tuesday Hours" },
    { key: "business.hours.wednesday", value: "8:00am - 4:30pm", group: "business", label: "Wednesday Hours" },
    { key: "business.hours.thursday", value: "8:00am - 4:30pm", group: "business", label: "Thursday Hours" },
    { key: "business.hours.friday", value: "8:00am - 3:00pm", group: "business", label: "Friday Hours" },
    { key: "business.hours.saturday", value: "Closed", group: "business", label: "Saturday Hours" },
    { key: "business.hours.sunday", value: "8:00am - 4:30pm", group: "business", label: "Sunday Hours" },
    { key: "seo.defaultTitle", value: "32Smiles Dental Clinic | Dental Care in Lagos", group: "seo", label: "Default Meta Title" },
    { key: "seo.defaultDescription", value: "Premium dental care in Victoria Island, Lagos. Services include teeth whitening, root canal, dental implants, and cosmetic dentistry.", group: "seo", label: "Default Meta Description" },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log("✅ Created Settings:", settings.length)

  // 8. Create Default Brand Voice
  await prisma.brandVoice.upsert({
    where: { name: "Professional & Warm" },
    update: {},
    create: {
      name: "Professional & Warm",
      description: "Default brand voice for 32Smiles Dental Clinic",
      tone: "professional",
      personality: "caring, knowledgeable, approachable, trustworthy, confident",
      vocabulary: "we, our team, your smile, dental health, oral care, gentle, comfortable, personalized",
      avoidWords: "pain, scary, hurt, cheap, discount, budget, expensive",
      writingStyle: "Short to medium sentences. Use active voice. Begin paragraphs with the most important information. Use bullet points for lists.",
      targetAudience: "patients",
      isDefault: true,
      isActive: true,
      systemPrompt: `You are a content writer for 32Smiles Dental Clinic, a premium dental practice in Victoria Island, Lagos, Nigeria.\n\nBrand Voice:\n- Tone: Professional, warm, and caring\n- We speak with authority but always with empathy\n- We educate without being condescending\n- We use simple, clear language accessible to everyone\n\nWriting Guidelines:\n- Always be factual and evidence-based\n- Include practical, actionable advice\n- Use "we" and "our" when referring to the clinic\n- Use "you" and "your" when addressing the reader\n- End content with a call-to-action or encouraging statement`,
    },
  })
  console.log("✅ Created Default Brand Voice")

  // 9. Create Default Prompt Templates
  const templates = [
    {
      name: "blog-post",
      category: "content",
      description: "Generate a dental clinic blog article",
      template: `Write a blog article about {{topic}} for {{audience}} audience.\n\nWord count: approximately {{word_count}} words.\nTone: {{tone}}\n\nInclude practical tips and end with a call-to-action.`,
      systemPrompt: "You are a professional dental content writer for 32Smiles Dental Clinic in Lagos, Nigeria.",
    },
    {
      name: "service-description",
      category: "content",
      description: "Generate a service page description",
      template: `Write a service description for {{service_name}}.\n\nKey benefits: {{benefits}}\nTarget audience: {{audience}}\n\nInclude what the service involves, who it's for, and why patients should choose 32Smiles.`,
      systemPrompt: "You are a dental content writer specializing in service descriptions.",
    },
    {
      name: "seo-meta",
      category: "seo",
      description: "Generate SEO meta tags",
      template: `Generate SEO meta tags for a page about {{topic}}.\n\nProvide:\n1. Meta title (under 60 characters)\n2. Meta description (under 160 characters)\n3. Focus keyword\n4. Open Graph title\n5. Open Graph description`,
      systemPrompt: "You are an SEO specialist for a dental clinic website.",
    },
    {
      name: "image-prompt",
      category: "image",
      description: "Generate image prompts for DALL-E/Midjourney",
      template: `Generate a detailed image prompt for: {{description}}\n\nStyle: {{style}}\nAspect ratio: {{aspect_ratio}}\n\nThe image should be professional and suitable for a dental clinic website.`,
      systemPrompt: "You are an expert at writing image generation prompts for AI art tools.",
    },
  ]

  for (const template of templates) {
    await prisma.promptTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: {
        name: template.name,
        category: template.category,
        description: template.description,
        template: template.template,
        systemPrompt: template.systemPrompt,
        isActive: true,
        isSystem: true,
      },
    })
  }
  console.log("✅ Created Prompt Templates:", templates.length)

  // 10. Create Default AI Provider Configs
  const providers = [
    { provider: AIProvider.OPENAI, displayName: "OpenAI", defaultModel: "gpt-4o-mini", priority: 2 },
    { provider: AIProvider.ANTHROPIC, displayName: "Anthropic", defaultModel: "claude-sonnet-4-20250514", priority: 1 },
    { provider: AIProvider.GEMINI, displayName: "Google Gemini", defaultModel: "gemini-2.5-flash", priority: 3 },
    { provider: AIProvider.GROQ, displayName: "Groq", defaultModel: "llama-3.3-70b-versatile", priority: 4 },
    { provider: AIProvider.OLLAMA, displayName: "Ollama (Local)", defaultModel: "llama3.3", priority: 99 },
  ]

  for (const provider of providers) {
    await prisma.aIProviderConfig.upsert({
      where: { provider: provider.provider },
      update: {},
      create: {
        ...provider,
        status: "INACTIVE",
      },
    })
  }
  console.log("✅ Created AI Provider Configs:", providers.length)

  // 11. Create Blog Posts (from original HTML site)
  const blogPosts = [
    {
      title: "Why You Have Bad Breath & How to Treat It",
      slug: "why-you-have-bad-breath",
      excerpt: "It's normal to get embarrassed by bad breath. Imagine how confident you would feel if you knew what caused bad breath, and how to treat it.",
      body: `<p>It's normal to get embarrassed by bad breath, and for the most part in many social settings, it can lead to an embarrassing situation. But imagine how confident you would feel if you knew what caused bad breath, and how to treat it?</p><h3>What Causes Bad Breath?</h3><p>Bad breath (halitosis) can be caused by a number of factors:</p><ul><li><strong>Poor oral hygiene:</strong> Food particles remaining in the mouth can cause bacterial growth and odor.</li><li><strong>Gum disease:</strong> Persistent bad breath may be a sign of gum disease.</li><li><strong>Dry mouth:</strong> Saliva helps clean the mouth, and when reduced, bacteria thrive.</li><li><strong>Food:</strong> Garlic, onions, and certain spices can cause bad breath.</li><li><strong>Medical conditions:</strong> Some diseases, such as respiratory infections, diabetes, and liver or kidney problems, can cause bad breath.</li></ul><h3>How to Treat Bad Breath</h3><p>The best way to improve bad breath is to maintain good oral hygiene. Brush your teeth twice daily, clean between your teeth with floss daily, and clean your tongue regularly. Visit your dentist regularly for checkups and professional cleanings.</p><p>If bad breath persists despite good oral hygiene, consult your dentist to rule out any underlying dental or medical conditions.</p>`,
      readingTime: 5,
    },
    {
      title: "Straight Teeth: The Medical Benefits of Braces",
      slug: "straight-teeth-medical-benefits-braces",
      excerpt: "Braces have become a common treatment for both teenagers and adults who want a straighter, more beautiful looking smile. But there are also medical benefits.",
      body: `<p>Braces have become a common treatment for both teenagers and adults who want a straighter, more beautiful looking smile. A pretty smile is nice, but there are also medical benefits of braces, some of which may surprise you.</p><h3>Beyond Cosmetics</h3><p>Straight teeth aren't just about appearance. Properly aligned teeth can:</p><ul><li><strong>Improve oral hygiene:</strong> Straight teeth are easier to brush and floss, reducing the risk of cavities and gum disease.</li><li><strong>Prevent jaw problems:</strong> Misaligned teeth can cause uneven wear, jaw pain, and temporomandibular joint (TMJ) disorders.</li><li><strong>Improve digestion:</strong> Properly aligned teeth chew food more effectively, aiding digestion.</li><li><strong>Reduce speech problems:</strong> Teeth alignment can affect speech clarity.</li><li><strong>Boost self-confidence:</strong> A beautiful smile can improve self-esteem and social interactions.</li></ul><h3>When to Consider Braces</h3><p>It's never too late to improve your smile. Modern orthodontic treatments offer options for patients of all ages, including clear aligners and ceramic braces that are less noticeable than traditional metal braces.</p>`,
      readingTime: 4,
    },
    {
      title: "Botox In Dentistry: The Next Big Thing?",
      slug: "botox-in-dentistry",
      excerpt: "When you think about Botox you think about maintaining youthful appearance. But Botox is also becoming popular in dentistry for various treatments.",
      body: `<p>When you think about Botox, chances are good you think about having it done to maintain a youthful appearance. You wouldn't be wrong – Botox is by far the most popular cosmetic treatment in the world. But did you know that Botox is also making its way into dentistry?</p><h3>Dental Applications of Botox</h3><p>Dentists are increasingly using Botox for:</p><ul><li><strong>Treatment of TMJ disorders:</strong> Botox can help relax the jaw muscles, reducing pain and discomfort associated with TMJ.</li><li><strong>Teeth grinding (bruxism):</strong> Botox injections can reduce the intensity of teeth grinding, protecting teeth from damage.</li><li><strong>Gummy smile correction:</strong> Botox can be used to relax the muscles that pull the lip too high, reducing the appearance of excess gum tissue.</li><li><strong>Facial aesthetics:</strong> Dentists have an intimate knowledge of facial anatomy, making them well-suited for aesthetic treatments.</li></ul><h3>Is It Safe?</h3><p>When performed by a trained professional, Botox treatments in dentistry are safe and effective. The effects are temporary, typically lasting 3-6 months, and the procedure is quick with minimal downtime.</p>`,
      readingTime: 4,
    },
    {
      title: "How Often Should I Replace My Toothbrush?",
      slug: "how-often-replace-toothbrush",
      excerpt: "When was the last time you replaced your toothbrush? We throw out expired foods and replace beauty products, but often neglect our toothbrushes.",
      body: `<p>When was the last time you replaced your toothbrush? We throw out expired foods, restock vitamins and supplements, and replace our beauty products often, but when it comes to health and hygiene items like our toothbrush, many of us fall behind.</p><h3>The Recommendation</h3><p>The American Dental Association recommends replacing your toothbrush every <strong>three to four months</strong>, or sooner if the bristles become frayed. You should also replace your toothbrush after being sick, as bacteria can remain on the bristles.</p><h3>Why It Matters</h3><p>An old, worn-out toothbrush is less effective at removing plaque and food particles from your teeth and gums. This can lead to:</p><ul><li>Increased risk of cavities</li><li>Higher chance of gum disease</li><li>Bacterial growth on old bristles</li><li>Less effective cleaning overall</li></ul><h3>Tips for Toothbrush Care</h3><p>Store your toothbrush upright in a holder where it can air dry. Keep it away from other toothbrushes to prevent cross-contamination. Never share your toothbrush with others, and rinse it thoroughly after each use.</p>`,
      readingTime: 3,
    },
  ]

  for (const post of blogPosts) {
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.BLOG_POST, slug: post.slug } },
      update: { title: post.title, excerpt: post.excerpt, body: post.body, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.BLOG_POST,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        blogPost: {
          create: {
            readingTime: post.readingTime,
            isFeatured: false,
          },
        },
      },
    })
  }
  console.log("✅ Created Blog Posts:", blogPosts.length)

  // 12. Create Patient Education Articles
  const educationArticles = [
    {
      title: "Dental Hygiene & Prevention",
      slug: "dental-hygiene-prevention",
      excerpt: "As professional dentists, we believe in helping prevent disease from occurring in the first place, by promoting oral and overall health.",
      body: `<p>As professional dentists, we believe in helping prevent disease from occurring in the first place, by promoting oral and overall health. Many links have been found between poor oral health, heart disease, diabetes, pneumonia and preterm and low birth infants.</p><p>We want you to keep your natural teeth healthy and vibrant for your entire life, because your teeth are magnificent just the way they are. With good daily care, optimal overall health and regular dental care you will be well on your way to achieving this goal.</p><p>Regular dental appointments for checkups and cleaning are vital for the prevention of problems and for the early detection of small problems before they become magnified. Upon examination, your dentist will determine if signs and symptoms of clinical oral disease are present and if your regular dental routine is meeting your target goals.</p><p>Professional cleaning, including the removal of plaque and tartar are vital in preventing gum disease and other oral health concerns. Only a professional dentist has the expertise, competence, education and ability to successfully oversee your oral health.</p><blockquote>Every tooth in a man's head is more valuable than a diamond. — Miguel de Cervantes, Don Quixote, 1605</blockquote><p>A review of your oral hygiene techniques may be a part of the care you receive in our dental clinic. Recommendations for toothbrush type, toothpaste, floss and dental products can be discussed.</p><h3>Frequently Asked Questions</h3><p><strong>Q. Why is brushing important?</strong><br/>Daily brushing and cleaning between your teeth is important because it removes plaque. If the plaque isn't removed, it continues to build up, feeding on the food debris left behind and causing tooth decay and gum disease.</p><p><strong>Q. How can I prevent gum disease?</strong><br/>It is important to remove plaque and food debris from around your teeth, as this will stop your gums from swelling and becoming infected. If you leave plaque on your teeth it can develop into tartar, which can only be removed by the dentist or hygienist.</p><p><strong>Q. How do I know if I have gum disease?</strong><br/>Gum disease (gingivitis) will show itself as red, swollen gums that bleed when brushed or flossed. It is important that you continue to clean regularly and firmly in order to fight the condition.</p>`,
      category: "patient",
    },
    {
      title: "Proper Brushing Techniques",
      slug: "proper-brushing-techniques",
      excerpt: "Learn the correct way to brush your teeth for optimal oral health and to prevent common dental problems.",
      body: `<p>Brushing your teeth seems straightforward, but many people don't brush correctly. Proper brushing techniques can make a significant difference in your oral health.</p><h3>Step-by-Step Guide</h3><ol><li>Place your toothbrush at a 45-degree angle to the gums</li><li>Gently move the brush back and forth in short (tooth-wide) strokes</li><li>Brush the outer surfaces, inner surfaces, and chewing surfaces of the teeth</li><li>To clean the inside surfaces of the front teeth, tilt the brush vertically and make several up-and-down strokes</li><li>Brush your tongue to remove bacteria and freshen your breath</li></ol><h3>How Long Should You Brush?</h3><p>The ADA recommends brushing for at least two minutes, twice a day. Use a timer or play a two-minute song to ensure you're brushing long enough.</p><h3>Choosing the Right Toothbrush</h3><p>Use a soft-bristled toothbrush that fits comfortably in your mouth. Replace your toothbrush every three to four months, or sooner if the bristles are frayed.</p>`,
      category: "patient",
    },
    {
      title: "Understanding Tooth Sensitivity",
      slug: "understanding-tooth-sensitivity",
      excerpt: "Tooth sensitivity is a common dental problem that affects millions of people. Learn what causes it and how to manage it.",
      body: `<p>Tooth sensitivity occurs when the dentin beneath the tooth enamel becomes exposed. This can cause pain or discomfort when teeth are exposed to hot, cold, sweet, or acidic foods and drinks.</p><h3>Common Causes</h3><ul><li>Brushing too hard or using a hard-bristled toothbrush</li><li>Tooth erosion from acidic foods and drinks</li><li>Gum recession exposing the root surface</li><li>Tooth decay or cracked teeth</li><li>Teeth grinding (bruxism)</li></ul><h3>How to Manage Sensitivity</h3><p>Use a soft-bristled toothbrush and gentle brushing technique. Try desensitizing toothpaste, which contains compounds that help block sensation from reaching the nerve. Avoid highly acidic foods and drinks. If sensitivity persists, consult your dentist for professional treatments such as fluoride application, dental bonding, or gum grafts.</p>`,
      category: "patient",
    },
    {
      title: "Oral Health and Overall Wellness",
      slug: "oral-health-overall-wellness",
      excerpt: "Research shows a strong connection between oral health and overall body health. Learn how your smile affects your whole body.",
      body: `<p>Your oral health is a window to your overall health. Problems in your mouth can affect the rest of your body, and certain systemic diseases can also affect your oral health.</p><h3>The Oral-Systemic Connection</h3><p>Research has linked poor oral health to:</p><ul><li><strong>Heart disease:</strong> Bacteria from gum disease can enter the bloodstream and contribute to heart disease and stroke.</li><li><strong>Diabetes:</strong> Gum disease can make it harder to control blood sugar levels.</li><li><strong>Respiratory infections:</strong> Bacteria from the mouth can be inhaled into the lungs.</li><li><strong>Pregnancy complications:</strong> Gum disease has been linked to premature birth and low birth weight.</li></ul><h3>Protecting Your Health</h3><p>Maintain good oral hygiene, eat a balanced diet, avoid tobacco products, and visit your dentist regularly. These simple steps can help protect both your oral and overall health.</p>`,
      category: "patient",
    },
    {
      title: "Caring for Your Child's Teeth",
      slug: "caring-for-your-childs-teeth",
      excerpt: "Good oral health habits start early. Learn how to care for your child's teeth from infancy through adolescence.",
      body: `<p>Establishing good oral health habits early in life sets the foundation for a lifetime of healthy smiles.</p><h3>Infants (0-12 months)</h3><p>Even before teeth appear, clean your baby's gums with a soft, damp cloth after feedings. When the first teeth erupt, brush them with a soft-bristled, infant-sized toothbrush and a smear of fluoride toothpaste.</p><h3>Toddlers (1-3 years)</h3><p>Use a pea-sized amount of fluoride toothpaste. Supervise brushing to ensure your child doesn't swallow toothpaste. Start flossing when two teeth touch.</p><h3>Children (3-6 years)</h3><p>Children can begin brushing their own teeth but should be supervised. Use a pea-sized amount of fluoride toothpaste. Encourage regular flossing.</p><h3>First Dental Visit</h3><p>Schedule your child's first dental visit by their first birthday or within six months of the first tooth erupting. Early dental visits help prevent problems and establish a dental home.</p><h3>Sealants and Fluoride</h3><p>Ask your dentist about dental sealants for your child's permanent molars. Sealants protect the grooves in teeth where food and bacteria can get trapped. Fluoride treatments may also be recommended.</p>`,
      category: "patient",
    },
  ]

  for (const article of educationArticles) {
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.EDUCATION_PATIENT, slug: article.slug } },
      update: { title: article.title, excerpt: article.excerpt, body: article.body, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.EDUCATION_PATIENT,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        educationArticle: {
          create: {
            educationType: article.category,
          },
        },
      },
    })
  }
  console.log("✅ Created Education Articles:", educationArticles.length)

  // 13. Create Products
  const products = [
    { name: "Colgate Total Pro-Shield", slug: "colgate-total-pro-shield", price: 2500, description: "12-hour antibacterial protection for a healthy mouth. Kills 99% of germs on contact.", category: "toothpaste", rating: 4.5, brand: "Colgate" },
    { name: "Sensodyne Pronamel", slug: "sensodyne-pronamel", price: 3200, description: "Protects against acid erosion and strengthens enamel. Ideal for sensitive teeth.", category: "toothpaste", rating: 4.7, brand: "Sensodyne" },
    { name: "Oral-B Pro-Health Toothpaste", slug: "oral-b-pro-health", price: 2800, description: "Comprehensive protection against cavities, plaque, and gingivitis.", category: "toothpaste", rating: 4.3, brand: "Oral-B" },
    { name: "Listerine Cool Mint", slug: "listerine-cool-mint", price: 3500, description: "Kills germs that cause bad breath, plaque, and gum disease. Cool mint flavor.", category: "mouthwash", rating: 4.4, brand: "Listerine" },
    { name: "Colgate Plax Fresh Mint", slug: "colgate-plax-fresh-mint", price: 2200, description: "Fresh breath protection that fights germs for 12 hours. Alcohol-free formula.", category: "mouthwash", rating: 4.2, brand: "Colgate" },
    { name: "Oral-B Pro-Health Rinse", slug: "oral-b-pro-health-rinse", price: 3000, description: "Multi-protection mouthwash that helps prevent cavities, plaque, and bad breath.", category: "mouthwash", rating: 4.1, brand: "Oral-B" },
    { name: "Oral-B Pro Series Toothbrush", slug: "oral-b-pro-series", price: 4500, description: "Round head toothbrush for deeper cleaning. CrossAction bristles remove more plaque.", category: "brushes", rating: 4.6, brand: "Oral-B" },
    { name: "Colgate 360° Toothbrush", slug: "colgate-360", price: 2000, description: "Cleans teeth, cheeks, tongue, and gums. Features cheek and tongue cleaners.", category: "brushes", rating: 4.3, brand: "Colgate" },
    { name: "Philips Sonicare DiamondClean", slug: "philips-sonicare-diamondclean", price: 45000, description: "Premium electric toothbrush with 5 cleaning modes and smart sensor technology.", category: "brushes", rating: 4.9, brand: "Philips" },
    { name: "Oral-B Kids Electric Toothbrush", slug: "oral-b-kids-electric", price: 12000, description: "Fun electric toothbrush for kids with timer and pressure sensor. Disney characters.", category: "kids", rating: 4.5, brand: "Oral-B" },
    { name: "Colgate Kids Toothpaste", slug: "colgate-kids-toothpaste", price: 1800, description: "Mild fluoride formula safe for children. Fun bubble fruit flavor.", category: "kids", rating: 4.4, brand: "Colgate" },
    { name: "Philips Sonicare AirFloss", slug: "philips-sonicare-airfloss", price: 35000, description: "Interdental cleaner that uses air and micro-droplets to clean between teeth.", category: "electrical", rating: 4.5, brand: "Philips" },
    { name: "Oral-B Water Flosser", slug: "oral-b-water-flosser", price: 28000, description: "Removes up to 99.9% of plaque from treated areas. 3 pressure settings.", category: "electrical", rating: 4.6, brand: "Oral-B" },
    { name: "Dental Floss Picks", slug: "dental-floss-picks", price: 1500, description: "Convenient floss picks with comfortable grip. Pre-threaded for easy use.", category: "general", rating: 4.2, brand: "Generic" },
    { name: "Interdental Brushes", slug: "interdental-brushes", price: 2500, description: "Small brushes for cleaning between teeth and around dental work. Multiple sizes.", category: "general", rating: 4.3, brand: "TePe" },
  ]

  const categoryMap: Record<string, string> = {
    toothpaste: "toothpaste",
    mouthwash: "toothpaste",
    brushes: "brushes",
    kids: "kids",
    electrical: "electrical",
    general: "general",
  }

  for (const product of products) {
    const catSlug = categoryMap[product.category]
    const cat = await prisma.productCategory.findUnique({ where: { slug: catSlug } })
    if (!cat) throw new Error(`Category "${catSlug}" not found for product "${product.name}"`)
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.PRODUCT, slug: product.slug } },
      update: { title: product.name, excerpt: product.description, body: product.description, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.PRODUCT,
        slug: product.slug,
        title: product.name,
        excerpt: product.description,
        body: product.description,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        product: {
          create: {
            price: product.price,
            productCategoryId: cat.id,
            rating: product.rating,
            reviewCount: Math.floor(Math.random() * 50) + 10,
            brand: product.brand,
            inStock: true,
            isFeatured: products.indexOf(product) < 4,
            isOnSale: false,
            isHot: products.indexOf(product) < 2,
          },
        },
      },
    })
  }
  console.log("✅ Created Products:", products.length)

  // 14. Create Gallery Items
  const galleryItems = [
    { title: "Clinic Reception", slug: "clinic-reception", caption: "Welcome to 32Smiles Dental Clinic", category: "clinic" },
    { title: "Treatment Room", slug: "treatment-room", caption: "Modern treatment rooms with state-of-the-art equipment", category: "clinic" },
    { title: "Smile Transformation", slug: "smile-transformation-1", caption: "Before and after smile makeover", category: "transformations" },
    { title: "Dental Equipment", slug: "dental-equipment", caption: "Advanced dental technology", category: "clinic" },
    { title: "Patient Consultation", slug: "patient-consultation", caption: "Personalized patient care", category: "team" },
    { title: "Our Team", slug: "our-team", caption: "Meet our experienced dental team", category: "team" },
  ]

  for (const item of galleryItems) {
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.GALLERY_ITEM, slug: item.slug } },
      update: { title: item.title, excerpt: item.caption, body: item.caption, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.GALLERY_ITEM,
        slug: item.slug,
        title: item.title,
        excerpt: item.caption,
        body: item.caption,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        galleryItem: {
          create: {
            category: item.category,
            caption: item.caption,
            altText: item.title,
            sortOrder: galleryItems.indexOf(item),
          },
        },
      },
    })
  }
  console.log("✅ Created Gallery Items:", galleryItems.length)

  // 15. Create Image Settings (with default fallback paths)
  const imageSettings = [
    // Hero backgrounds
    { key: "hero_bg_homepage", value: "/images/bg/bg1.jpg", group: "images", label: "Hero - Homepage" },
    { key: "hero_bg_homepage_cta", value: "/images/bg/bg2.jpg", group: "images", label: "Hero - Homepage CTA" },
    { key: "hero_bg_about", value: "/images/bg/bg1.jpg", group: "images", label: "Hero - About" },
    { key: "hero_bg_services", value: "/images/bg/bg5.jpg", group: "images", label: "Hero - Services" },
    { key: "hero_bg_products", value: "/images/bg/bg6.jpg", group: "images", label: "Hero - Products" },
    { key: "hero_bg_blog", value: "/images/bg/bg4.jpg", group: "images", label: "Hero - Blog" },
    { key: "hero_bg_gallery", value: "/images/bg/bg3.jpg", group: "images", label: "Hero - Gallery" },
    { key: "hero_bg_team", value: "/images/bg/bg9.jpg", group: "images", label: "Hero - Team" },
    { key: "hero_bg_insurance", value: "/images/bg/bg3.jpg", group: "images", label: "Hero - Insurance" },
    { key: "hero_bg_faq", value: "/images/bg/bg7.jpg", group: "images", label: "Hero - FAQ" },
    { key: "hero_bg_contact", value: "/images/bg/bg8.jpg", group: "images", label: "Hero - Contact" },
    { key: "hero_bg_cart", value: "/images/bg/bg6.jpg", group: "images", label: "Hero - Cart" },
    { key: "hero_bg_appointment", value: "/images/bg/bg12.jpg", group: "images", label: "Hero - Appointment" },
    { key: "hero_bg_education_patient", value: "/images/bg/bg10.jpg", group: "images", label: "Hero - Patient Education" },
    { key: "hero_bg_education_professional", value: "/images/bg/bg11.jpg", group: "images", label: "Hero - Professional Education" },
    // Other images
    { key: "about_story_image", value: "/images/about/dc1.png", group: "images", label: "About - Story Image" },
    { key: "homepage_slider_image", value: "/images/gallery/3.jpg", group: "images", label: "Homepage - Slider Image" },
    { key: "testimonial_avatar_1", value: "/images/testimonials/1.png", group: "images", label: "Testimonial - Avatar 1" },
    { key: "testimonial_avatar_2", value: "/images/testimonials/2.png", group: "images", label: "Testimonial - Avatar 2" },
    { key: "testimonial_avatar_3", value: "/images/testimonials/3.png", group: "images", label: "Testimonial - Avatar 3" },
    { key: "testimonial_avatar_4", value: "/images/testimonials/1.jpg", group: "images", label: "Testimonial - Avatar 4" },
    // Fallback image arrays (stored as JSON)
    { key: "gallery_fallback_images", value: JSON.stringify([
      { id: "1", title: "Clinic Interior", imageUrl: "/images/gallery/1.jpg", fullImageUrl: "/images/gallery/full/1.jpg", category: "clinic" },
      { id: "2", title: "Dental Equipment", imageUrl: "/images/gallery/2.jpg", fullImageUrl: "/images/gallery/full/2.jpg", category: "clinic" },
      { id: "3", title: "Smile Transformation", imageUrl: "/images/gallery/3.jpg", fullImageUrl: "/images/gallery/full/3.jpg", category: "transformations" },
      { id: "4", title: "Before & After", imageUrl: "/images/gallery/4.jpg", fullImageUrl: "/images/gallery/full/4.jpg", category: "transformations" },
      { id: "5", title: "Treatment Room", imageUrl: "/images/gallery/5.jpg", fullImageUrl: "/images/gallery/full/5.jpg", category: "clinic" },
      { id: "6", title: "Happy Patient", imageUrl: "/images/gallery/6.jpg", fullImageUrl: "/images/gallery/full/6.jpg", category: "team" },
      { id: "7", title: "Modern Technology", imageUrl: "/images/gallery/7.jpg", fullImageUrl: "/images/gallery/full/7.jpg", category: "clinic" },
      { id: "8", title: "Dental Procedure", imageUrl: "/images/gallery/8.jpg", fullImageUrl: "/images/gallery/full/8.jpg", category: "clinic" },
      { id: "9", title: "Our Clinic", imageUrl: "/images/gallery/9.jpg", fullImageUrl: "/images/gallery/full/9.jpg", category: "clinic" },
    ]), group: "images", label: "Gallery Fallback Images" },
    { key: "team_fallback_photos", value: JSON.stringify([
      { id: "f1", name: "Dr. Sarah Johnson", photoUrl: "/images/team/1.jpg" },
      { id: "f2", name: "Dr. Michael Chen", photoUrl: "/images/team/2.jpg" },
      { id: "f3", name: "Dr. Emily Rodriguez", photoUrl: "/images/team/3.jpg" },
      { id: "f4", name: "Dr. James Okafor", photoUrl: "/images/team/4.jpg" },
    ]), group: "images", label: "Team Fallback Photos" },
    { key: "blog_fallback_images", value: JSON.stringify(["/images/blog/1.jpg", "/images/blog/2.jpg", "/images/blog/3.jpg"]), group: "images", label: "Blog Fallback Images" },
    { key: "before_after_fallback_images", value: JSON.stringify(["/images/before-after/1.jpg", "/images/before-after/2.jpg", "/images/before-after/3.jpg"]), group: "images", label: "Before/After Fallback Images" },
    { key: "service_fallback_images", value: JSON.stringify({ "root-canal": "/images/services/1.jpg", "teeth-whitening": "/images/services/2.jpg", "dental-implants": "/images/services/3.jpg", "cosmetic-dentistry": "/images/services/b1.jpg", "wisdom-teeth": "/images/services/single-service.jpg", "general-dentistry": "/images/services/1.jpg" }), group: "images", label: "Service Fallback Images" },
    { key: "product_fallback_images", value: JSON.stringify({ "professional-toothpaste": "/images/services/1.jpg", "electric-toothbrush": "/images/services/2.jpg", "dental-floss": "/images/services/3.jpg", "mouthwash": "/images/services/b1.jpg", "teeth-whitening-kit": "/images/services/single-service.jpg", "oral-irrigator": "/images/services/1.jpg" }), group: "images", label: "Product Fallback Images" },
  ]

  for (const setting of imageSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, group: setting.group },
      create: setting,
    })
  }
  console.log("✅ Created Image Settings:", imageSettings.length)

  console.log("\n🎉 Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
