"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
  en: {
    title: "Terms of Service",
    updated: "Last updated: May 2026",
    sections: [
      {
        heading: "Acceptance of terms",
        body: "By creating an account or using Orbit, you agree to these Terms of Service. If you do not agree, please do not use the service.",
      },
      {
        heading: "Service description",
        body: "Orbit is an AI-powered document translation service. We translate PDF and Word documents while preserving their original layout. The service is provided on an 'as-is' basis.",
      },
      {
        heading: "User responsibilities",
        body: "You are responsible for the content of the documents you upload. You must not upload documents containing illegal content, malware, or material that infringes on third-party rights. You must not attempt to reverse-engineer, abuse, or overload the service.",
      },
      {
        heading: "Free tier and quotas",
        body: "Free accounts receive 15,000 characters of translation per month at no cost. This quota resets on the first day of each calendar month. We reserve the right to adjust quotas at any time.",
      },
      {
        heading: "Payments",
        body: "Paid credits are non-refundable once used. Top-up credits do not expire. We reserve the right to change pricing at any time, with notice provided to existing users.",
      },
      {
        heading: "Translation accuracy",
        body: "While we strive for high-quality translations, Orbit does not guarantee the accuracy, completeness, or suitability of any translation for legal, medical, or other professional purposes. Always review critical translations with a qualified professional.",
      },
      {
        heading: "Termination",
        body: "We reserve the right to suspend or terminate accounts that violate these terms, abuse the service, or engage in fraudulent activity. You may delete your account at any time.",
      },
      {
        heading: "Limitation of liability",
        body: "Orbit is not liable for any indirect, incidental, or consequential damages arising from the use of the service, including errors in translation output.",
      },
      {
        heading: "Contact",
        body: "For questions about these terms, contact us at cairoeegii@gmail.com.",
      },
    ],
  },
  mn: {
    title: "Үйлчилгээний нөхцөл",
    updated: "Сүүлд шинэчлэгдсэн: 2026 оны 5-р сар",
    sections: [
      {
        heading: "Нөхцөл зөвшөөрөх",
        body: "Бүртгэл үүсгэх эсвэл Orbit ашиглахад та эдгээр үйлчилгээний нөхцөлийг зөвшөөрсөн гэж үзнэ. Зөвшөөрөхгүй бол үйлчилгээг ашиглахгүй байна уу.",
      },
      {
        heading: "Үйлчилгээний тайлбар",
        body: "Orbit нь хиймэл оюун ухаан ашиглан баримт бичиг орчуулдаг үйлчилгээ юм. PDF болон Word баримтыг эх бүтцийг нь хадгалан орчуулдаг. Үйлчилгээг 'байгаа байдлаар нь' нийлүүлнэ.",
      },
      {
        heading: "Хэрэглэгчийн хариуцлага",
        body: "Та оруулж буй баримтын агуулгад бүрэн хариуцлага хүлээнэ. Хууль бус агуулга, хортой программ, гуравдагч талын эрхийг зөрчсөн материал байгаа баримт оруулахыг хориглоно. Үйлчилгээг эвдэх, буруу ашиглах, хэт ачааллахыг хориглоно.",
      },
      {
        heading: "Үнэгүй хязгаар ба хэрэглээний хязгаарлалт",
        body: "Үнэгүй хэрэглэгчид сард 15,000 тэмдэгтийн орчуулга үнэ төлбөргүй авна. Энэ хязгаар тухайн сарын эхний өдөр шинэчлэгдэнэ. Бид хязгаарлалтыг хэдийд ч өөрчлөх эрхтэй.",
      },
      {
        heading: "Төлбөр",
        body: "Ашиглагдсан кредит буцаан олгогдохгүй. Нэмэлт кредитийн хугацаа дуусдаггүй. Бид одоогийн хэрэглэгчдэд мэдэгдсэний үндсэн дээр үнийг хэдийд ч өөрчлөх эрхтэй.",
      },
      {
        heading: "Орчуулгын нарийвчлал",
        body: "Бид өндөр чанартай орчуулга хийхийг эрмэлзэх боловч Orbit нь ямар ч орчуулгын нарийвчлал, бүрэн байдал, хууль эрх зүйн, эмнэлгийн болон бусад мэргэжлийн зориулалтад тохирох байдлыг баталгааладаггүй. Чухал орчуулгыг мэргэжлийн хүнтэй дандаа шалгана уу.",
      },
      {
        heading: "Дансыг цуцлах",
        body: "Бид эдгээр нөхцөлийг зөрчсөн, үйлчилгээг буруу ашигласан, залилан мэхлэлтийн үйлдэл хийсэн бүртгэлийг зогсоох эсвэл хаах эрхтэй. Та хэдийд ч бүртгэлээ устгаж болно.",
      },
      {
        heading: "Хариуцлагын хязгаарлалт",
        body: "Orbit нь орчуулгын гаралтын алдаа зэрэг үйлчилгээ ашигласнаас үүссэн шууд бус, санамсаргүй болон дагалдах хохирлыг хариуцахгүй.",
      },
      {
        heading: "Холбоо барих",
        body: "Эдгээр нөхцөлтэй холбоотой асуулт байвал cairoeegii@gmail.com хаягаар холбоо барина уу.",
      },
    ],
  },
};

export default function TermsPage() {
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
