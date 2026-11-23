"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { bulkImportStudents } from "@/actions/ujian-actions";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download, Loader2 } from "lucide-react";
import { toast } from "./ui/toast";

export function StudentExcelImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadTemplate = () => {
    const sampleData = [
      { ID_UJIAN: "UJ-2026-001", KELAS: "7A", NAMA_SISWA: "Ahmad Fauzi" },
      { ID_UJIAN: "UJ-2026-002", KELAS: "7B", NAMA_SISWA: "Siti Aminah" },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Siswa");
    XLSX.writeFile(wb, "Template_Upload_Siswa.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows =
        XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

      // Mapping fleksibel untuk variasi nama kolom Excel
      const parsedRows = jsonRows.map((row) => {
        const examId = String(
          row["ID_UJIAN"] ??
            row["id_ujian"] ??
            row["ID Ujian"] ??
            row["ID"] ??
            "",
        ).trim();
        const className = String(
          row["KELAS"] ?? row["kelas"] ?? row["Kelas"] ?? "",
        ).trim();
        const name = String(
          row["NAMA_SISWA"] ??
            row["nama_siswa"] ??
            row["Nama Siswa"] ??
            row["NAMA"] ??
            row["Nama"] ??
            "",
        ).trim();

        return { examId, className, name };
      });

      const res = await bulkImportStudents(parsedRows);
      if (res.success) {
        toast.add({ type: "success", description: res.message });
      } else {
        toast.add({
          type: "error",
          description: res.message,
          priority: "high",
        });
      }
    } catch {
      toast.add({
        type: "error",
        description:
          "Gagal membaca file Excel. Pastikan format .xlsx atau .csv valid.",
        priority: "high",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm flex items-center gap-2 text-emerald-900">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Import Massal Semua Siswa
        </h2>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="text-[11px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3 h-3" />
          Template
        </button>
      </div>

      <p className="text-[11px] text-emerald-800/80 leading-relaxed">
        Upload file Excel (<code>.xlsx</code> / <code>.csv</code>) dengan kolom:{" "}
        <strong>ID_UJIAN</strong>, <strong>KELAS</strong>,{" "}
        <strong>NAMA_SISWA</strong>.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button
        type="button"
        size="sm"
        disabled={isProcessing}
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-9 text-xs"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Memproses Data Excel...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            Pilih & Upload File Excel
          </>
        )}
      </Button>
    </div>
  );
}
