"use server";

import { db } from "@/db";
import {
  classes,
  subjects,
  students,
  examBlocks,
  examMakeups,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
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

// --- DAFTAR BLOKIR (1 MAPEL SAJA, ATAU TANPA MAPEL JIKA TATA TERTIB) ---
export async function addExamBlock(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const studentId = Number(formData.get("studentId"));
  const reason = formData.get("reason") as "TUGAS_HARIAN" | "TATA_TERTIB";
  const subjectIdRaw = formData.get("subjectId");
  const parsedSubjectId =
    subjectIdRaw && String(subjectIdRaw).trim() !== ""
      ? Number(subjectIdRaw)
      : null;
  const subjectId = reason === "TUGAS_HARIAN" ? parsedSubjectId : null;
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (!studentId || !reason) {
    return {
      success: false,
      message: "Pilih siswa dan penyebab blokir terlebih dahulu.",
    };
  }

  if (reason === "TUGAS_HARIAN" && (!subjectId || Number.isNaN(subjectId))) {
    return {
      success: false,
      message: "Pilih mata pelajaran untuk blokir tugas harian.",
    };
  }

  if (reason === "TATA_TERTIB") {
    const existingRuleBlock = await db
      .select({ id: examBlocks.id })
      .from(examBlocks)
      .where(
        and(
          eq(examBlocks.studentId, studentId),
          eq(examBlocks.reason, "TATA_TERTIB"),
          eq(examBlocks.isCleared, false),
        ),
      )
      .limit(1);

    if (existingRuleBlock.length > 0) {
      return {
        success: false,
        message:
          "Gagal: Siswa ini sudah tercatat diblokir karena pelanggaran tata tertib.",
      };
    }
  } else if (subjectId) {
    const existingSubjectBlock = await db
      .select({ id: examBlocks.id })
      .from(examBlocks)
      .where(
        and(
          eq(examBlocks.studentId, studentId),
          eq(examBlocks.subjectId, subjectId),
          eq(examBlocks.reason, "TUGAS_HARIAN"),
          eq(examBlocks.isCleared, false),
        ),
      )
      .limit(1);

    if (existingSubjectBlock.length > 0) {
      return {
        success: false,
        message:
          "Gagal: Siswa & mata pelajaran tersebut sudah ter-upload di daftar blokir!",
      };
    }
  }

  await db.insert(examBlocks).values({
    studentId,
    subjectId,
    reason,
    notes,
  });

  revalidateAll();
  return { success: true, message: "Berhasil ditambahkan ke daftar blokir." };
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

// --- DAFTAR SUSULAN (1 MAPEL PER INPUT + CEK DUPLIKAT) ---
export async function addExamMakeup(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const studentId = Number(formData.get("studentId"));
  const subjectId = Number(formData.get("subjectId"));
  const reason = formData.get("reason") as
    | "TIDAK_MASUK"
    | "TERBLOKIR_TUGAS"
    | "JAWABAN_TIDAK_TERKIRIM";
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (!studentId || !subjectId || !reason) {
    return {
      success: false,
      message: "Lengkapi data siswa, mata pelajaran, dan alasan.",
    };
  }

  // Cek duplikasi aktif agar tidak ter-upload 2 kali
  const existingMakeup = await db
    .select({ id: examMakeups.id })
    .from(examMakeups)
    .where(
      and(
        eq(examMakeups.studentId, studentId),
        eq(examMakeups.subjectId, subjectId),
        eq(examMakeups.isCompleted, false),
      ),
    )
    .limit(1);

  if (existingMakeup.length > 0) {
    return {
      success: false,
      message:
        "Gagal: Siswa & mata pelajaran tersebut sudah ada di daftar susulan!",
    };
  }

  await db.insert(examMakeups).values({
    studentId,
    subjectId,
    reason,
    notes,
  });

  revalidateAll();
  return { success: true, message: "Berhasil ditambahkan ke daftar susulan." };
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
