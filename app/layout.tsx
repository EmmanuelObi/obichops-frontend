import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Obi's Chops",
    template: "%s · Obi's Chops",
  },
  description: "Weekly team meal ordering made simple.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
