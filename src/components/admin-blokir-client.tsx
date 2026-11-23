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

  // Filter tabel utama
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state di dalam Dialog
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedReason, setSelectedReason] = useState("TUGAS_HARIAN");

  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const matchClass =
        filterClass === "ALL" || b.classId === Number(filterClass);
      const matchSub =
        filterSubject === "ALL" || b.subjectId === Number(filterSubject);
      const matchName =
        !searchQuery ||
        b.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSub && matchName;
    });
  }, [blocks, filterClass, filterSubject, searchQuery]);

  const isFiltered =
    filterClass !== "ALL" || filterSubject !== "ALL" || searchQuery !== "";

  return (
    <div className="space-y-4">
      {/* HEADER BAR RINGKAS + TOMBOL TAMBAH */}
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

        <Button
          onClick={() => setOpenAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa Diblokir
        </Button>
      </div>

      {/* FILTER BAR 1 BARIS MINIMALIS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select
          value={filterClass}
          onValueChange={(v) => setFilterClass(v ?? "ALL")}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Semua Kelas" />
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
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Semua Mapel" />
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

        {isFiltered ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterClass("ALL");
              setFilterSubject("ALL");
              setSearchQuery("");
            }}
            className="h-9 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </Button>
        ) : (
          <div className="flex items-center justify-end px-2 text-xs text-slate-400">
            Menampilkan {filteredBlocks.length} data
          </div>
        )}
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
