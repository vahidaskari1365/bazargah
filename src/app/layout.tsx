import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "بازارگاه | پلتفرم جامع دام، دامپزشکی و کشاورزی هوشمند",
  description:
    "بازارگاه: مارکت‌پلیس تخصصی خرید و فروش دام و طیور، دامپزشکی واقعی و هوش مصنوعی، تغذیه هوشمند، پرونده سلامت حیوان، مدیریت گله و فروشگاه خوراک و تجهیزات دامداری",
  keywords: ["بازارگاه", "خرید دام", "فروش گاو", "گوسفند", "دامپزشک آنلاین", "تغذیه دام", "مغازه دام", "طیور", "AI دامپزشک"],
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon-96.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "بازارگاه" },
  openGraph: {
    title: "بازارگاه — همه دنیای دام در یک اپ",
    description: "مارکت‌پلیس دام + دامپزشک + AI + تغذیه هوشمند + مدیریت مزرعه",
    type: "website",
    locale: "fa_IR",
    images: ["/images/farm.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground bazargah-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
