import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ticketing Platform | Dynamic Pricing",
  description: "Experience dynamic pricing with our high-concurrency ticketing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tighter">
              TICKETING <span className="text-primary/50 text-red-500">PLATFORM</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors">
                Explore Events
              </Link>
              <Link href="/my-bookings" className="text-sm font-medium hover:text-primary transition-colors">
                My Bookings
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
