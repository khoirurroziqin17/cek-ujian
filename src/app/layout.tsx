import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Portal Monitoring Ujian — Status Blokir & Susulan",
  description:
    "Cek daftar blokir sebelum ujian dan peserta ujian susulan secara real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={cn("scroll-smooth", "font-sans", inter.variable)}
    >
      <body className="bg-slate-50/70 text-slate-900 min-h-screen antialiased selection:bg-blue-100 selection:text-blue-900">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-linear-to-br from-slate-900 to-slate-700 text-white p-2 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight block leading-none text-slate-900">
                  Monitoring Ujian
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Sistem Informasi Panitia Ujian
                </span>
              </div>
            </Link>
          </div>
        </header>

        {children}

        <footer className="border-t bg-white py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>
              © 2026 Panitia Ujian Sekolah • Data diperbarui secara berkala.
            </p>
            <p>Gunakan filter kelas & mata pelajaran untuk pencarian cepat.</p>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
