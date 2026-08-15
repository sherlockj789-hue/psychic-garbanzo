import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const display = Space_Grotesk({
  variable: "--font-display-tf",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans-tf",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-tf",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wise World School — learn to become what you wanna be",
  description:
    "A real digital school. Pick any of 60 careers and work through 12 grades of real, expert-grounded lessons — with videos, games, and a job simulator. Free, forever.",
  keywords: [
    "career school",
    "learn a career",
    "free education",
    "career lessons",
    "job simulator",
  ],
  authors: [{ name: "Wise World School" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Wise World School — learn to become what you wanna be",
    description:
      "Pick a career. Do 12 grades of real lessons, videos, and games. Free, forever.",
    siteName: "Wise World School",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wise World School",
    description: "A real school for the job you actually want.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
