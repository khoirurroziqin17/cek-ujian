"use client";

import { useState, useMemo } from "react";
import {
  addClass,
  addStudent,
  addSubject,
  deleteClass,
  deleteStudent,
  deleteSubject,
} from "@/actions/ujian-actions";
import { Trash2, X } from "lucide-react";
import { toast } from "./ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIdButton } from "@/components/copy-id-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  School,
  BookOpen,
  UserPlus,
  Search,
  Ban,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { StudentExcelImport } from "./student-excel-import";

type StudentWithSummary = {
  id: number;
  examId: string;
  name: string;
  classId: number;
  className: string;
  blockedCount: number;
  makeupCount: number;
  hasRuleViolation: boolean;
};

type Props = {
  classes: { id: number; name: string }[];
  subjects: { id: number; name: string }[];
  students: StudentWithSummary[];
};

export function AdminMasterClient({ classes, subjects, students }: Props) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");

  const filteredStudents = useMemo(() => {
    const q = searchStudent.toLowerCase();
    return students.filter((s) => {
      const matchClass =
        filterClass === "ALL" || s.classId === Number(filterClass);
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.examId.toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [students, filterClass, searchStudent]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* KOLOM KIRI (4 KOLOM): FORM TAMBAH RINGKAS */}
      <div className="lg:col-span-4 space-y-5">
        {/* Tambah Siswa Terlibat */}
        <form
          action={addStudent}
          className="bg-white p-4 rounded-xl border shadow-xs space-y-3"
        >
          <StudentExcelImport />
          <h2 className="font-bold text-sm flex items-center gap-2 text-blue-700">
            <UserPlus className="w-4 h-4" />
            1. Tambah Siswa Terlibat
          </h2>
          <p className="text-[11px] text-slate-500">
            Hanya input siswa yang bermasalah/terlibat ujian susulan saja.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Select
              name="classId"
              value={selectedClassId}
              onValueChange={(v) => setSelectedClassId(v ?? "")}
              required
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Pilih Kelas *">
                  {selectedClassId
                    ? `Kelas ${classes.find((c) => String(c.id) === selectedClassId)?.name ?? ""}`
                    : "Pilih Kelas *"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    Kelas {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              name="examId"
              required
              placeholder="ID Ujian *"
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Input
              name="name"
              required
              placeholder="Nama Lengkap Siswa *"
              className="h-9 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 h-9"
            >
              Simpan
            </Button>
          </div>
        </form>

        {/* Tambah Kelas */}
        <form
          action={addClass}
          className="bg-white p-4 rounded-xl border shadow-xs space-y-3"
        >
          <h2 className="font-bold text-sm flex items-center gap-2 text-slate-800">
            <School className="w-4 h-4" />
            2. Master Kelas ({classes.length})
          </h2>
          <div className="flex gap-2">
            <Input
              name="name"
              required
              placeholder="Misal: 7B, 8A..."
              className="h-9 text-xs"
            />
            <Button type="submit" size="sm" variant="secondary" className="h-9">
              Tambah
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2 border-t max-h-28 overflow-y-auto">
            {classes.map((c) => (
              <Badge key={c.id} variant="outline" className="text-xs">
                {c.name}
                <button
                  type="button"
                  title={`Hapus Kelas ${c.name}`}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Hapus kelas "${c.name}"? Semua data siswa, blokir, dan susulan di kelas ini juga akan ikut terhapus.`,
                    );
                    if (!confirmed) return;

                    const res = await deleteClass(c.id);
                    if (res.success) {
                      toast.add({ type: "success", description: res.message });
                    } else {
                      toast.add({
                        type: "error",
                        description: res.message,
                        priority: "high",
                      });
                    }
                  }}
                  className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </form>

        {/* Tambah Mapel */}
        <form
          action={addSubject}
          className="bg-white p-4 rounded-xl border shadow-xs space-y-3"
        >
          <h2 className="font-bold text-sm flex items-center gap-2 text-slate-800">
            <BookOpen className="w-4 h-4" />
            3. Master Mata Pelajaran ({subjects.length})
          </h2>
          <div className="flex gap-2">
            <Input
              name="name"
              required
              placeholder="Misal: IPA, Matematika..."
              className="h-9 text-xs"
            />
            <Button type="submit" size="sm" variant="secondary" className="h-9">
              Tambah
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2 border-t max-h-32 overflow-y-auto">
            {subjects.map((s) => (
              <Badge key={s.id} variant="outline" className="text-xs">
                {s.name}
                <button
                  type="button"
                  title={`Hapus Mapel ${s.name}`}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Hapus mata pelajaran "${s.name}"? Data blokir dan susulan pada mata pelajaran ini juga akan ikut terhapus.`,
                    );
                    if (!confirmed) return;

                    const res = await deleteSubject(s.id);
                    if (res.success) {
                      toast.add({ type: "success", description: res.message });
                    } else {
                      toast.add({
                        type: "error",
                        description: res.message,
                        priority: "high",
                      });
                    }
                  }}
                  className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </form>
      </div>

      {/* KOLOM KANAN (8 KOLOM): DAFTAR SISWA + RINGKASAN */}
      <div className="lg:col-span-8 space-y-3">
        <div className="bg-white p-3.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="font-bold text-sm text-slate-900">
            Daftar Siswa Terdaftar ({filteredStudents.length} siswa)
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Cari nama / ID ujian..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select
              value={filterClass}
              onValueChange={(v) => setFilterClass(v ?? "ALL")}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Kelas">
                  {filterClass === "ALL"
                    ? "Semua Kelas"
                    : classes.find((c) => String(c.id) === filterClass)?.name ||
                      "Kelas"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-xs overflow-hidden">
          <div className="max-h-[65vh] overflow-auto">
            <Table className="min-w-160">
              <TableHeader className="bg-slate-100 sticky top-0 z-10 border-b">
                <TableRow>
                  <TableHead className="w-32 font-bold">ID Ujian</TableHead>
                  <TableHead className="w-52 font-bold">
                    Nama Siswa & Kelas
                  </TableHead>
                  <TableHead className="font-bold">Ringkasan Mapel</TableHead>
                  <TableHead className="w-40 font-bold">Tata Tertib</TableHead>
                  <TableHead className="w-16 text-right font-bold">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-40 text-center text-slate-500 text-xs"
                    >
                      Belum ada siswa terdaftar. Tambahkan melalui form di
                      samping.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((st) => (
                    <TableRow key={st.id} className="hover:bg-slate-50">
                      {/* Kolom 1: ID Ujian (Klik untuk copy) */}
                      <TableCell>
                        <CopyIdButton examId={st.examId} />
                      </TableCell>

                      {/* Kolom 2: Nama & Kelas */}
                      <TableCell>
                        <div className="font-semibold text-slate-900 leading-snug">
                          {st.name}
                        </div>
                        <div className="mt-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Kelas {st.className}
                          </span>
                        </div>
                      </TableCell>

                      {/* Kolom 3: Jumlah Mapel Terblokir & Susulan */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="outline"
                            className={
                              st.blockedCount > 0
                                ? "bg-amber-50 text-amber-800 border-amber-300 gap-1 text-[11px]"
                                : "bg-slate-50 text-slate-400 border-slate-200 gap-1 text-[11px]"
                            }
                          >
                            <Ban className="w-3 h-3" />
                            Blokir: {st.blockedCount} Mapel
                          </Badge>

                          <Badge
                            variant="outline"
                            className={
                              st.makeupCount > 0
                                ? "bg-purple-50 text-purple-800 border-purple-300 gap-1 text-[11px]"
                                : "bg-slate-50 text-slate-400 border-slate-200 gap-1 text-[11px]"
                            }
                          >
                            <Clock className="w-3 h-3" />
                            Susulan: {st.makeupCount} Mapel
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Kolom 4: Status Pelanggaran Aturan */}
                      <TableCell>
                        {st.hasRuleViolation ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-300 gap-1 text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            Melanggar Aturan
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50/70 text-emerald-700 border-emerald-200 gap-1 text-[11px]"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Tertib
                          </Badge>
                        )}
                      </TableCell>

                      {/* Kolom 5: Tombol Hapus Siswa */}
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          title={`Hapus ${st.name}`}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 h-7 px-2"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Hapus siswa "${st.name}" (${st.examId})? Semua data blokir dan susulan milik siswa ini juga akan ikut terhapus.`,
                            );
                            if (!confirmed) return;

                            const res = await deleteStudent(st.id);
                            if (res.success) {
                              toast.add({
                                type: "success",
                                description: res.message,
                              });
                            } else {
                              toast.add({
                                type: "error",
                                description: res.message,
                                priority: "high",
                              });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
