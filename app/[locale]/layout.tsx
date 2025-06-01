import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import "../[locale]/globals.css";
import Providers from "../../providers";
import { ReactNode } from 'react';
import LanguageSelector from '../components/LanguageSelector'

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string; // O el tipo correcto según tus necesidades
  };
}



//Import images
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

//List of pages in this project
const Links = [
  {
    label: "Home",
    route: "/",
  },
  {
    label: "About",
    route: "/pages/About",
  },
];

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
            <LanguageSelector />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
