import "dotenv/config"
import { PrismaClient, ContentType, ContentStatus, AIProvider } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding demo database (Bangalore)...")

  // ── 1. Demo accounts ───────────────────────────────────────────────
  // Static passwords because demo emails are .local (no delivery possible).
  const accounts: { email: string; password: string; name: string; role: string; phone?: string; address?: string }[] = [
    { email: "superadmin@demo.local", password: "Superadmin123!", name: "Super Admin", role: "SUPER_ADMIN", phone: "+919845001122", address: "24, 27th Main Road, HSR Layout, Bengaluru 560102" },
    { email: "admin@demo.local", password: "Admin123!", name: "Clinic Admin", role: "ADMIN", phone: "+919845001122", address: "24, 27th Main Road, HSR Layout, Bengaluru 560102" },
    { email: "editor@demo.local", password: "Editor123!", name: "Content Editor", role: "EDITOR", phone: "+919845001122", address: "24, 27th Main Road, HSR Layout, Bengaluru 560102" },
    { email: "receptionist@demo.local", password: "Receptionist123!", name: "Receptionist", role: "RECEPTIONIST", phone: "+919845001122", address: "24, 27th Main Road, HSR Layout, Bengaluru 560102" },
    { email: "patient@demo.local", password: "Patient123!", name: "Demo Patient", role: "VIEWER", phone: "+919845001122", address: "24, 27th Main Road, HSR Layout, Bengaluru 560102" },
  ]

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12)
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, role: account.role, name: account.name, isActive: true, phone: account.phone, address: account.address },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
        isActive: true,
        phone: account.phone,
        address: account.address,
      },
    })
    console.log("✅ Account ready:", user.email, `(${account.role})`)
  }

  const superAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: "superadmin@demo.local" },
    select: { id: true },
  })

  // ── 2. Settings ─────────────────────────────────────────────────────
  const settings = [
    { key: "site.name", value: "32 Smiles Multispeciality Dental Clinics", group: "general", label: "Site Name" },
    { key: "site.tagline", value: "Best Dental Clinic in Bangalore", group: "general", label: "Tagline" },
    { key: "site.description", value: "Multi-speciality dental care in Bangalore since 2005. Root canals, dental implants, Invisalign, laser dentistry and more across 9 branches.", group: "general", label: "Site Description" },
    { key: "contact.phone", value: "+91-9482712345", group: "contact", label: "Phone Number" },
    { key: "contact.email", value: "appointments@32smilesdemo.local", group: "contact", label: "Email Address" },
    { key: "contact.address", value: "HSR Layout, Bengaluru, Karnataka, India", group: "contact", label: "Address" },
    { key: "business.hours.monday", value: "10:00 AM - 9:00 PM", group: "business", label: "Monday Hours" },
    { key: "business.hours.tuesday", value: "10:00 AM - 9:00 PM", group: "business", label: "Tuesday Hours" },
    { key: "business.hours.wednesday", value: "10:00 AM - 9:00 PM", group: "business", label: "Wednesday Hours" },
    { key: "business.hours.thursday", value: "10:00 AM - 9:00 PM", group: "business", label: "Thursday Hours" },
    { key: "business.hours.friday", value: "10:00 AM - 9:00 PM", group: "business", label: "Friday Hours" },
    { key: "business.hours.saturday", value: "10:00 AM - 9:00 PM", group: "business", label: "Saturday Hours" },
    { key: "business.hours.sunday", value: "10:00 AM - 9:00 PM", group: "business", label: "Sunday Hours" },
    { key: "seo.defaultTitle", value: "32 Smiles Multispeciality Dental Clinics | Best Dental Clinic in Bangalore", group: "seo", label: "Default Meta Title" },
    { key: "seo.defaultDescription", value: "32 Smiles is a leading multi-speciality dental clinic in Bangalore with 9 branches. Root canals, implants, Invisalign, laser dentistry, child dental care and more.", group: "seo", label: "Default Meta Description" },
    { key: "stats_years", value: "20", group: "content", label: "Years of Experience" },
    { key: "stats_patients", value: "5000", group: "content", label: "Happy Patients" },
    { key: "stats_satisfaction", value: "98", group: "content", label: "Satisfaction Rate" },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log("✅ Created Settings:", settings.length)

  // ── 3. Services (14 treatments; original copy, no invented prices) ──
  const services = [
    {
      title: "Invisalign / Clear Aligners",
      slug: "invisalign-clear-aligners",
      excerpt: "Nearly invisible, removable aligners that gently straighten your teeth without traditional metal braces.",
      body: "<p>Invisalign and clear aligner therapy use a series of custom-made, transparent trays to move your teeth into their ideal positions. Because the aligners are removable, you can eat, brush and floss normally throughout your treatment.</p><p>Most cases are planned with a 3D preview of the expected result, so you can see your future smile before you begin. Aligners are replaced roughly every two weeks, and review visits are scheduled with your orthodontist to keep treatment on track.</p>",
      isFeatured: true,
    },
    {
      title: "Root Canal Treatment",
      slug: "root-canal-treatment",
      excerpt: "A comfortable, single-visit treatment that removes infected pulp and saves a badly decayed or injured tooth.",
      body: "<p>Root canal treatment removes infected or inflamed pulp from inside the tooth, cleans and shapes the canals, and seals them to prevent reinfection. It relieves tooth pain and lets you keep your natural tooth instead of losing it.</p><p>With modern anaesthesia and rotary instruments, the procedure is far more comfortable than its reputation suggests. Most teeth treated this way function normally for many years with a protective crown.</p>",
      isFeatured: true,
    },
    {
      title: "Dental Implants",
      slug: "dental-implants",
      excerpt: "Permanent, natural-looking replacement for one or more missing teeth using titanium roots.",
      body: "<p>A dental implant is a titanium root placed into the jawbone that supports a crown, bridge or denture. Implants look, feel and function like natural teeth and help preserve the jawbone where a tooth is missing.</p><p>Our implantologists plan each case carefully with imaging and can often offer same-day or early-loading options where the bone allows. Implants are an excellent long-term solution for single teeth or for supporting full-arch rehabilitation.</p>",
      isFeatured: true,
    },
    {
      title: "Orthodontics (Braces)",
      slug: "orthodontics-braces",
      excerpt: "Metal, ceramic and aesthetic braces to correct misaligned teeth and improve bite function.",
      body: "<p>Orthodontics corrects crooked teeth and bite problems using fixed braces or clear aligners. A well-aligned bite makes cleaning easier, reduces uneven wear and can relieve jaw strain.</p><p>We offer metal, ceramic and self-ligating braces and plan treatment around your goals. Regular adjustments, good oral hygiene and wearing your retainers after treatment keep the results stable for life.</p>",
      isFeatured: true,
    },
    {
      title: "Disimpaction",
      slug: "disimpaction",
      excerpt: "Safe removal of impacted wisdom teeth to relieve pain, crowding and prevent future complications.",
      body: "<p>Impacted wisdom teeth are third molars that fail to erupt properly and stay trapped in the gum or bone. They can cause pain, swelling, infection, and push neighbouring teeth out of line.</p><p>Our oral surgeons remove impacted teeth under local anaesthesia, with sedation options available for anxious patients. The procedure is carefully planned with X-rays, and recovery guidance is provided so healing is quick and uneventful.</p>",
      isFeatured: true,
    },
    {
      title: "Child Dental Care",
      slug: "child-dental-care",
      excerpt: "Gentle, friendly dentistry that helps children build healthy habits and enjoy their visits.",
      body: "<p>We take time to explain every step of a visit to children in a language they understand, so treatment feels calm and non-threatening. Regular check-ups from an early age catch problems while they are small.</p><p>Our services for kids include fluoride application, pit-and-fissure sealants, cavity treatment and habit counselling. The goal is a child who sees the dentist as a friend, not a fear.</p>",
      isFeatured: true,
    },
    {
      title: "Gum Treatments",
      slug: "gum-treatments",
      excerpt: "Diagnosis and management of gum disease to stop bleeding, recession and tooth loss.",
      body: "<p>More teeth are lost to gum disease than to tooth decay. It begins with plaque and tartar below the gum line, causing bleeding and inflammation, and can progress silently to bone loss.</p><p>Depending on severity, we offer scaling and root planing, laser gum therapy and maintenance programmes. Early treatment protects your teeth and your overall health, since gum disease is linked to conditions such as diabetes and heart disease.</p>",
      isFeatured: false,
    },
    {
      title: "Teeth Whitening",
      slug: "teeth-whitening",
      excerpt: "Professional whitening that lifts years of stains and discoloration for a visibly brighter smile.",
      body: "<p>Professional whitening uses clinically proven gels and concentrations that are stronger and safer than over-the-counter strips. It removes stains caused by coffee, tea, tobacco and ageing.</p><p>We assess your enamel and gums before treatment, so whitening is gentle and even. Options include in-clinic power whitening for immediate results and take-home trays for gradual brightening at your convenience.</p>",
      isFeatured: true,
    },
    {
      title: "Tooth Filling",
      slug: "tooth-filling",
      excerpt: "Aesthetic, tooth-coloured fillings that restore decayed or damaged teeth invisibly.",
      body: "<p>Tooth-coloured composite fillings repair cavities and small chips while blending seamlessly with your natural teeth. They bond directly to the tooth, so less healthy enamel needs to be removed than with older amalgam fillings.</p><p>Small cavities are best treated early — a simple filling today is far less involved than a crown or root canal tomorrow. Our dentists match the shade precisely and polish the surface to a natural finish.</p>",
      isFeatured: false,
    },
    {
      title: "Scaling & Polishing",
      slug: "scaling-polishing",
      excerpt: "Professional cleaning that removes plaque, tartar and stains for healthy gums and fresh breath.",
      body: "<p>Even the best brushing leaves some plaque behind, which hardens into tartar that only a professional clean can remove. Scaling clears deposits above and below the gum line, and polishing leaves your teeth smooth and stain-free.</p><p>Regular cleaning every six months is the simplest way to prevent gum disease, cavities and bad breath. It also gives your dentist the chance to spot small problems early.</p>",
      isFeatured: false,
    },
    {
      title: "Veneer Treatment",
      slug: "veneer-treatment",
      excerpt: "Ultra-thin porcelain shells that correct chips, gaps, staining and uneven teeth in a few visits.",
      body: "<p>Veneers are thin layers of porcelain bonded to the front of your teeth to transform their colour, shape and alignment. They are an excellent option for closing gaps, hiding stubborn stains and repairing chipped edges.</p><p>Treatment is planned with a smile preview so you can approve the design before anything is prepared. With good care, veneers last for many years and look completely natural.</p>",
      isFeatured: false,
    },
    {
      title: "Crowns & Bridges",
      slug: "crowns-bridges",
      excerpt: "Fixed restorations that cap damaged teeth or replace missing ones with strong, natural-looking prosthetics.",
      body: "<p>A crown is a cap that fully covers a weakened or root-treated tooth, restoring its strength, shape and appearance. A bridge fills the gap of one or more missing teeth using crowns on the neighbouring teeth as anchors.</p><p>Modern all-ceramic materials are biocompatible and colour-matched to your own teeth. Well-made crowns and bridges, combined with good hygiene, can last a decade or more.</p>",
      isFeatured: false,
    },
    {
      title: "Laser Dentistry",
      slug: "laser-dentistry",
      excerpt: "Precise, minimally invasive laser treatments that reduce bleeding, pain and recovery time.",
      body: "<p>Lasers let us treat soft and hard tissues with far less trauma than traditional instruments. Common uses include gum contouring, treatment of gum disease, removal of excess tissue and teeth whitening.</p><p>Laser procedures often require little or no stitching, cause less bleeding and swelling, and heal faster. Many patients are surprised at how quick and comfortable the experience is.</p>",
      isFeatured: true,
    },
    {
      title: "Smile Designing",
      slug: "smile-designing",
      excerpt: "A complete, personalised smile makeover combining whitening, veneers and shaping for a stunning result.",
      body: "<p>Smile designing looks at your face, lips, teeth and gums together to plan an overall aesthetic outcome rather than treating each tooth in isolation. It may combine whitening, veneers, reshaping, gum contouring and orthodontics.</p><p>We begin with photographs and a digital preview so you can see the proposed smile before treatment starts. The result is a smile that looks balanced, natural and tailored to you.</p>",
      isFeatured: true,
    },
  ]

  for (const service of services) {
    await prisma.content.upsert({
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
          create: {
            sortOrder: services.indexOf(service),
            isFeatured: service.isFeatured,
          },
        },
      },
    })
  }
  console.log("✅ Created Services:", services.length)

  // ── 4. Team members (public doctor names; original bios) ────────────
  const teamMembers = [
    {
      name: "Dr. Naveenn Indla",
      slug: "dr-naveenn-indla",
      specialty: "Founder & Director | Implant & Cosmetic Dentistry",
      bio: "Dr. Naveenn Indla founded 32 Smiles Multispeciality Dental Clinics in 2005 with a vision of making advanced, honest dental care accessible across Bangalore. He leads the clinical team and focuses on dental implants and full smile makeovers, combining meticulous treatment planning with a patient-first approach.",
    },
    {
      name: "Dr. S. Preethi Naidu",
      slug: "dr-s-preethi-naidu",
      specialty: "Director | Orthodontics",
      bio: "Dr. S. Preethi Naidu is a co-director of the clinics and an orthodontist. She has built the orthodontic and Invisalign programmes, guiding patients of all ages towards straighter, healthier smiles through clear aligners and fixed braces.",
    },
    {
      name: "Dr. Jayashree",
      slug: "dr-jayashree",
      specialty: "Endodontics & Restorative Dentistry",
      bio: "Dr. Jayashree is known for her careful, thorough approach to root canals and restorations. Patients repeatedly praise her patience, her clear explanations and the gentle, precise way she carries out treatment.",
    },
    {
      name: "Dr. Akansha",
      slug: "dr-akansha",
      specialty: "Root Canal Specialist",
      bio: "Dr. Akansha specialises in painless root canal treatment. She takes time to explain every step and works patiently across sittings to ensure an infection is fully resolved before restoring the tooth.",
    },
    {
      name: "Dr. Ekta Suman",
      slug: "dr-ekta-suman",
      specialty: "Preventive & Aesthetic Dentistry",
      bio: "Dr. Ekta Suman focuses on preventive care, professional cleaning and aesthetic treatments. She is appreciated for educating patients on maintaining their oral hygiene between visits so results last.",
    },
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
            isFeatured: member.slug === "dr-naveenn-indla",
          },
        },
      },
    })
  }
  console.log("✅ Created Team Members:", teamMembers.length)

  // ── 5. Testimonials (real public Google reviews) ────────────────────
  const testimonials = [
    {
      clientName: "Vaishnavi Srivastava",
      quote: "Great experience, very clean and hygienic. Got my dental cleaning done by Dr Ekta Suman, she was so patient and gentle with me. She also educated me regarding the importance of maintaining oral hygiene. Definitely recommend 32 Smiles to everyone.",
      clientTitle: "Google Review",
    },
    {
      clientName: "Dipti Lakade",
      quote: "Professional, caring, kind, personable. Dr. Jayashree is the best dentist I have ever seen! She is caring and thorough, and took her time to explain and perform my cavity filling with precision. I highly recommend all my friends to this office for their dental needs!",
      clientTitle: "Google Review",
    },
    {
      clientName: "Vijendran Jayaprakash",
      quote: "One of the best dental clinics in HSR Layout. Dr Jayashree explained clearly my dental problems and also the treatment for the same, and during the entire treatment I felt in safe hands. The team there did a great job. Thank you very much.",
      clientTitle: "Google Review",
    },
    {
      clientName: "Naveen PM",
      quote: "This is a great place to go take care of your teeth. The team was very professional examining and providing solutions by priority. I had to do periodontal root canal and scaling — Dr. Jayashree did a great job, I felt that I was in good hands.",
      clientTitle: "Google Review",
    },
    {
      clientName: "Arushi Bagga",
      quote: "I visited the clinic with tooth pain and Dr. Akansha suggested me RCT based on my X-ray. I was afraid of witnessing pain but thankfully she was very considerate, explained everything to me and did a painless procedure. Now I am pain free. It is a good dental clinic!",
      clientTitle: "Google Review",
    },
  ]

  for (const t of testimonials) {
    const slug = t.clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
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
            clientTitle: t.clientTitle,
            rating: 5,
            sortOrder: testimonials.indexOf(t),
            isFeatured: true,
          },
        },
      },
    })
  }
  console.log("✅ Created Testimonials:", testimonials.length)

  // ── 6. Blog posts (original content) + Dental Tourism page ──────────
  const blogPosts = [
    {
      title: "Dental Tourism in Bangalore: Why Patients Travel for Their Smiles",
      slug: "dental-tourism-in-bangalore",
      excerpt: "Internationally accredited dentistry at a fraction of the cost is drawing patients from around the world to Bangalore. Here is how a dental tourism visit works.",
      body: `<p>Dental tourism — travelling to another country for dental treatment — has grown rapidly in recent years. Patients from the UK, Australia, the Gulf and Africa regularly travel to India for world-class dentistry at a fraction of the cost of treatment at home.</p><h3>Why Bangalore?</h3><ul><li><strong>Accredited specialists:</strong> Indian dentists train in internationally recognised programmes and many publish and teach internationally.</li><li><strong>Advanced technology:</strong> Modern clinics offer 3D imaging, implantology and laser dentistry comparable to leading western clinics.</li><li><strong>Meaningful savings:</strong> Implants, crowns and full-mouth rehabilitation typically cost 60-80% less than in western countries.</li><li><strong>Complete care:</strong> Treatment plans can be coordinated with your travel dates so procedures and flights fit together.</li></ul><h3>Planning Your Visit</h3><p>Most dental tourism plans start with an online consultation: you share X-rays and history, receive a written treatment plan and cost estimate, and schedule treatment for your arrival. Complex work such as implants can often be planned around a single week-long visit with review appointments arranged at intervals.</p><p>If you are considering treatment abroad, ask for a detailed plan, transparent pricing and a dedicated point of contact. A reputable clinic will make your journey simple and safe.</p>`,
      readingTime: 5,
      isFeatured: true,
    },
    {
      title: "Invisalign: A Complete Guide to Clear Aligner Treatment",
      slug: "invisalign-complete-guide",
      excerpt: "How clear aligners work, what the process feels like, and how long it takes to straighten your smile.",
      body: `<p>Clear aligners have made orthodontics more discreet than ever. Instead of metal brackets and wires, treatment uses a series of smooth, transparent trays that move your teeth in small, controlled steps.</p><h3>How It Works</h3><p>Your first visit includes a 3D scan of your teeth and a digital preview of your expected final result. From that plan, a set of aligners is made — each one worn for about two weeks before moving to the next.</p><h3>Wearing & Care</h3><p>Aligners should be worn 20-22 hours a day, removed only for eating, drinking anything other than water, and cleaning. This is the single biggest factor in finishing on time.</p><h3>What It Feels Like</h3><p>You will notice some pressure when you start a new tray — a sign the aligners are working. It settles within a day or two. Speech returns to normal quickly as you adjust.</p><h3>How Long It Takes</h3><p>Simple cases can finish in 3-6 months; more complex ones take 12-18 months. After treatment, retainers keep your new smile in place.</p>`,
      readingTime: 4,
      isFeatured: false,
    },
    {
      title: "Why You Should Never Delay a Tooth Filling",
      slug: "why-never-delay-tooth-filling",
      excerpt: "A small cavity is quick to fix. Waiting turns a simple filling into a root canal — or a lost tooth.",
      body: `<p>Tooth decay is progressive. It starts as a small area of softened enamel that may cause no symptoms at all, which is why it often goes unnoticed until a check-up finds it.</p><h3>What Happens If You Wait</h3><p>Left alone, the cavity grows deeper towards the pulp — the living nerve centre of the tooth. Once the pulp becomes infected, the pain begins, and the treatment changes from a 30-minute filling to a multi-visit root canal and crown.</p><h3>The Cost of Delay</h3><p>A filling is the least expensive, least invasive treatment in dentistry. Every stage past it costs more, takes longer and removes more of your natural tooth. In the worst case, an unsalvageable tooth has to be extracted and replaced.</p><h3>The Lesson</h3><p>Catch cavities early with regular six-monthly check-ups. If a filling has been recommended, don't postpone it — the longer you wait, the more of your tooth you stand to lose.</p>`,
      readingTime: 3,
      isFeatured: false,
    },
    {
      title: "Laser Dentistry: A Gentler Way to Treat Your Gums and Teeth",
      slug: "laser-dentistry-gentler-way",
      excerpt: "Lasers are changing dental treatment — less bleeding, less pain and faster healing for patients.",
      body: `<p>Dental lasers use concentrated light energy to treat tissue with precision. For patients, the benefits are often dramatic: minimal bleeding, less discomfort and faster recovery than traditional methods.</p><h3>What Lasers Are Used For</h3><ul><li><strong>Gum disease:</strong> Removing infected tissue and bacteria with little damage to healthy gum.</li><li><strong>Gum contouring:</strong> Reshaping an uneven gum line for a more balanced smile.</li><li><strong>Soft-tissue procedures:</strong> Frenectomy and removal of excess tissue with fewer stitches.</li><li><strong>Whitening:</strong> Activating whitening agents for faster, brighter results.</li></ul><h3>What Patients Notice</h3><p>Most laser procedures need no sutures, cause less swelling, and heal noticeably faster. Many patients describe the experience as quick and remarkably comfortable.</p><p>Ask your dentist whether laser dentistry is suitable for your procedure — in many cases it turns a treatment you were dreading into an easy appointment.</p>`,
      readingTime: 4,
      isFeatured: false,
    },
    {
      title: "Caring for Your Child's First Teeth",
      slug: "caring-for-childs-first-teeth",
      excerpt: "Baby teeth matter more than people think. Good habits from the first tooth protect your child's smile for life.",
      body: `<p>Your child's first teeth usually appear around six months, and they play a bigger role than many parents realise. They hold space for permanent teeth, help speech development, and shape the face.</p><h3>Start Early</h3><p>Clean gums with a soft cloth even before the first tooth erupts. As soon as teeth appear, brush twice a day with a smear of fluoride toothpaste — about the size of a grain of rice.</p><h3>The First Visit</h3><p>Bring your child to the dentist by their first birthday, or within six months of the first tooth. These early visits are relaxed and help your child build a positive relationship with dental care.</p><h3>Protecting the Teeth</h3><p>Limit sugary drinks and avoid putting babies to sleep with a bottle of milk or juice. As molars come in, ask about fluoride application and pit-and-fissure sealants — simple treatments that prevent most cavities in back teeth.</p><p>Children who grow up visiting the dentist without fear carry that confidence into adulthood. It is one of the best health habits you can give them.</p>`,
      readingTime: 4,
      isFeatured: false,
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
            isFeatured: post.isFeatured,
          },
        },
      },
    })
  }
  console.log("✅ Created Blog Posts:", blogPosts.length)

  // ── 7. Patient education articles (brief, original) ─────────────────
  const educationArticles = [
    {
      title: "Proper Brushing Technique",
      slug: "proper-brushing-technique",
      excerpt: "Two minutes, twice a day, with the right technique — the fundamentals of good brushing.",
      body: `<p>Brushing well matters more than brushing often. The recommended routine is twice a day for two minutes with a soft-bristled brush and fluoride toothpaste.</p><ul><li>Hold the brush at a 45-degree angle towards the gum line.</li><li>Use gentle, circular motions — scrubbing hard damages enamel and gums.</li><li>Reach all surfaces: outer, inner and chewing, plus the tongue.</li><li>Replace your brush every three to four months.</li></ul><p>Add daily flossing and regular six-monthly visits and you cover most of what prevents cavities and gum disease.</p>`,
      category: "patient",
    },
    {
      title: "Understanding Tooth Sensitivity",
      slug: "understanding-tooth-sensitivity",
      excerpt: "A twinge when you drink something cold or sweet is common — and often fixable.",
      body: `<p>Tooth sensitivity happens when the protective enamel thins or the gum recedes, exposing the softer dentine underneath. Common triggers are cold drinks, sweets and acidic foods.</p><h3>What You Can Do</h3><ul><li>Use a soft brush and gentle pressure — hard brushing exposes roots.</li><li>Try a desensitising toothpaste and give it a few weeks to work.</li><li>Limit acidic drinks and wait 30 minutes before brushing after them.</li><li>If sensitivity persists, see your dentist to rule out cavities or gum recession.</li></ul>`,
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
        educationArticle: { create: { educationType: article.category } },
      },
    })
  }
  console.log("✅ Created Education Articles:", educationArticles.length)

  // ── 8. Standalone FAQs (original) ───────────────────────────────────
  const faqs = [
    {
      question: "What are your clinic timings?",
      answer: "Our clinics are open all days of the week, from 10:00 AM to 9:00 PM.",
      category: "general",
    },
    {
      question: "How do I book an appointment?",
      answer: "You can book through the appointment form on this website, or call us directly at +91-9482712345 and our team will schedule you.",
      category: "general",
    },
    {
      question: "Is root canal treatment painful?",
      answer: "No. With modern anaesthesia, root canal treatment is usually no more uncomfortable than having a filling. Most patients are surprised by how comfortable it is.",
      category: "treatment",
    },
    {
      question: "How often should I visit the dentist?",
      answer: "We recommend a check-up and professional cleaning every six months, or more often if you have ongoing treatment or gum problems.",
      category: "general",
    },
    {
      question: "Are dental implants a permanent solution?",
      answer: "Dental implants are designed to last for many years, often decades, and are the closest thing to a natural tooth. Their longevity depends on good oral hygiene and regular check-ups.",
      category: "treatment",
    },
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

  // ── 9. Product categories + products (INR shop) ────────────────────
  const productCategories = [
    { name: "Toothpaste", slug: "toothpaste", description: "Fluoride and whitening toothpastes for daily protection.", sortOrder: 1 },
    { name: "Toothbrush", slug: "brushes", description: "Manual and electric brushes for a thorough clean.", sortOrder: 2 },
    { name: "Mouthwash", slug: "mouthwash", description: "Rinses for fresh breath and extra cavity protection.", sortOrder: 3 },
    { name: "Kids Oral Care", slug: "kids", description: "Gentle, age-appropriate oral care for children.", sortOrder: 4 },
    { name: "Oral Accessories", slug: "accessories", description: "Floss, interdental brushes and daily essentials.", sortOrder: 5 },
  ]

  for (const cat of productCategories) {
    await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log("✅ Created Product Categories:", productCategories.length)

  const products = [
    { title: "Fluoride Toothpaste 100g", slug: "fluoride-toothpaste-100g", category: "toothpaste", price: 120, brand: "Colgate", rating: 4.6, reviewCount: 184, featured: true, hot: false, sale: false, desc: "Daily fluoride toothpaste that fights cavities, strengthens enamel and protects against plaque." },
    { title: "Whitening Toothpaste 100g", slug: "whitening-toothpaste-100g", category: "toothpaste", price: 210, brand: "Sensodyne", rating: 4.5, reviewCount: 96, featured: false, hot: false, sale: true, desc: "Gentle whitening paste that lifts surface stains while protecting sensitive teeth." },
    { title: "Kids Toothpaste 50g", slug: "kids-toothpaste-50g", category: "kids", price: 90, brand: "Colgate", rating: 4.7, reviewCount: 73, featured: false, hot: false, sale: false, desc: "Low-fluoride, mild-tasting toothpaste made for children's developing teeth." },
    { title: "Soft-Bristled Toothbrush", slug: "soft-bristled-toothbrush", category: "brushes", price: 80, brand: "Oral-B", rating: 4.4, reviewCount: 210, featured: true, hot: false, sale: false, desc: "Soft, end-rounded bristles that clean gently without damaging gums." },
    { title: "Sonic Electric Toothbrush", slug: "sonic-electric-toothbrush", category: "brushes", price: 2499, brand: "Philips", rating: 4.8, reviewCount: 64, featured: true, hot: true, sale: false, desc: "Sonic cleaning with a smart timer and pressure sensor for a dentist-grade clean." },
    { title: "Kids Cartoon Toothbrush", slug: "kids-cartoon-toothbrush", category: "kids", price: 120, brand: "Oral-B", rating: 4.6, reviewCount: 58, featured: false, hot: false, sale: false, desc: "Small-headed brush with fun characters that makes brushing a habit kids enjoy." },
    { title: "Alcohol-Free Mouthwash 250ml", slug: "alcohol-free-mouthwash-250ml", category: "mouthwash", price: 240, brand: "Listerine", rating: 4.5, reviewCount: 132, featured: true, hot: false, sale: false, desc: "Alcohol-free rinse that kills odour-causing bacteria without the burn." },
    { title: "Herbal Mouthwash 250ml", slug: "herbal-mouthwash-250ml", category: "mouthwash", price: 150, brand: "Dabur", rating: 4.3, reviewCount: 88, featured: false, hot: false, sale: true, desc: "Ayurvedic herbal rinse for fresh breath and healthy gums, suitable for daily use." },
    { title: "Dental Floss 50m", slug: "dental-floss-50m", category: "accessories", price: 180, brand: "Oral-B", rating: 4.4, reviewCount: 145, featured: false, hot: false, sale: false, desc: "Waxed, shred-resistant floss that reaches the spaces a brush cannot." },
    { title: "Interdental Brushes (Pack of 10)", slug: "interdental-brushes-pack-10", category: "accessories", price: 320, brand: "TePe", rating: 4.7, reviewCount: 41, featured: false, hot: false, sale: false, desc: "Fine brushes for cleaning between teeth and around crowns and braces." },
    { title: "Tongue Cleaner", slug: "tongue-cleaner", category: "accessories", price: 60, brand: "DentaCare", rating: 4.2, reviewCount: 167, featured: false, hot: false, sale: false, desc: "Stainless steel tongue cleaner to remove bacteria and freshen breath." },
  ]

  const categoryMap: Record<string, string> = {
    toothpaste: "toothpaste",
    brushes: "brushes",
    mouthwash: "mouthwash",
    kids: "kids",
    accessories: "accessories",
  }

  for (const product of products) {
    const catSlug = categoryMap[product.category]
    const cat = await prisma.productCategory.findUnique({ where: { slug: catSlug } })
    if (!cat) throw new Error(`Category "${catSlug}" not found for product "${product.title}"`)
    await prisma.content.upsert({
      where: { type_slug: { type: ContentType.PRODUCT, slug: product.slug } },
      update: { title: product.title, excerpt: product.desc, body: product.desc, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      create: {
        type: ContentType.PRODUCT,
        slug: product.slug,
        title: product.title,
        excerpt: product.desc,
        body: product.desc,
        status: ContentStatus.PUBLISHED,
        authorId: superAdmin.id,
        publishedAt: new Date(),
        product: {
          create: {
            price: product.price,
            currency: "INR",
            productCategoryId: cat.id,
            rating: product.rating,
            reviewCount: product.reviewCount,
            brand: product.brand,
            inStock: true,
            isFeatured: product.featured,
            isHot: product.hot,
            isOnSale: product.sale,
          },
        },
      },
    })
  }
  console.log("✅ Created Products:", products.length)

  // ── 10. Image settings (existing local fallbacks; per-slug service map) ──
  const serviceImageMap: Record<string, string> = {
    "invisalign-clear-aligners": "/images/services/2.jpg",
    "root-canal-treatment": "/images/services/1.jpg",
    "dental-implants": "/images/services/3.jpg",
    "orthodontics-braces": "/images/services/2.jpg",
    "disimpaction": "/images/services/single-service.jpg",
    "child-dental-care": "/images/services/b1.jpg",
    "gum-treatments": "/images/services/1.jpg",
    "teeth-whitening": "/images/services/2.jpg",
    "tooth-filling": "/images/services/1.jpg",
    "scaling-polishing": "/images/services/3.jpg",
    "veneer-treatment": "/images/services/b1.jpg",
    "crowns-and-bridges": "/images/services/3.jpg",
    "laser-dentistry": "/images/services/single-service.jpg",
    "smile-designing": "/images/services/b1.jpg",
  }

  const imageSettings = [
    { key: "hero_bg_homepage", value: "/images/bg/bg1.jpg", group: "images", label: "Hero - Homepage" },
    { key: "hero_bg_homepage_cta", value: "/images/bg/bg2.jpg", group: "images", label: "Hero - Homepage CTA" },
    { key: "hero_bg_about", value: "/images/bg/bg1.jpg", group: "images", label: "Hero - About" },
    { key: "hero_bg_services", value: "/images/bg/bg5.jpg", group: "images", label: "Hero - Services" },
    { key: "hero_bg_products", value: "/images/bg/bg6.jpg", group: "images", label: "Hero - Products" },
    { key: "hero_bg_blog", value: "/images/bg/bg4.jpg", group: "images", label: "Hero - Blog" },
    { key: "hero_bg_gallery", value: "/images/bg/bg3.jpg", group: "images", label: "Hero - Gallery" },
    { key: "hero_bg_team", value: "/images/bg/bg13.jpg", group: "images", label: "Hero - Team" },
    { key: "hero_bg_insurance", value: "/images/bg/bg3.jpg", group: "images", label: "Hero - Insurance" },
    { key: "hero_bg_faq", value: "/images/bg/bg7.jpg", group: "images", label: "Hero - FAQ" },
    { key: "hero_bg_contact", value: "/images/bg/bg14.jpg", group: "images", label: "Hero - Contact" },
    { key: "hero_bg_cart", value: "/images/bg/bg6.jpg", group: "images", label: "Hero - Cart" },
    { key: "hero_bg_appointment", value: "/images/bg/bg12.jpg", group: "images", label: "Hero - Appointment" },
    { key: "hero_bg_education_patient", value: "/images/bg/bg15.jpg", group: "images", label: "Hero - Patient Education" },
    { key: "hero_bg_education_professional", value: "/images/bg/bg16.jpg", group: "images", label: "Hero - Professional Education" },
    { key: "about_story_image", value: "/images/about/dc1.png", group: "images", label: "About - Story Image" },
    { key: "homepage_slider_image", value: "/images/gallery/3.jpg", group: "images", label: "Homepage - Slider Image" },
    { key: "testimonial_avatar_1", value: "/images/testimonials/1.png", group: "images", label: "Testimonial - Avatar 1" },
    { key: "testimonial_avatar_2", value: "/images/testimonials/2.png", group: "images", label: "Testimonial - Avatar 2" },
    { key: "testimonial_avatar_3", value: "/images/testimonials/3.png", group: "images", label: "Testimonial - Avatar 3" },
    { key: "testimonial_avatar_4", value: "/images/testimonials/1.jpg", group: "images", label: "Testimonial - Avatar 4" },
    { key: "service_fallback_images", value: JSON.stringify(serviceImageMap), group: "images", label: "Service Fallback Images" },
    { key: "product_fallback_images", value: JSON.stringify({
      "fluoride-toothpaste-100g": "/images/Products/Toothepaste/paste1.jpg",
      "whitening-toothpaste-100g": "/images/Products/Toothepaste/paste2.jpg",
      "kids-toothpaste-50g": "/images/Products/Toothepaste/kidpaste.jpg",
      "soft-bristled-toothbrush": "/images/Products/Brushes/oralb.jpg",
      "sonic-electric-toothbrush": "/images/Products/Brushes/elect.png",
      "kids-cartoon-toothbrush": "/images/Products/Kids_products/oralkids.png",
      "alcohol-free-mouthwash-250ml": "/images/Products/General_Product/general1.jpg",
      "herbal-mouthwash-250ml": "/images/Products/General_Product/oral.png",
      "dental-floss-50m": "/images/Products/General_Product/80294412.jpg",
      "interdental-brushes-pack-10": "/images/Products/Brushes/bru.jpg",
      "tongue-cleaner": "/images/Products/General_Product/00889714001875_c1n1.jpeg",
    }), group: "images", label: "Product Fallback Images" },
    { key: "team_fallback_photos", value: JSON.stringify([
      { id: "f1", name: "Dr. Naveenn Indla", photoUrl: "/images/team/1.jpg" },
      { id: "f2", name: "Dr. S. Preethi Naidu", photoUrl: "/images/team/2.jpg" },
      { id: "f3", name: "Dr. Jayashree", photoUrl: "/images/team/3.jpg" },
      { id: "f4", name: "Dr. Akansha", photoUrl: "/images/team/4.jpg" },
      { id: "f5", name: "Dr. Ekta Suman", photoUrl: "/images/team/5.jpg" },
    ]), group: "images", label: "Team Fallback Photos" },
    { key: "blog_fallback_images", value: JSON.stringify(["/images/blog/1.jpg", "/images/blog/2.jpg", "/images/blog/3.jpg", "/images/blog/4.jpg", "/images/blog/16.jpg"]), group: "images", label: "Blog Fallback Images" },
    { key: "before_after_fallback_images", value: JSON.stringify(["/images/before-after/1.jpg", "/images/before-after/2.jpg", "/images/before-after/3.jpg"]), group: "images", label: "Before/After Fallback Images" },
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
  ]

  for (const setting of imageSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, group: setting.group },
      create: setting,
    })
  }
  console.log("✅ Created Image Settings:", imageSettings.length)

  // ── 11. Default brand voice + prompt templates + AI providers ───────
  await prisma.brandVoice.upsert({
    where: { name: "Professional & Warm" },
    update: {},
    create: {
      name: "Professional & Warm",
      description: "Default brand voice for 32 Smiles Multispeciality Dental Clinics",
      tone: "professional",
      personality: "caring, knowledgeable, approachable, trustworthy, confident",
      vocabulary: "we, our team, your smile, dental health, oral care, gentle, comfortable, personalised",
      avoidWords: "pain, scary, hurt, cheap, discount, budget, expensive",
      writingStyle: "Short to medium sentences. Use active voice. Begin paragraphs with the most important information. Use bullet points for lists.",
      targetAudience: "patients",
      isDefault: true,
      isActive: true,
      systemPrompt: "You are a content writer for 32 Smiles Multispeciality Dental Clinics, a leading dental practice in Bangalore, India.\n\nBrand Voice:\n- Tone: Professional, warm, and caring\n- We speak with authority but always with empathy\n- We educate without being condescending\n- We use simple, clear language accessible to everyone\n\nWriting Guidelines:\n- Always be factual and evidence-based\n- Include practical, actionable advice\n- Use \"we\" and \"our\" when referring to the clinic\n- Use \"you\" and \"your\" when addressing the reader\n- End content with a call-to-action or encouraging statement",
    },
  })
  console.log("✅ Created Default Brand Voice")

  const templates = [
    {
      name: "blog-post",
      category: "content",
      description: "Generate a dental clinic blog article",
      template: "Write a blog article about {{topic}} for {{audience}} audience.\n\nWord count: approximately {{word_count}} words.\nTone: {{tone}}\n\nInclude practical tips and end with a call-to-action.",
      systemPrompt: "You are a professional dental content writer for 32 Smiles Multispeciality Dental Clinics in Bangalore, India.",
    },
    {
      name: "service-description",
      category: "content",
      description: "Generate a service page description",
      template: "Write a service description for {{service_name}}.\n\nKey benefits: {{benefits}}\nTarget audience: {{audience}}\n\nInclude what the service involves, who it's for, and why patients should choose 32 Smiles.",
      systemPrompt: "You are a dental content writer specialising in service descriptions.",
    },
    {
      name: "seo-meta",
      category: "seo",
      description: "Generate SEO meta tags",
      template: "Generate SEO meta tags for a page about {{topic}}.\n\nProvide:\n1. Meta title (under 60 characters)\n2. Meta description (under 160 characters)\n3. Focus keyword\n4. Open Graph title\n5. Open Graph description",
      systemPrompt: "You are an SEO specialist for a dental clinic website.",
    },
    {
      name: "image-prompt",
      category: "image",
      description: "Generate image prompts for DALL-E/Midjourney",
      template: "Generate a detailed image prompt for: {{description}}\n\nStyle: {{style}}\nAspect ratio: {{aspect_ratio}}\n\nThe image should be professional and suitable for a dental clinic website.",
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
      create: { ...provider, status: "INACTIVE" },
    })
  }
  console.log("✅ Created AI Provider Configs:", providers.length)

  // ── 12. AI Studio demo draft (no provider key required) ────────────
  const demoDraft = await prisma.aIDraft.findFirst({
    where: { title: "AI Draft: 5 Everyday Habits for a Healthier Smile" },
    select: { id: true },
  })
  if (!demoDraft) {
    await prisma.aIDraft.create({
      data: {
        title: "AI Draft: 5 Everyday Habits for a Healthier Smile",
        body: `<p>Good oral health comes down to a few simple habits done consistently. Here are five that make the biggest difference.</p><h3>1. Brush Twice a Day for Two Minutes</h3><p>Use a soft-bristled brush with fluoride toothpaste and reach every surface of every tooth.</p><h3>2. Floss Daily</h3><p>Flossing removes the plaque your brush cannot reach between teeth, where cavities and gum disease start.</p><h3>3. Clean Your Tongue</h3><p>A quick scrape with a tongue cleaner removes bacteria that cause bad breath.</p><h3>4. Watch Your Sugar</h3><p>Bacteria feed on sugar to produce acid that attacks enamel. Limit sugary snacks and drinks between meals.</p><h3>5. Visit Your Dentist Twice a Year</h3><p>Professional cleaning and early detection keep small problems from becoming big ones.</p>`,
        contentType: ContentType.BLOG_POST,
        status: ContentStatus.AI_GENERATED,
        editorId: superAdmin.id,
        wordCount: 160,
        readingTime: 3,
      },
    })
    console.log("✅ Created AI Studio Demo Draft")
  } else {
    console.log("✅ AI Studio Demo Draft already exists")
  }

  // ── 13. Pre-booked appointment (demo patient) ───────────────────────
  const patientUser = await prisma.user.findUniqueOrThrow({ where: { email: "patient@demo.local" } })
  const receptionistUser = await prisma.user.findUniqueOrThrow({ where: { email: "receptionist@demo.local" } })

  const nextBusinessDay = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    return d
  })()

  await prisma.appointment.upsert({
    where: {
      id: "demo-appointment-bangalore",
    },
    update: {
      patientName: "Demo Patient",
      patientEmail: patientUser.email,
      patientPhone: "+91-9000000000",
      date: nextBusinessDay,
      time: "03:00 PM",
      service: "Dental Implants",
      notes: "Initial consultation for dental implant treatment planning (demo appointment).",
      status: "CONFIRMED",
      confirmedAt: new Date(),
      assignedToId: receptionistUser.id,
    },
    create: {
      id: "demo-appointment-bangalore",
      patientName: "Demo Patient",
      patientEmail: patientUser.email,
      patientPhone: "+91-9000000000",
      date: nextBusinessDay,
      time: "03:00 PM",
      service: "Dental Implants",
      notes: "Initial consultation for dental implant treatment planning (demo appointment).",
      status: "CONFIRMED",
      createdByUserId: patientUser.id,
      assignedToId: receptionistUser.id,
      confirmedAt: new Date(),
    },
  })
  console.log("✅ Created Pre-booked Appointment")

  console.log("\n🎉 Demo seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Demo seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
