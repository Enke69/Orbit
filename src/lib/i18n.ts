export const t = {
  en: {
    // Navbar
    nav: {
      documents: "Documents",
      text: "Text",
      history: "History",
      dashboard: "Dashboard",
      signIn: "Sign in",
      getStarted: "Get started",
      signOut: "Sign out",
    },

    // Footer
    footer: {
      tagline: "Fast, accurate document translation powered by AI.",
      copyright: "All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },

    // Home page
    home: {
      heroHeading: "Translate any document",
      heroHighlight: "instantly",
      heroSub: "Upload a PDF or Word document. Orbit translates the text while keeping your images, tables, and layout exactly where they were. Download the result instantly.",
      cta: "Start translating",
      ctaDoc: "Translate a document",
      freeNote: "15,000 characters free every month. No credit card required.",
      featuresHeading: "Everything you need for professional translation",
      pricingHeading: "Simple pricing",
      pricingSub: "Start free. Top up only when you need more.",
      mostPopular: "Most popular",
      features: [
        { title: "PDF & Word support",   description: "Upload .pdf, .doc, or .docx files. Download as PDF or Word." },
        { title: "Layout preserved",     description: "Images, tables, and formatting stay exactly where they were." },
        { title: "Any source language",  description: "English, Russian, Chinese, Korean, and 50+ more — auto-detected." },
        { title: "Context-aware",        description: "The AI remembers terminology across the whole document for consistent output." },
      ],
      plans: [
        {
          name: "Free", price: "₮0", period: "/ month", featured: false, cta: "Get started",
          features: ["15,000 characters / month", "PDF & Word upload", "Download as DOCX or PDF", "All source languages"],
        },
        {
          name: "Pro", price: "₮25,000", period: "/ month", featured: true, cta: "Go Pro",
          features: ["500,000 characters / month", "Priority translation queue", "Translation history (30 days)", "Email support"],
        },
        {
          name: "Top-up", price: "₮500", period: "per 1,000 chars", featured: false, cta: "Pay as you go",
          features: ["Buy only what you need", "Credits never expire", "Same quality as Pro", "QPay supported"],
        },
      ],
    },

    // History page
    history: {
      title: "Translation history",
      newTranslation: "New translation",
      noTranslations: "No translations yet.",
      uploadFirst: "Upload your first document",
      hiddenBanner: (n: number) => `${n} older translation${n !== 1 ? "s" : ""} hidden`,
      hiddenSub: (limit: number) => `Free accounts show the last ${limit} only. Upgrade to Pro for full history access.`,
      upgradePro: "Upgrade to Pro",
      autoDelete: "Files are automatically deleted 7 days after translation.",
      lastN: (n: number) => `Last ${n} translation${n !== 1 ? "s" : ""}`,
      totalJobs: (n: number) => `${n} jobs total`,
      translated: "Translated",
      chars: "chars",
      download: "Download",
      retry: "Retry",
    },
  },

  mn: {
    // Navbar
    nav: {
      documents: "Баримт бичиг",
      text: "Текст",
      history: "Түүх",
      dashboard: "Хянах самбар",
      signIn: "Нэвтрэх",
      getStarted: "Эхлэх",
      signOut: "Гарах",
    },

    // Footer
    footer: {
      tagline: "Хиймэл оюун ухаан ашиглан баримт бичгийг хурдан, үнэн зөв орчуулна.",
      copyright: "Бүх эрх хуулиар хамгаалагдсан.",
      privacy: "Нууцлалын бодлого",
      terms: "Үйлчилгээний нөхцөл",
    },

    // Home page
    home: {
      heroHeading: "Баримт бичгээ орчуулаарай",
      heroHighlight: "даруй",
      heroSub: "PDF эсвэл Word файлаа оруулаад Orbit текстийг орчуулж, зураг, хүснэгт, бүтцийг нь яг хэвээр нь хадгалж, татаж авах боломж олгоно.",
      cta: "Орчуулж эхлэх",
      ctaDoc: "Баримт бичиг орчуулах",
      freeNote: "Сард 15,000 тэмдэгт үнэгүй. Картын мэдээлэл шаардахгүй.",
      featuresHeading: "Мэргэжлийн орчуулгад шаардагдах бүх зүйл",
      pricingHeading: "Энгийн үнэ тариф",
      pricingSub: "Үнэгүй эхлэж, шаардлагатай үедээ л нэмнэ үү.",
      mostPopular: "Хамгийн их сонголттой",
      features: [
        { title: "PDF болон Word дэмжлэг",   description: ".pdf, .doc, .docx файл оруулаад PDF эсвэл Word-оор татаж авна уу." },
        { title: "Бүтэц хадгалагдана",        description: "Зураг, хүснэгт, форматлал яг байгаа газартаа үлдэнэ." },
        { title: "Дурын эх хэл",              description: "Англи, Орос, Хятад, Солонгос болон 50+ хэл — автоматаар илрүүлнэ." },
        { title: "Контекст мэдрэмжтэй",       description: "AI бүх баримт бичгийн туршид нэр томьёог тогтмол санаж байдаг." },
      ],
      plans: [
        {
          name: "Үнэгүй", price: "₮0", period: "/ сар", featured: false, cta: "Эхлэх",
          features: ["Сард 15,000 тэмдэгт", "PDF болон Word оруулах", "DOCX эсвэл PDF татах", "Бүх эх хэл"],
        },
        {
          name: "Pro", price: "₮25,000", period: "/ сар", featured: true, cta: "Pro авах",
          features: ["Сард 500,000 тэмдэгт", "Тэргүүлэх дараалал", "Орчуулгын түүх (30 хоног)", "И-мэйл дэмжлэг"],
        },
        {
          name: "Нэмэлт", price: "₮500", period: "1,000 тэмдэгтэд", featured: false, cta: "Хэрэгцээгээрээ",
          features: ["Хэрэгцээтэй хэмжээгээрээ л худалдаж ав", "Кредит хугацаагүй", "Pro-тай ижил чанар", "QPay дэмжигддэг"],
        },
      ],
    },

    // History page
    history: {
      title: "Орчуулгын түүх",
      newTranslation: "Шинэ орчуулга",
      noTranslations: "Одоогоор орчуулга байхгүй байна.",
      uploadFirst: "Анхны баримтаа оруулах",
      hiddenBanner: (n: number) => `${n} орчуулга нуугдсан`,
      hiddenSub: (limit: number) => `Үнэгүй хэрэглэгч сүүлийн ${limit}-ийг л харна. Бүхийг харахыг хүсвэл Pro авна уу.`,
      upgradePro: "Pro болгох",
      autoDelete: "Файлууд орчуулагдсанаас 7 хоногийн дараа автоматаар устгагдана.",
      lastN: (n: number) => `Сүүлийн ${n} орчуулга`,
      totalJobs: (n: number) => `Нийт ${n} ажил`,
      translated: "Орчуулагдсан",
      chars: "тэмдэгт",
      download: "Татах",
      retry: "Дахин оролдох",
    },
  },
} as const;

export type Translations = typeof t.en;
