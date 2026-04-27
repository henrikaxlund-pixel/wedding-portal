import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Henrik & Riina · Wedding Portal",
  description: "Wedding planning portal for Henrik & Riina, 21 December 2026, Helsinki",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${geist.className} min-h-full flex flex-col`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
