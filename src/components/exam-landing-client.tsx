"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  RotateCcw,
  Eye,
  CheckCircle2,
  Ban,
  Filter,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { DirectoryStudent, FindMeWidget } from "./find-me-widget";

export type GroupedBlockedStudent = {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  subjects: { id: number; name: string }[];
  hasTugasHarian: boolean;
  hasTataTertib: boolean;
  notes: string[];
};

export type GroupedMakeupStudent = {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  items: {
    id: number;
    subjectId: number;
    subjectName: string;
    reason: "TIDAK_MASUK" | "TERBLOKIR_TUGAS" | "JAWABAN_TIDAK_TERKIRIM";
    notes: string | null;
  }[];
};

type Props = {
  classes: { id: number; name: string }[];
  subjects: { id: number; name: string }[];
  blockedStudents: GroupedBlockedStudent[];
  makeupStudents: GroupedMakeupStudent[];
  directoryStudents: DirectoryStudent[];
};

const MAKEUP_REASON_INFO = {
  TIDAK_MASUK: {
    label: "Tidak Masuk Saat Ujian",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  TERBLOKIR_TUGAS: {
    label: "Terblokir Karena Tugas",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  JAWABAN_TIDAK_TERKIRIM: {
    label: "Jawaban Tidak Terkirim (Ulang dari Awal)",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function ExamLandingClient({
  classes,
  subjects,
  blockedStudents,
  makeupStudents,
  directoryStudents,
}: Props) {
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [activeStudentDetail, setActiveStudentDetail] =
    useState<GroupedMakeupStudent | null>(null);

  const isFiltered = selectedClass !== "ALL" || selectedSubject !== "ALL";

  const handleReset = () => {
    setSelectedClass("ALL");
    setSelectedSubject("ALL");
  };

  // Filter otomatis Daftar Blokir
  const filteredBlocked = useMemo(() => {
    return blockedStudents.filter((student) => {
      const matchClass =
        selectedClass === "ALL" || student.classId === Number(selectedClass);
      const matchSubject =
        selectedSubject === "ALL" ||
        student.subjects.some((sub) => sub.id === Number(selectedSubject));
      return matchClass && matchSubject;
    });
  }, [blockedStudents, selectedClass, selectedSubject]);

  // Filter otomatis Daftar Susulan
  const filteredMakeup = useMemo(() => {
    return makeupStudents.filter((student) => {
      const matchClass =
        selectedClass === "ALL" || student.classId === Number(selectedClass);
      const matchSubject =
        selectedSubject === "ALL" ||
        student.items.some(
          (item) => item.subjectId === Number(selectedSubject),
        );
      return matchClass && matchSubject;
    });
  }, [makeupStudents, selectedClass, selectedSubject]);

  return (
    <div className="space-y-10">
      {/* =========================================================
          HERO SECTION DENGAN SUBTLE GRID & GLOW EFFECT
         ========================================================= */}
      <section className="relative overflow-hidden bg-white border-b bg-grid-slate">
        {/* Radial Gradient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-150 h-70 rounded-full bg-linear-to-tr from-blue-100/60 via-purple-100/40 to-amber-100/40 blur-3xl"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-10 space-y-8">
          <div className="max-w-2xl space-y-3 animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cek Status Peserta Ujian</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Daftar Blokir & Peserta{" "}
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ujian Susulan
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Pantau daftar siswa yang terblokir sebelum ujian berlangsung serta
              daftar siswa yang wajib mengikuti ujian susulan atau pengerjaan
              ulang dari awal.
            </p>
          </div>

          {/* KARTU RINGKASAN INTERAKTIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl animate-fade-in-up animate-delay-100">
            <a
              href="#daftar-blokir"
              className="group bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-red-200 transition-all duration-200 flex items-center gap-4"
            >
              <div className="p-3 rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Siswa Diblokir (Pra-Ujian)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-slate-900">
                    {blockedStudents.length}
                  </p>
                  <span className="text-xs text-red-600 font-medium">
                    Siswa &rarr;
                  </span>
                </div>
              </div>
            </a>

            <a
              href="#daftar-susulan"
              className="group bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-200 transition-all duration-200 flex items-center gap-4"
            >
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Wajib Susulan / Ulang
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-slate-900">
                    {makeupStudents.length}
                  </p>
                  <span className="text-xs text-purple-600 font-medium">
                    Siswa &rarr;
                  </span>
                </div>
              </div>
            </a>
          </div>

          <FindMeWidget students={directoryStudents} />

          {/* FILTER BAR INSTAN (KELAS & MATA PELAJARAN) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-fade-in-up animate-delay-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                Filter Cepat (Otomatis Menyaring Kedua Tabel)
              </span>
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filter
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  value={selectedClass}
                  onValueChange={(val) => setSelectedClass(val ?? "ALL")}
                >
                  <SelectTrigger className="w-full bg-slate-50/50 hover:bg-white transition-colors">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Kelas</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        Kelas {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedSubject}
                  onValueChange={(val) => setSelectedSubject(val ?? "ALL")}
                >
                  <SelectTrigger className="w-full bg-slate-50/50 hover:bg-white transition-colors">
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Mata Pelajaran</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isFiltered && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2 shrink-0 border-slate-300 hover:bg-slate-100"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          KONTEN UTAMA: 2 TABEL SCROLLABLE X & Y
         ========================================================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-14">
        {/* BAGIAN 1: DAFTAR BLOKIR (PRA-UJIAN) */}
        <section id="daftar-blokir" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Tahap Pra-Ujian</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                1. Daftar Siswa Diblokir
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Wajib menyelesaikan tugas harian atau urusan tata tertib kepada
                guru terkait sebelum ujian dimulai.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="w-fit px-3 py-1 text-xs font-semibold"
            >
              {filteredBlocked.length} Siswa
            </Badge>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Scroll X & Y dengan tinggi dibatasi */}
            <div className="max-h-105 overflow-auto">
              <Table className="min-w-170">
                <TableHeader className="bg-slate-100/95 backdrop-blur-xs sticky top-0 z-10 border-b">
                  <TableRow>
                    <TableHead className="w-24 font-bold text-slate-700">
                      Kelas
                    </TableHead>
                    <TableHead className="w-56 font-bold text-slate-700">
                      Nama Siswa
                    </TableHead>
                    <TableHead className="w-64 font-bold text-slate-700">
                      Penyebab Pemblokiran
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      Mata Pelajaran Diblokir
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlocked.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-36 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                          <span className="font-medium text-slate-700">
                            Tidak ada siswa yang diblokir
                          </span>
                          <span className="text-xs">
                            Semua siswa pada filter ini siap mengikuti ujian.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBlocked.map((student) => (
                      <TableRow
                        key={student.studentId}
                        className="hover:bg-slate-50/90 transition-colors"
                      >
                        <TableCell>
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                            {student.className}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {student.studentName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {/* Satu badge penyebab, kecuali jika melanggar aturan juga maka tampil dua badge */}
                            {student.hasTugasHarian && (
                              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-300 font-medium">
                                Tugas Harian Belum Selesai
                              </Badge>
                            )}
                            {student.hasTataTertib && (
                              <Badge className="bg-red-100 text-red-900 hover:bg-red-100 border border-red-300 font-medium">
                                Melanggar Tata Tertib
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {student.subjects.map((sub) => (
                              <Badge
                                key={sub.id}
                                variant="outline"
                                className="bg-white text-slate-700 border-slate-300 font-medium shadow-2xs"
                              >
                                {sub.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        {/* BAGIAN 2: DAFTAR UJIAN SUSULAN / MENGERJAKAN ULANG */}
        <section id="daftar-susulan" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600">
                <Clock className="w-4 h-4" />
                <span>Tahap Pasca-Ujian</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                2. Daftar Peserta Ujian Susulan & Ulang
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Klik tombol <strong>Lihat Alasan</strong> untuk mengecek rincian
                mata pelajaran serta alasan wajib susulan/ulang.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="w-fit px-3 py-1 text-xs font-semibold"
            >
              {filteredMakeup.length} Siswa
            </Badge>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Scroll X & Y dengan tinggi dibatasi */}
            <div className="max-h-105 overflow-auto">
              <Table className="min-w-160">
                <TableHeader className="bg-slate-100/95 backdrop-blur-xs sticky top-0 z-10 border-b">
                  <TableRow>
                    <TableHead className="w-24 font-bold text-slate-700">
                      Kelas
                    </TableHead>
                    <TableHead className="w-56 font-bold text-slate-700">
                      Nama Siswa
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      Mata Pelajaran Susulan
                    </TableHead>
                    <TableHead className="w-36 text-right font-bold text-slate-700">
                      Keterangan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMakeup.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-36 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                          <span className="font-medium text-slate-700">
                            Tidak ada peserta ujian susulan
                          </span>
                          <span className="text-xs">
                            Tidak ditemukan siswa susulan pada filter yang
                            dipilih.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMakeup.map((student) => (
                      <TableRow
                        key={student.studentId}
                        className="hover:bg-slate-50/90 transition-colors"
                      >
                        <TableCell>
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                            {student.className}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {student.studentName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {student.items.map((item) => (
                              <Badge
                                key={item.id}
                                variant="outline"
                                className="bg-purple-50/80 text-purple-900 border-purple-200 font-medium"
                              >
                                {item.subjectName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs rounded-lg hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                            onClick={() => setActiveStudentDetail(student)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat Alasan
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================
          DIALOG BOX RINCIAN ALASAN SUSULAN (BASE UI DIALOG)
         ========================================================= */}
      <Dialog
        open={!!activeStudentDetail}
        onOpenChange={(open) => !open && setActiveStudentDetail(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {activeStudentDetail?.studentName}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Kelas{" "}
              <strong className="text-slate-800">
                {activeStudentDetail?.className}
              </strong>{" "}
              • Rincian mata pelajaran dan penyebab wajib mengikuti ujian
              susulan:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
            {activeStudentDetail?.items.map((item) => {
              const info = MAKEUP_REASON_INFO[item.reason];
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 transition-all hover:bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      {item.subjectName}
                    </span>
                    <Badge variant="outline" className={info.badgeClass}>
                      {info.label}
                    </Badge>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <span className="font-semibold text-slate-800">
                        Catatan Panitia:
                      </span>{" "}
                      {item.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
