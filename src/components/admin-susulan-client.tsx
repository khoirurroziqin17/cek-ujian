"use client";

import { useState, useMemo } from "react";
import {
  addExamMakeup,
  deleteExamMakeup,
  toggleMakeupCompleted,
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
  Clock,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { StudentAutocomplete } from "./student-autocomplete";
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
  makeups: {
    id: number;
    examId: string;
    studentName: string;
    classId: number;
    className: string;
    subjectId: number;
    subjectName: string;
    reason: "TIDAK_MASUK" | "TERBLOKIR_TUGAS" | "JAWABAN_TIDAK_TERKIRIM";
    notes: string | null;
    isCompleted: boolean;
  }[];
};

const REASON_OPTIONS = {
  TIDAK_MASUK: {
    label: "Tidak Masuk Saat Ujian",
    style: "bg-blue-100 text-blue-800 border-blue-200",
  },
  TERBLOKIR_TUGAS: {
    label: "Terblokir Karena Tugas",
    style: "bg-amber-100 text-amber-800 border-amber-200",
  },
  JAWABAN_TIDAK_TERKIRIM: {
    label: "Jawaban Tidak Terkirim (Ulang dari Awal)",
    style: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function AdminSusulanClient({
  classes,
  subjects,
  students,
  makeups,
}: Props) {
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // Filter tabel utama
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state di dalam Dialog
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedReason, setSelectedReason] = useState<
    "TIDAK_MASUK" | "TERBLOKIR_TUGAS" | "JAWABAN_TIDAK_TERKIRIM"
  >("TIDAK_MASUK");

  const filteredMakeups = useMemo(() => {
    return makeups.filter((m) => {
      const matchClass =
        filterClass === "ALL" || m.classId === Number(filterClass);
      const matchSub =
        filterSubject === "ALL" || m.subjectId === Number(filterSubject);
      const matchName =
        !searchQuery ||
        m.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.examId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSub && matchName;
    });
  }, [makeups, filterClass, filterSubject, searchQuery]);

  const isFiltered =
    filterClass !== "ALL" || filterSubject !== "ALL" || searchQuery !== "";

  return (
    <div className="space-y-4">
      {/* HEADER BAR RINGKAS + TOMBOL TAMBAH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Kelola Daftar Ujian Susulan / Ulang
            </h1>
            <p className="text-xs text-slate-500">
              Total belum susulan:{" "}
              <strong className="text-purple-600">
                {makeups.filter((m) => !m.isCompleted).length}
              </strong>{" "}
              entri
            </p>
          </div>
        </div>

        <Button
          onClick={() => setOpenAddDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Peserta Susulan
        </Button>
      </div>

      {/* FILTER BAR 1 BARIS MINIMALIS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama / ID ujian..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select
          value={filterClass}
          onValueChange={(v) => setFilterClass(v ?? "ALL")}
        >
          <SelectTrigger className="h-9 text-xs">
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
          <SelectTrigger className="h-9 text-xs">
            <SelectValue>
              {filterSubject === "ALL"
                ? "Semua Mata Pelajaran"
                : subjects.find((s) => String(s.id) === filterSubject)?.name ||
                  "Semua Mata Pelajaran"}
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
            Menampilkan {filteredMakeups.length} data
          </div>
        )}
      </div>

      {/* AREA UTAMA: TABEL DAFTAR PESERTA SUSULAN */}
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
                <TableHead className="w-56 font-bold">Alasan Susulan</TableHead>
                <TableHead className="font-bold">Catatan</TableHead>
                <TableHead className="w-40 text-right font-bold">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMakeups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-44 text-center text-slate-500 text-sm"
                  >
                    Tidak ada data peserta ujian susulan ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMakeups.map((m) => (
                  <TableRow
                    key={m.id}
                    className={
                      m.isCompleted
                        ? "bg-slate-50/70 opacity-60"
                        : "hover:bg-slate-50"
                    }
                  >
                    <TableCell>
                      <CopyIdButton examId={m.examId} />
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {m.studentName}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        Kelas {m.className}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-900 border-purple-200"
                      >
                        {m.subjectName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${REASON_OPTIONS[m.reason].style} text-[11px]`}
                      >
                        {REASON_OPTIONS[m.reason].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {m.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <form
                        action={toggleMakeupCompleted.bind(
                          null,
                          m.id,
                          m.isCompleted,
                        )}
                        className="inline"
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant={m.isCompleted ? "outline" : "default"}
                          className={
                            !m.isCompleted
                              ? "bg-blue-600 hover:bg-blue-700 h-7 text-xs px-2.5"
                              : "h-7 text-xs px-2.5"
                          }
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {m.isCompleted ? "Batal" : "Selesai"}
                        </Button>
                      </form>
                      <form
                        action={deleteExamMakeup.bind(null, m.id)}
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

      {/* DIALOG TAMBAH SUSULAN */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Peserta Ujian Susulan / Ulang</DialogTitle>
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
              const res = await addExamMakeup(formData);
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
              setSelectedStudentId("");
              setSelectedSubjectId("");
              setOpenAddDialog(false);
            }}
            className="space-y-4 mt-2"
          >
            {/* Hidden inputs agar Base UI Select selalu terkirim ke FormData */}
            <input type="hidden" name="subjectId" value={selectedSubjectId} />
            <input type="hidden" name="reason" value={selectedReason} />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Cari & Pilih Siswa (Nama / ID Ujian) *
              </label>
              <StudentAutocomplete
                students={students}
                selectedStudentId={selectedStudentId}
                onSelect={setSelectedStudentId}
              />
            </div>

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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Alasan Wajib Susulan / Ulang *
              </label>
              <Select
                value={selectedReason}
                onValueChange={(v) =>
                  setSelectedReason(
                    (v as
                      | "TIDAK_MASUK"
                      | "TERBLOKIR_TUGAS"
                      | "JAWABAN_TIDAK_TERKIRIM") ?? "TIDAK_MASUK",
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {REASON_OPTIONS[selectedReason].label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIDAK_MASUK">
                    Tidak Masuk Saat Ujian
                  </SelectItem>
                  <SelectItem value="TERBLOKIR_TUGAS">
                    Terblokir Karena Tugas
                  </SelectItem>
                  <SelectItem value="JAWABAN_TIDAK_TERKIRIM">
                    Jawaban Tidak Terkirim (Ulang dari Awal)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Catatan Detail (Opsional)
              </label>
              <Input
                name="notes"
                placeholder="Misal: Koneksi terputus saat submit jawaban"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Simpan Daftar Susulan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
