import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#181A20",
};

export const metadata: Metadata = {
  title: "Coinflow VIP",
  description: "Demo crypto trading platform with live charts",
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${inter.className} min-h-full bg-[#050505] text-[#EAECEF]`}>
        <div className="w-full bg-[#0a0a0a] min-h-screen relative shadow-2xl shadow-[#BF953F]/5 flex flex-col overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
