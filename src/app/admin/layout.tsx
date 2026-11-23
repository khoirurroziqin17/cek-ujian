import Link from "next/link";
import { Ban, Clock, Database, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50">
      {/* Sub-Navbar Admin */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/admin" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              1. Master Kelas, Mapel & Siswa
            </Button>

            <Button
              render={<Link href="/admin/blokir" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            >
              <Ban className="w-3.5 h-3.5 text-red-600" />
              2. Daftar Blokir
            </Button>

            <Button
              render={<Link href="/admin/susulan" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              3. Daftar Susulan
            </Button>
          </div>

          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-slate-500 hover:text-slate-900 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Lihat Landing Page
          </Button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
