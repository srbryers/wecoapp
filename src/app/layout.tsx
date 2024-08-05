import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/app/components/Navigation"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <div className="grid grid-rows-1 grid-cols-2 grid-cols-[200px_1fr] min-h-screen bg-gray-900">
          {/* Side navigation */}
          <Navigation links={[
            { title: "Home", href: "/" },
            { title: "Shopify", href: "/integrations/shopify" },
            { title: "Loop", href: "/integrations/loop" },
            { title: "ShipStation", href: "/integrations/shipStation" },
            { title: "Klaviyo", href: "/integrations/klaviyo" },
            { title: "Database", href: "/data/database" },
            { title: "Snowflake", href: "/data/snowflake" },
          ]} />
          {/* Main content */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex flex-row items-center justify-start w-full bg-gray-950">
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
