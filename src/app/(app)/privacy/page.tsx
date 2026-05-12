"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: May 2026",
    sections: [
      {
        heading: "Information we collect",
        body: "We collect your email address and name when you sign up. When you upload documents, we temporarily store them to perform the translation. We also record the number of characters translated to manage your monthly quota.",
      },
      {
        heading: "How we use your information",
        body: "Your documents are used solely to perform the translation you requested. We do not read, share, sell, or use your documents for any other purpose, including AI training.",
      },
      {
        heading: "File storage and deletion",
        body: "Uploaded and translated files are stored in Supabase Storage and are automatically deleted 7 days after the translation is completed. You can also delete individual translations from your history at any time.",
      },
      {
        heading: "Third-party services",
        body: "We use OpenAI to perform translations, Supabase for database and file storage, Google OAuth for sign-in, and Resend for email delivery. Each service has its own privacy policy.",
      },
      {
        heading: "Cookies",
        body: "We use a session cookie to keep you signed in and a small cookie to remember your language preference. No tracking or advertising cookies are used.",
      },
      {
        heading: "Your rights",
        body: "You may request deletion of your account and all associated data at any time by contacting us at cairoeegii@gmail.com.",
      },
      {
        heading: "Contact",
        body: "If you have any questions about this policy, please email cairoeegii@gmail.com.",
      },
    ],
  },
  mn: {
    title: "Нууцлалын бодлого",
    updated: "Сүүлд шинэчлэгдсэн: 2026 оны 5-р сар",
    sections: [
      {
        heading: "Бид ямар мэдээлэл цуглуулдаг вэ",
        body: "Бүртгүүлэх үед таны и-мэйл хаяг болон нэрийг цуглуулна. Баримт бичиг оруулах үед орчуулга хийхийн тулд түр хугацаанд хадгалдаг. Мөн сарын хэрэглээг хянахын тулд орчуулсан тэмдэгтийн тоог бүртгэдэг.",
      },
      {
        heading: "Мэдээллийг хэрхэн ашигладаг вэ",
        body: "Таны баримт бичгийг зөвхөн таны хүссэн орчуулгыг хийхэд ашигладаг. Бид баримт бичгийг уншдаггүй, хуваалцдаггүй, зардаггүй, AI сургалт зэрэг бусад зорилгоор ашигладаггүй.",
      },
      {
        heading: "Файл хадгалалт ба устгалт",
        body: "Оруулсан болон орчуулагдсан файлуудыг Supabase Storage-д хадгалдаг бөгөөд орчуулга дууссанаас хойш 7 хоногийн дараа автоматаар устгагдана. Та өөрийн түүхнээс хэдийд ч тусдаа орчуулгыг устгаж болно.",
      },
      {
        heading: "Гуравдагч тал үйлчилгээ",
        body: "Орчуулгыг хийхэд OpenAI, өгөгдлийн сан болон файл хадгалахад Supabase, нэвтрэхэд Google OAuth, и-мэйл илгээхэд Resend ашигладаг. Тус бүр өөрийн нууцлалын бодлоготой.",
      },
      {
        heading: "Күүки",
        body: "Нэвтэрсэн байдлыг хадгалахад сессийн күүки болон хэлний тохиргоог санахад жижиг күүки ашигладаг. Хяналт болон сурталчилгааны күүки ашигладаггүй.",
      },
      {
        heading: "Таны эрх",
        body: "Та хэдийд ч бүртгэл болон холбогдох бүх мэдээллийг устгахыг cairoeegii@gmail.com хаягаар хүсэлт гарган болно.",
      },
      {
        heading: "Холбоо барих",
        body: "Энэхүү бодлоготой холбоотой асуулт байвал cairoeegii@gmail.com хаягаар бидэнтэй холбоо барина уу.",
      },
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-cosmos-star mb-2">{c.title}</h1>
      <p className="text-sm text-cosmos-dust/50 mb-10">{c.updated}</p>
      <div className="space-y-6">
        {c.sections.map((s) => (
          <Card key={s.heading} className="flex flex-col gap-2">
            <h2 className="font-semibold text-cosmos-star font-display">{s.heading}</h2>
            <p className="text-sm text-cosmos-dust leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
