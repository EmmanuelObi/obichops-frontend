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

const siteUrl =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://obichops.com";

const siteDescription =
  "Weekly team meal ordering for workplaces — browse menus, stay within budget, and submit orders before the window closes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Obi's Chops",
    template: "%s · Obi's Chops",
  },
  description: siteDescription,
  applicationName: "Obi's Chops",
  keywords: [
    "team meals",
    "workplace catering",
    "meal ordering",
    "staff lunch",
    "Obi's Chops",
  ],
  authors: [{ name: "Obi's Chops" }],
  creator: "Obi's Chops",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: "Obi's Chops",
    title: "Obi's Chops",
    description: siteDescription,
    images: [
      {
        url: "/assets/White%20Logo.png",
        width: 2000,
        height: 2000,
        alt: "Obi's Chops logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Obi's Chops",
    description: siteDescription,
    images: ["/assets/White%20Logo.png"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
