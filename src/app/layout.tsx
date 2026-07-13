import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#181A20",
};

export const metadata: Metadata = {
  title: "Crypto Demo Trading",
  description: "Demo crypto trading platform with live charts",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${inter.className} min-h-full bg-[#050505] text-[#EAECEF] flex justify-center`}>
        <div className="w-full max-w-[480px] bg-[#0a0a0a] min-h-screen relative shadow-2xl shadow-blue-500/5 border-x border-white/5 flex flex-col overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
