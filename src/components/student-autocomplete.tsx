"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, X } from "lucide-react";

export type StudentOption = {
  id: number;
  examId: string;
  name: string;
  classId: number;
  className: string;
};

type Props = {
  students: StudentOption[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
};

export function StudentAutocomplete({
  students,
  selectedStudentId,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === selectedStudentId) || null,
    [students, selectedStudentId],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 8); // Tampilkan 8 siswa teratas jika belum mengetik
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.examId.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [students, query]);

  return (
    <div className="relative space-y-1.5">
      {/* Hidden input untuk FormData Server Action */}
      <input
        type="hidden"
        name="studentId"
        value={selectedStudentId}
        required
      />

      {selectedStudent ? (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/70 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-mono font-bold text-blue-700">
              {selectedStudent.examId}
            </span>
            <Badge variant="secondary" className="font-bold">
              {selectedStudent.className}
            </Badge>
            <span className="font-semibold text-slate-900">
              {selectedStudent.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setQuery("");
              setIsOpen(true);
            }}
            className="text-slate-500 hover:text-red-600 p-1 rounded"
            title="Ganti siswa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Ketik nama siswa, kelas, atau ID Ujian..."
            className="pl-9 text-xs"
            autoComplete="off"
          />

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y">
              {matches.length === 0 ? (
                <div className="p-3 text-xs text-center text-slate-500">
                  Nama/ID Ujian tidak ditemukan di Master Siswa.
                </div>
              ) : (
                matches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelect(String(s.id));
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {s.examId}
                      </span>
                      <span className="font-medium text-slate-900 truncate">
                        {s.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {s.className}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
