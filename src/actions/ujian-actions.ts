"use server";

import { db } from "@/db";
import {
  classes,
  subjects,
  students,
  examBlocks,
  examMakeups,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/blokir");
  revalidatePath("/admin/susulan");
}

// --- MASTER KELAS, MAPEL, SISWA ---
export async function addClass(formData: FormData) {
  const name = (formData.get("name") as string)?.trim().toUpperCase();
  if (!name) return;
  await db.insert(classes).values({ name }).onConflictDoNothing();
  revalidateAll();
}

export async function deleteClass(
  id: number,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "ID kelas tidak valid." };
  }

  await db.delete(classes).where(eq(classes.id, id));
  revalidateAll();

  return { success: true, message: "Data kelas berhasil dihapus." };
}

export async function addSubject(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await db.insert(subjects).values({ name }).onConflictDoNothing();
  revalidateAll();
}

export async function deleteSubject(
  id: number,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "ID mata pelajaran tidak valid." };
  }

  await db.delete(subjects).where(eq(subjects.id, id));
  revalidateAll();

  return { success: true, message: "Mata pelajaran berhasil dihapus." };
}

export async function addStudent(formData: FormData) {
  const examId = (formData.get("examId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const classId = Number(formData.get("classId"));
  if (!examId || !name || !classId) return;

  await db.insert(students).values({ examId, name, classId });
  revalidateAll();
}

export async function deleteStudent(
  id: number,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "ID siswa tidak valid." };
  }

  await db.delete(students).where(eq(students.id, id));
  revalidateAll();

  return { success: true, message: "Data siswa berhasil dihapus." };
}

// Helper untuk parsing array studentIds dari FormData
function parseStudentIds(formData: FormData): number[] {
  const raw = formData.get("studentIds");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id) && id > 0),
      ),
    );
  } catch {
    return [];
  }
}

// --- DAFTAR BLOKIR (MULTI SISWA UNTUK 1 PENYEBAB & 1 MAPEL) ---
export async function addExamBlock(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const studentIds = parseStudentIds(formData);
  const reason = formData.get("reason") as "TUGAS_HARIAN" | "TATA_TERTIB";
  const subjectIdRaw = formData.get("subjectId");
  const parsedSubjectId =
    subjectIdRaw && String(subjectIdRaw).trim() !== ""
      ? Number(subjectIdRaw)
      : null;
  const subjectId = reason === "TUGAS_HARIAN" ? parsedSubjectId : null;
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (studentIds.length === 0 || !reason) {
    return {
      success: false,
      message: "Pilih minimal 1 siswa dan penyebab blokir terlebih dahulu.",
    };
  }

  if (reason === "TUGAS_HARIAN" && (!subjectId || Number.isNaN(subjectId))) {
    return {
      success: false,
      message: "Pilih mata pelajaran untuk blokir tugas harian.",
    };
  }

  // Cek entri blokir aktif yang sudah ada untuk daftar siswa terpilih
  const existingRows =
    reason === "TATA_TERTIB"
      ? await db
          .select({ studentId: examBlocks.studentId })
          .from(examBlocks)
          .where(
            and(
              inArray(examBlocks.studentId, studentIds),
              eq(examBlocks.reason, "TATA_TERTIB"),
              eq(examBlocks.isCleared, false),
            ),
          )
      : await db
          .select({ studentId: examBlocks.studentId })
          .from(examBlocks)
          .where(
            and(
              inArray(examBlocks.studentId, studentIds),
              eq(examBlocks.subjectId, subjectId!),
              eq(examBlocks.reason, "TUGAS_HARIAN"),
              eq(examBlocks.isCleared, false),
            ),
          );

  const existingSet = new Set(existingRows.map((r) => r.studentId));
  const validStudentIds = studentIds.filter((id) => !existingSet.has(id));

  if (validStudentIds.length === 0) {
    return {
      success: false,
      message:
        "Gagal: Semua siswa yang dipilih sudah tercatat aktif pada daftar blokir ini!",
    };
  }

  await db.insert(examBlocks).values(
    validStudentIds.map((studentId) => ({
      studentId,
      subjectId,
      reason,
      notes,
    })),
  );

  revalidateAll();

  const skippedCount = studentIds.length - validStudentIds.length;
  const extraMsg =
    skippedCount > 0
      ? ` (${skippedCount} siswa dilewati karena sudah terdaftar)`
      : "";

  return {
    success: true,
    message: `Berhasil menambahkan ${validStudentIds.length} siswa ke daftar blokir${extraMsg}.`,
  };
}

export async function toggleBlockCleared(id: number, current: boolean) {
  await db
    .update(examBlocks)
    .set({ isCleared: !current })
    .where(eq(examBlocks.id, id));
  revalidateAll();
}

export async function deleteExamBlock(id: number) {
  await db.delete(examBlocks).where(eq(examBlocks.id, id));
  revalidateAll();
}

// --- DAFTAR SUSULAN (MULTI SISWA UNTUK 1 ALASAN & 1 MAPEL) ---
export async function addExamMakeup(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const studentIds = parseStudentIds(formData);
  const subjectId = Number(formData.get("subjectId"));
  const reason = formData.get("reason") as
    | "TIDAK_MASUK"
    | "TERBLOKIR_TUGAS"
    | "JAWABAN_TIDAK_TERKIRIM";
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (studentIds.length === 0 || !subjectId || !reason) {
    return {
      success: false,
      message: "Lengkapi pilihan siswa (min. 1), mata pelajaran, dan alasan.",
    };
  }

  // Cek entri susulan aktif yang sudah ada untuk daftar siswa terpilih
  const existingRows = await db
    .select({ studentId: examMakeups.studentId })
    .from(examMakeups)
    .where(
      and(
        inArray(examMakeups.studentId, studentIds),
        eq(examMakeups.subjectId, subjectId),
        eq(examMakeups.isCompleted, false),
      ),
    );

  const existingSet = new Set(existingRows.map((r) => r.studentId));
  const validStudentIds = studentIds.filter((id) => !existingSet.has(id));

  if (validStudentIds.length === 0) {
    return {
      success: false,
      message:
        "Gagal: Semua siswa yang dipilih sudah ada di daftar susulan mapel tersebut!",
    };
  }

  await db.insert(examMakeups).values(
    validStudentIds.map((studentId) => ({
      studentId,
      subjectId,
      reason,
      notes,
    })),
  );

  revalidateAll();

  const skippedCount = studentIds.length - validStudentIds.length;
  const extraMsg =
    skippedCount > 0
      ? ` (${skippedCount} siswa dilewati karena sudah terdaftar)`
      : "";

  return {
    success: true,
    message: `Berhasil menambahkan ${validStudentIds.length} siswa ke daftar susulan${extraMsg}.`,
  };
}

export async function toggleMakeupCompleted(id: number, current: boolean) {
  await db
    .update(examMakeups)
    .set({ isCompleted: !current })
    .where(eq(examMakeups.id, id));
  revalidateAll();
}

export async function deleteExamMakeup(id: number) {
  await db.delete(examMakeups).where(eq(examMakeups.id, id));
  revalidateAll();
}

export async function bulkImportStudents(
  rows: { examId: string; name: string; className: string }[],
): Promise<{ success: boolean; message: string; insertedCount?: number }> {
  if (!rows || rows.length === 0) {
    return { success: false, message: "Data Excel kosong atau tidak terbaca." };
  }

  // 1. Ambil semua kelas & examId yang sudah ada
  const [existingClasses, existingStudents] = await Promise.all([
    db.select().from(classes),
    db.select({ examId: students.examId }).from(students),
  ]);

  const classMap = new Map<string, number>();
  for (const c of existingClasses) {
    classMap.set(c.name.trim().toUpperCase(), c.id);
  }

  const existingExamIds = new Set(
    existingStudents.map((s) => s.examId.trim().toUpperCase()),
  );

  // 2. Pastikan semua kelas baru dari file Excel dibuat otomatis
  const uniqueNewClassNames = new Set<string>();
  for (const r of rows) {
    const cleanClass = r.className?.trim().toUpperCase();
    if (cleanClass && !classMap.has(cleanClass)) {
      uniqueNewClassNames.add(cleanClass);
    }
  }

  if (uniqueNewClassNames.size > 0) {
    const insertedClasses = await db
      .insert(classes)
      .values(Array.from(uniqueNewClassNames).map((name) => ({ name })))
      .returning();

    for (const c of insertedClasses) {
      classMap.set(c.name.trim().toUpperCase(), c.id);
    }
  }

  // 3. Filter baris valid & belum pernah terdaftar
  const toInsert: { examId: string; name: string; classId: number }[] = [];
  const seenInBatch = new Set<string>();

  for (const r of rows) {
    const examId = r.examId?.trim();
    const name = r.name?.trim();
    const cleanClass = r.className?.trim().toUpperCase();

    if (!examId || !name || !cleanClass) continue;

    const upperExamId = examId.toUpperCase();
    if (existingExamIds.has(upperExamId) || seenInBatch.has(upperExamId))
      continue;

    const classId = classMap.get(cleanClass);
    if (!classId) continue;

    seenInBatch.add(upperExamId);
    toInsert.push({ examId, name, classId });
  }

  if (toInsert.length === 0) {
    return {
      success: false,
      message:
        "Tidak ada siswa baru untuk diimpor (semua ID Ujian sudah terdaftar atau format kolom salah).",
    };
  }

  // 4. Insert batch ke database
  await db.insert(students).values(toInsert);
  revalidateAll();

  return {
    success: true,
    insertedCount: toInsert.length,
    message: `Berhasil mengimpor ${toInsert.length} data siswa baru!`,
  };
}
