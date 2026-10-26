import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import ToasterClient from "@/components/ToasterClient";
import { Providers } from "@/lib/theme-provider";

// Loaded as the variable font: listing static weights makes the Turbopack production
// build fail to resolve the font files (next 16.2.3). 400/500/600 are all covered.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EchoSense",
  description:
    "Classroom alerts for school staff: see what needs attention, review it, and follow up.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plexSans.variable} min-h-screen`}>
        <Providers>
          {children}
          <ToasterClient />
        </Providers>
      </body>
    </html>
  );
}
