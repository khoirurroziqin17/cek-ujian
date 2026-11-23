"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyIdButton({ examId }: { examId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = examId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Klik untuk menyalin ID Ujian"
      className={`group inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
        copied
          ? "text-emerald-700 bg-emerald-50"
          : "text-slate-700 hover:text-blue-700 hover:bg-blue-50/80"
      }`}
    >
      <span className="underline decoration-dotted decoration-slate-300 group-hover:decoration-blue-400 underline-offset-4">
        {examId}
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
      )}
    </button>
  );
}
