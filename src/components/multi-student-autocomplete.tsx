"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Check, Users } from "lucide-react";

type StudentOption = {
  id: number;
  examId: string;
  name: string;
  classId: number;
  className: string;
};

type Props = {
  students: StudentOption[];
  selectedStudentIds: number[];
  onChange: (ids: number[]) => void;
};

export function MultiStudentAutocomplete({
  students,
  selectedStudentIds,
  onChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedStudentIds),
    [selectedStudentIds],
  );

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedSet.has(s.id)),
    [students, selectedSet],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 30);
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.examId.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [students, query]);

  const toggleStudent = (id: number) => {
    if (selectedSet.has(id)) {
      onChange(selectedStudentIds.filter((item) => item !== id));
    } else {
      onChange([...selectedStudentIds, id]);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {/* Hidden input untuk FormData */}
      <input
        type="hidden"
        name="studentIds"
        value={JSON.stringify(selectedStudentIds)}
      />

      {/* Daftar Chip Siswa Terpilih */}
      {selectedStudents.length > 0 && (
        <div className="p-2 rounded-lg border bg-slate-50/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-600" />
              {selectedStudents.length} siswa dipilih
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-red-600 hover:underline cursor-pointer"
            >
              Kosongkan
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedStudents.map((st) => (
              <Badge
                key={st.id}
                variant="secondary"
                className="pl-2 pr-1 py-0.5 text-[11px] gap-1 bg-white border border-slate-200 text-slate-800"
              >
                <span className="font-bold text-slate-500">
                  [{st.className}]
                </span>
                <span className="truncate max-w-35">{st.name}</span>
                <button
                  type="button"
                  onClick={() => toggleStudent(st.id)}
                  className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input Pencarian */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <Input
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Ketik nama, kelas, atau ID Ujian (bisa pilih banyak)..."
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Dropdown Hasil */}
      {isOpen && (
        <div className="border rounded-lg bg-white shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">
              Siswa tidak ditemukan.
            </div>
          ) : (
            filteredOptions.map((st) => {
              const isSelected = selectedSet.has(st.id);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => toggleStudent(st.id)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/80 text-blue-900 font-medium"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Kelas {st.className} • ID: {st.examId}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
