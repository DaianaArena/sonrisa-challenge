import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import "../[locale]/globals.css";
import Providers from "../../providers";
import { ReactNode } from 'react';

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
  return [{ locale: "en" }, { locale: "de" }];
}

export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
