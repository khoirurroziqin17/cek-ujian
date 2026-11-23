"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyIdButton } from "@/components/copy-id-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  UserCheck,
  Loader2,
  Ban,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export type DirectoryStudent = {
  id: number;
  examId: string;
  name: string;
  className: string;
  isBlocked: boolean;
  hasMakeup: boolean;
  blockedDetail: {
    subjects: string[];
    reasons: ("TUGAS_HARIAN" | "TATA_TERTIB")[];
    notes: string[];
  } | null;
  makeupDetail: {
    items: {
      subjectName: string;
      reason: "TIDAK_MASUK" | "TERBLOKIR_TUGAS" | "JAWABAN_TIDAK_TERKIRIM";
      notes: string | null;
    }[];
  } | null;
};

const MAKEUP_REASON_LABEL: Record<string, string> = {
  TIDAK_MASUK: "Tidak Masuk Saat Ujian",
  TERBLOKIR_TUGAS: "Terblokir Karena Tugas",
  JAWABAN_TIDAK_TERKIRIM: "Jawaban Tidak Terkirim (Ulang dari Awal)",
};

export function FindMeWidget({ students }: { students: DirectoryStudent[] }) {
  const [rawInput, setRawInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<DirectoryStudent | null>(null);

  // Efek Debounce: setState hanya dijalankan di dalam callback setTimeout
  useEffect(() => {
    const trimmed = rawInput.trim().toLowerCase();
    const delay = trimmed ? 450 : 0;

    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, delay);

    return () => clearTimeout(timer);
  }, [rawInput]);

  // Status mengetik dihitung langsung tanpa state tambahan
  const isTyping =
    rawInput.trim().length >= 2 &&
    rawInput.trim().toLowerCase() !== debouncedQuery;

  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(debouncedQuery) ||
          s.examId.toLowerCase().includes(debouncedQuery),
      )
      .slice(0, 8);
  }, [students, debouncedQuery]);

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <UserCheck className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm sm:text-base text-slate-900">
            Temukan Saya (Cek ID Ujian & Status)
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">
          Ketik min. 2 huruf nama atau ID Ujian Anda
        </span>
      </div>

      {/* Input Pencarian dengan Indikator Debounce */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <Input
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Ketik nama lengkap atau ID Ujian (contoh: Ahmad / UJ-2026)..."
          className="pl-10 pr-10 h-10 text-sm bg-slate-50/70 focus:bg-white rounded-xl"
        />
        {isTyping ? (
          <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-blue-500 animate-spin" />
        ) : (
          rawInput && (
            <button
              type="button"
              onClick={() => {
                setRawInput("");
                setDebouncedQuery("");
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Area Hasil Setelah Debounce Selesai */}
      {!isTyping && debouncedQuery.length >= 2 && (
        <div className="pt-1">
          {results.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed">
              Tidak ditemukan siswa dengan kata kunci{" "}
              <strong className="text-slate-700">
                &ldquo;{rawInput}&rdquo;
              </strong>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-0.5">
              {results.map((st) => {
                const hasIssue = st.isBlocked || st.hasMakeup;

                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      if (hasIssue) setSelectedStudent(st);
                    }}
                    role={hasIssue ? "button" : undefined}
                    tabIndex={hasIssue ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (hasIssue && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setSelectedStudent(st);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      hasIssue
                        ? "border-amber-200/90 bg-amber-50/30 hover:bg-white hover:border-amber-400 hover:shadow-xs cursor-pointer group"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CopyIdButton examId={st.examId} />
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold"
                        >
                          Kelas {st.className}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <p
                          className={`font-semibold text-xs sm:text-sm truncate ${
                            hasIssue
                              ? "text-slate-900 group-hover:text-blue-700 underline decoration-dotted underline-offset-4"
                              : "text-slate-900"
                          }`}
                        >
                          {st.name}
                        </p>
                        {hasIssue && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                        )}
                      </div>

                      {hasIssue && (
                        <p className="text-[10px] text-amber-700 font-medium">
                          Klik nama untuk melihat detail kendala
                        </p>
                      )}
                    </div>

                    {/* Status Real-time Siswa */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {st.isBlocked && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-300 text-[10px] gap-1">
                          <Ban className="w-2.5 h-2.5" />
                          Diblokir
                        </Badge>
                      )}
                      {st.hasMakeup && (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border border-purple-300 text-[10px] gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Susulan
                        </Badge>
                      )}
                      {!hasIssue && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Siap Ujian
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DIALOG DETAIL INFORMASI SISWA (MUNCUL SAAT KARTU BELUM SIAP UJIAN DIKLIK) */}
      <Dialog
        open={Boolean(selectedStudent)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <CopyIdButton examId={selectedStudent.examId} />
                  <Badge variant="secondary" className="text-xs font-bold">
                    Kelas {selectedStudent.className}
                  </Badge>
                </div>
                <DialogTitle className="text-lg">
                  {selectedStudent.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Rincian status administrasi dan tanggungan ujian siswa.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Bagian 1: Detail Blokir (Jika Ada) */}
                {selectedStudent.isBlocked && selectedStudent.blockedDetail && (
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 space-y-2.5">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wide">
                      <Ban className="w-4 h-4 text-red-600" />
                      Status Diblokir (Pra-Ujian)
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Penyebab:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudent.blockedDetail.reasons.map((r) => (
                          <Badge
                            key={r}
                            className={
                              r === "TATA_TERTIB"
                                ? "bg-red-100 text-red-900 border-red-300 text-[11px]"
                                : "bg-amber-100 text-amber-900 border-amber-300 text-[11px]"
                            }
                          >
                            {r === "TATA_TERTIB"
                              ? "Melanggar Tata Tertib"
                              : "Tugas Harian Belum Selesai"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Mata Pelajaran Terdampak:
                      </p>
                      {selectedStudent.blockedDetail.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStudent.blockedDetail.subjects.map((sub) => (
                            <Badge
                              key={sub}
                              variant="outline"
                              className="bg-white text-slate-800 text-xs"
                            >
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-red-700 italic">
                          Semua Mata Pelajaran (Pelanggaran Tata Tertib)
                        </p>
                      )}
                    </div>

                    {selectedStudent.blockedDetail.notes.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-red-200/60">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Catatan Panitia / Guru:
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                          {selectedStudent.blockedDetail.notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Bagian 2: Detail Ujian Susulan (Jika Ada) */}
                {selectedStudent.hasMakeup && selectedStudent.makeupDetail && (
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2.5">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Daftar Ujian Susulan / Ulang (
                      {selectedStudent.makeupDetail.items.length} Mapel)
                    </div>

                    <div className="space-y-2">
                      {selectedStudent.makeupDetail.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white border border-purple-100 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {item.subjectName}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-800 border-purple-200 text-[10px]"
                            >
                              {MAKEUP_REASON_LABEL[item.reason] || item.reason}
                            </Badge>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-slate-600">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-100 text-[11px] text-slate-600">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    Segera temui guru mata pelajaran terkait atau panitia ujian
                    untuk menyelesaikan tanggungan di atas agar status berubah
                    menjadi <strong>Siap Ujian</strong>.
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
