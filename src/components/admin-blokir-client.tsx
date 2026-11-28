"use client";

import { useState, useMemo } from "react";
import {
  addExamBlock,
  deleteExamBlock,
  toggleBlockCleared,
} from "@/actions/ujian-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Ban,
  RotateCcw,
  Users,
  Copy,
  Check,
  MessageSquareShare,
} from "lucide-react";
import Link from "next/link";
import { MultiStudentAutocomplete } from "./multi-student-autocomplete";
import { CopyIdButton } from "./copy-id-button";
import { toast } from "./ui/toast";

type Props = {
  classes: { id: number; name: string }[];
  subjects: { id: number; name: string }[];
  students: {
    id: number;
    examId: string;
    name: string;
    classId: number;
    className: string;
  }[];
  blocks: {
    id: number;
    examId: string;
    studentName: string;
    classId: number;
    className: string;
    subjectId: number | null;
    subjectName: string | null;
    reason: "TUGAS_HARIAN" | "TATA_TERTIB";
    notes: string | null;
    isCleared: boolean;
  }[];
};

export function AdminBlokirClient({
  classes,
  subjects,
  students,
  blocks,
}: Props) {
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // State Dialog Salin Pesan WhatsApp Pengawas
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [copySubjectId, setCopySubjectId] = useState<string>("NONE");
  const [isCopied, setIsCopied] = useState(false);

  // Filter tabel utama
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterReason, setFilterReason] = useState<
    "ALL" | "TATA_TERTIB" | "TUGAS_HARIAN"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state di dalam Dialog Tambah
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedReason, setSelectedReason] = useState("TUGAS_HARIAN");

  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const matchClass =
        filterClass === "ALL" || b.classId === Number(filterClass);
      const matchSub =
        filterSubject === "ALL" || b.subjectId === Number(filterSubject);
      const matchReason = filterReason === "ALL" || b.reason === filterReason;
      const matchName =
        !searchQuery ||
        b.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.examId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSub && matchReason && matchName;
    });
  }, [blocks, filterClass, filterSubject, filterReason, searchQuery]);

  // Hitung jumlah siswa unik yang terfilter (berdasarkan examId)
  const uniqueFilteredStudentCount = useMemo(() => {
    return new Set(filteredBlocks.map((b) => b.examId)).size;
  }, [filteredBlocks]);

  // Susun teks format WhatsApp: Gabungan Melanggar Tata Tertib + Tugas Mapel Terpilih
  const whatsappPreviewText = useMemo(() => {
    // 1. Ambil hanya blokir yang masih aktif (!isCleared)
    const activeBlocks = blocks.filter((b) => !b.isCleared);

    // 2. Saring: Tata Tertib ATAU Tugas Harian untuk mapel yang dipilih
    const targetBlocks = activeBlocks.filter((b) => {
      if (b.reason === "TATA_TERTIB") return true;
      if (
        copySubjectId !== "NONE" &&
        b.reason === "TUGAS_HARIAN" &&
        b.subjectId === Number(copySubjectId)
      ) {
        return true;
      }
      return false;
    });

    // 3. Kelompokkan berdasarkan nama kelas & deduplikasi berdasarkan examId
    const classGroupMap = new Map<
      string,
      Map<string, { examId: string; name: string }>
    >();

    for (const item of targetBlocks) {
      if (!classGroupMap.has(item.className)) {
        classGroupMap.set(item.className, new Map());
      }
      const studentMap = classGroupMap.get(item.className)!;
      if (!studentMap.has(item.examId)) {
        studentMap.set(item.examId, {
          examId: item.examId,
          name: item.studentName,
        });
      }
    }

    // 4. Urutkan kelas secara natural (7A, 7B, 8A, dst.) & siswa berdasarkan abjad
    const sortedClasses = Array.from(classGroupMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "id", { numeric: true }),
    );

    let totalUniqueStudents = 0;
    const classSections: string[] = [];

    for (const [className, studentMap] of sortedClasses) {
      const sortedStudents = Array.from(studentMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "id"),
      );
      totalUniqueStudents += sortedStudents.length;

      const numberedLines = sortedStudents.map(
        (st, idx) => `${idx + 1}. ${st.name}`,
      );
      classSections.push(`*${className}:*\n${numberedLines.join("\n")}`);
    }

    if (totalUniqueStudents === 0) {
      return "0 siswa terblokir.";
    }

    return `*${totalUniqueStudents} SISWA TERBLOKIR.*\n*Mohon hp untuk diambil dan diletakkan di meja pengawas.*\n\n${classSections.join("\n")}`;
  }, [blocks, copySubjectId]);

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappPreviewText);
      setIsCopied(true);
      toast.add({
        type: "success",
        description: "Daftar siswa terblokir berhasil disalin untuk WhatsApp!",
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.add({
        type: "error",
        description:
          "Gagal menyalin otomatis. Silakan salin manual dari kotak teks.",
        priority: "high",
      });
    }
  };

  const isFiltered =
    filterClass !== "ALL" ||
    filterSubject !== "ALL" ||
    filterReason !== "ALL" ||
    searchQuery !== "";

  return (
    <div className="space-y-4">
      {/* HEADER BAR RINGKAS + TOMBOL SALIN WA & TAMBAH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Kelola Daftar Blokir (Pra-Ujian)
            </h1>
            <p className="text-xs text-slate-500">
              Total aktif:{" "}
              <strong className="text-red-600">
                {blocks.filter((b) => !b.isCleared).length}
              </strong>{" "}
              entri blokir
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Sinkronkan otomatis dengan filter mapel tabel jika sedang dipilih
              if (filterSubject !== "ALL") {
                setCopySubjectId(filterSubject);
              }
              setOpenCopyDialog(true);
            }}
            className="gap-1.5 border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
          >
            <MessageSquareShare className="w-4 h-4" />
            Salin Info Pengawas (WA)
          </Button>

          <Button
            onClick={() => setOpenAddDialog(true)}
            className="bg-red-600 hover:bg-red-700 gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa Diblokir
          </Button>
        </div>
      </div>

      {/* FILTER BAR: NAMA/ID, KELAS, MAPEL, PENYEBAB */}
      <div className="bg-white p-3 rounded-xl border space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / ID Ujian..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select
            value={filterClass}
            onValueChange={(v) => setFilterClass(v ?? "ALL")}
          >
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue>
                {filterClass === "ALL"
                  ? "Semua Kelas"
                  : `Kelas ${classes.find((c) => String(c.id) === filterClass)?.name || ""}`}
              </SelectValue>
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
            value={filterSubject}
            onValueChange={(v) => setFilterSubject(v ?? "ALL")}
          >
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue>
                {filterSubject === "ALL"
                  ? "Semua Mata Pelajaran"
                  : subjects.find((s) => String(s.id) === filterSubject)
                      ?.name || "Semua Mata Pelajaran"}
              </SelectValue>
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

          <Select
            value={filterReason}
            onValueChange={(v) => {
              const val = (v ?? "ALL") as
                | "ALL"
                | "TATA_TERTIB"
                | "TUGAS_HARIAN";
              setFilterReason(val);
              if (val === "TATA_TERTIB") setFilterSubject("ALL");
            }}
          >
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue>
                {filterReason === "ALL"
                  ? "Semua Penyebab"
                  : filterReason === "TATA_TERTIB"
                    ? "Melanggar Tata Tertib"
                    : "Tugas Harian Belum Selesai"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Penyebab</SelectItem>
              <SelectItem value="TATA_TERTIB">Melanggar Tata Tertib</SelectItem>
              <SelectItem value="TUGAS_HARIAN">
                Tugas Harian Belum Selesai
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* BAR INFORMASI JUMLAH SISWA TERFILTER DI ATAS TABEL */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-800 border border-slate-200 gap-1.5 font-bold"
            >
              <Users className="w-3.5 h-3.5 text-red-600" />
              {uniqueFilteredStudentCount} Siswa Terfilter
            </Badge>
            <span className="text-slate-400">
              ({filteredBlocks.length} entri blokir)
            </span>
          </div>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterClass("ALL");
                setFilterSubject("ALL");
                setFilterReason("ALL");
                setSearchQuery("");
              }}
              className="h-7 text-xs gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* AREA UTAMA: TABEL DAFTAR SISWA DIBLOKIR */}
      <div className="bg-white border rounded-xl shadow-xs overflow-hidden">
        <div className="max-h-[65vh] overflow-auto">
          <Table className="min-w-180">
            <TableHeader className="bg-slate-100 sticky top-0 z-10 border-b">
              <TableRow>
                <TableHead className="w-32 font-bold">ID Ujian</TableHead>
                <TableHead className="w-56 font-bold">
                  Nama Siswa & Kelas
                </TableHead>
                <TableHead className="w-40 font-bold">Mata Pelajaran</TableHead>
                <TableHead className="w-48 font-bold">
                  Alasan / Penyebab
                </TableHead>
                <TableHead className="font-bold">Keterangan</TableHead>
                <TableHead className="w-40 text-right font-bold">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlocks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-44 text-center text-slate-500 text-sm"
                  >
                    Tidak ada data siswa diblokir ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBlocks.map((b) => (
                  <TableRow
                    key={b.id}
                    className={
                      b.isCleared
                        ? "bg-slate-50/70 opacity-60"
                        : "hover:bg-slate-50"
                    }
                  >
                    <TableCell>
                      <CopyIdButton examId={b.examId} />
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {b.studentName}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        Kelas {b.className}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.subjectName ? (
                        <Badge variant="outline" className="bg-slate-50">
                          {b.subjectName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Semua Mapel
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.reason === "TUGAS_HARIAN" ? (
                        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-300 text-[11px]">
                          Tugas Harian Belum Selesai
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-900 hover:bg-red-100 border border-red-300 text-[11px]">
                          Melanggar Tata Tertib
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {b.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <form
                        action={toggleBlockCleared.bind(
                          null,
                          b.id,
                          b.isCleared,
                        )}
                        className="inline"
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant={b.isCleared ? "outline" : "default"}
                          className={
                            !b.isCleared
                              ? "bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2.5"
                              : "h-7 text-xs px-2.5"
                          }
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {b.isCleared ? "Blokir Lagi" : "Buka Blokir"}
                        </Button>
                      </form>
                      <form
                        action={deleteExamBlock.bind(null, b.id)}
                        className="inline"
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 h-7 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* DIALOG SALIN PESAN WHATSAPP UNTUK PENGAWAS UJIAN */}
      <Dialog open={openCopyDialog} onOpenChange={setOpenCopyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareShare className="w-5 h-5 text-emerald-600" />
              Salin Daftar Blokir untuk Pengawas (WA)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Otomatis menggabungkan semua siswa{" "}
              <strong>Melanggar Tata Tertib</strong> ditambah siswa{" "}
              <strong>Tugas Belum Selesai</strong> pada mata pelajaran yang
              diujikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Pilih Mata Pelajaran Ujian Saat Ini:
              </label>
              <Select
                value={copySubjectId}
                onValueChange={(v) => setCopySubjectId(v ?? "NONE")}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue>
                    {copySubjectId === "NONE"
                      ? "Hanya Melanggar Tata Tertib (Tanpa Mapel)"
                      : `Tata Tertib + Tugas ${subjects.find((s) => String(s.id) === copySubjectId)?.name || ""}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    Hanya Melanggar Tata Tertib (Tanpa Mapel)
                  </SelectItem>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={String(sub.id)}>
                      Tata Tertib + Tugas {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Pratinjau Pesan WhatsApp:
                </label>
                <span className="text-[11px] text-slate-400">
                  Hanya status blokir aktif
                </span>
              </div>
              <textarea
                readOnly
                rows={10}
                value={whatsappPreviewText}
                onClick={(e) => e.currentTarget.select()}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenCopyDialog(false)}
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCopyWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Teks ke Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG TAMBAH BLOKIR */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Siswa ke Daftar Blokir</DialogTitle>
            <DialogDescription className="text-xs">
              Jika nama siswa belum ada, tambahkan dulu di menu{" "}
              <Link
                href="/admin"
                className="text-blue-600 underline font-medium"
              >
                Master Siswa
              </Link>
              .
            </DialogDescription>
          </DialogHeader>

          <form
            action={async (formData) => {
              const res = await addExamBlock(formData);
              if (!res.success) {
                toast.add({
                  type: "error",
                  description: res.message,
                  priority: "high",
                });
                return;
              }
              toast.add({
                type: "success",
                description: res.message,
              });
              setSelectedStudentIds([]);
              setSelectedSubjectId("");
              setOpenAddDialog(false);
            }}
            className="space-y-4 mt-2"
          >
            {/* Hidden inputs agar Base UI Select selalu terkirim ke FormData */}
            <input type="hidden" name="reason" value={selectedReason} />
            <input type="hidden" name="subjectId" value={selectedSubjectId} />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Cari & Pilih Siswa (Bisa Pilih Banyak) *
              </label>
              <MultiStudentAutocomplete
                students={students}
                selectedStudentIds={selectedStudentIds}
                onChange={setSelectedStudentIds}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Penyebab Blokir *</label>
              <Select
                value={selectedReason}
                onValueChange={(v) => {
                  const val = v ?? "TUGAS_HARIAN";
                  setSelectedReason(val);
                  if (val === "TATA_TERTIB") setSelectedSubjectId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedReason === "TUGAS_HARIAN"
                      ? "Tugas Harian Belum Selesai"
                      : "Melanggar Tata Tertib (Tanpa Mapel)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUGAS_HARIAN">
                    Tugas Harian Belum Selesai
                  </SelectItem>
                  <SelectItem value="TATA_TERTIB">
                    Melanggar Tata Tertib (Tanpa Mapel)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hanya tampil jika penyebab adalah Tugas Harian */}
            {selectedReason === "TUGAS_HARIAN" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  Mata Pelajaran (1 Mapel) *
                </label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={(v) => setSelectedSubjectId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Pilih Mata Pelajaran --">
                      {subjects.find((s) => String(s.id) === selectedSubjectId)
                        ?.name || "-- Pilih Mata Pelajaran --"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Keterangan (Opsional)
              </label>
              <Input
                name="notes"
                placeholder="Misal: Tugas Bab 3 belum dikumpulkan"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Simpan Daftar Blokir
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
