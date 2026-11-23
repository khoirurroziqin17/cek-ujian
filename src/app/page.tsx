import { Suspense } from "react";
import { db } from "@/db";
import {
  classes,
  examBlocks,
  examMakeups,
  students,
  subjects,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ExamLandingClient,
  GroupedBlockedStudent,
  GroupedMakeupStudent,
} from "@/components/exam-landing-client";

async function LandingDataLoader() {
  const [classList, subjectList, allStudentsRaw, rawBlocks, rawMakeups] =
    await Promise.all([
      db.select().from(classes).orderBy(classes.name),
      db.select().from(subjects).orderBy(subjects.name),
      db
        .select({
          id: students.id,
          examId: students.examId,
          name: students.name,
          className: classes.name,
        })
        .from(students)
        .innerJoin(classes, eq(students.classId, classes.id))
        .orderBy(classes.name, students.name),
      db
        .select({
          id: examBlocks.id,
          studentId: students.id,
          examId: students.examId,
          studentName: students.name,
          classId: classes.id,
          className: classes.name,
          subjectId: subjects.id,
          subjectName: subjects.name,
          reason: examBlocks.reason,
          notes: examBlocks.notes,
        })
        .from(examBlocks)
        .innerJoin(students, eq(examBlocks.studentId, students.id))
        .innerJoin(classes, eq(students.classId, classes.id))
        .leftJoin(subjects, eq(examBlocks.subjectId, subjects.id)) // <-- gunakan leftJoin
        .where(eq(examBlocks.isCleared, false))
        .orderBy(classes.name, students.name, subjects.name),
      db
        .select({
          id: examMakeups.id,
          studentId: students.id,
          studentName: students.name,
          classId: classes.id,
          className: classes.name,
          subjectId: subjects.id,
          subjectName: subjects.name,
          reason: examMakeups.reason,
          notes: examMakeups.notes,
        })
        .from(examMakeups)
        .innerJoin(students, eq(examMakeups.studentId, students.id))
        .innerJoin(classes, eq(students.classId, classes.id))
        .innerJoin(subjects, eq(examMakeups.subjectId, subjects.id))
        .where(eq(examMakeups.isCompleted, false))
        .orderBy(classes.name, students.name, subjects.name),
    ]);

  // 1. Kelompokkan Daftar Blokir per Siswa (1 Nama = 1 Baris)
  const blockedMap = new Map<number, GroupedBlockedStudent>();
  for (const row of rawBlocks) {
    if (!blockedMap.has(row.studentId)) {
      blockedMap.set(row.studentId, {
        studentId: row.studentId,
        studentName: row.studentName,
        classId: row.classId,
        className: row.className,
        subjects: [],
        hasTugasHarian: false,
        hasTataTertib: false,
        notes: [],
      });
    }
    const entry = blockedMap.get(row.studentId)!;
    if (
      row.subjectId &&
      row.subjectName &&
      !entry.subjects.some((s) => s.id === row.subjectId)
    ) {
      entry.subjects.push({ id: row.subjectId, name: row.subjectName });
    }
    if (row.reason === "TUGAS_HARIAN") entry.hasTugasHarian = true;
    if (row.reason === "TATA_TERTIB") entry.hasTataTertib = true;
    if (
      row.notes &&
      row.notes.trim() !== "" &&
      !entry.notes.includes(row.notes.trim())
    ) {
      entry.notes.push(row.notes.trim());
    }
  }

  // 2. Kelompokkan Daftar Susulan per Siswa (1 Nama = 1 Baris)
  const makeupMap = new Map<number, GroupedMakeupStudent>();
  for (const row of rawMakeups) {
    if (!makeupMap.has(row.studentId)) {
      makeupMap.set(row.studentId, {
        studentId: row.studentId,
        studentName: row.studentName,
        classId: row.classId,
        className: row.className,
        items: [],
      });
    }
    makeupMap.get(row.studentId)!.items.push({
      id: row.id,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      reason: row.reason,
      notes: row.notes,
    });
  }

  const directoryStudents = allStudentsRaw.map((st) => {
    const blockedEntry = blockedMap.get(st.id);
    const makeupEntry = makeupMap.get(st.id);

    const reasons: ("TUGAS_HARIAN" | "TATA_TERTIB")[] = [];
    if (blockedEntry?.hasTugasHarian) reasons.push("TUGAS_HARIAN");
    if (blockedEntry?.hasTataTertib) reasons.push("TATA_TERTIB");

    return {
      id: st.id,
      examId: st.examId,
      name: st.name,
      className: st.className,
      isBlocked: Boolean(blockedEntry),
      hasMakeup: Boolean(makeupEntry),
      blockedDetail: blockedEntry
        ? {
            subjects: blockedEntry.subjects.map((s) => s.name),
            reasons,
            notes: blockedEntry.notes,
          }
        : null,
      makeupDetail: makeupEntry
        ? {
            items: makeupEntry.items.map((item) => ({
              subjectName: item.subjectName,
              reason: item.reason,
              notes: item.notes,
            })),
          }
        : null,
    };
  });

  return (
    <ExamLandingClient
      classes={classList}
      subjects={subjectList}
      blockedStudents={Array.from(blockedMap.values())}
      makeupStudents={Array.from(makeupMap.values())}
      directoryStudents={directoryStudents}
    />
  );
}

function LandingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-pulse">
      <div className="h-40 bg-slate-200/70 rounded-2xl" />
      <div className="h-72 bg-slate-200/70 rounded-2xl" />
      <div className="h-72 bg-slate-200/70 rounded-2xl" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<LandingSkeleton />}>
        <LandingDataLoader />
      </Suspense>
    </main>
  );
}
