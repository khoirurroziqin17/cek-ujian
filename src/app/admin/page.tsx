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
import { AdminMasterClient } from "@/components/admin-master-client";

async function MasterLoader() {
  const [classList, subjectList, rawStudents, activeBlocks, activeMakeups] =
    await Promise.all([
      db.select().from(classes).orderBy(classes.name),
      db.select().from(subjects).orderBy(subjects.name),
      db
        .select({
          id: students.id,
          examId: students.examId,
          name: students.name,
          classId: students.classId,
          className: classes.name,
        })
        .from(students)
        .innerJoin(classes, eq(students.classId, classes.id))
        .orderBy(classes.name, students.name),
      db
        .select({
          studentId: examBlocks.studentId,
          subjectId: examBlocks.subjectId, // <-- Ambil subjectId
          reason: examBlocks.reason,
        })
        .from(examBlocks)
        .where(eq(examBlocks.isCleared, false)),
      db
        .select({
          studentId: examMakeups.studentId,
        })
        .from(examMakeups)
        .where(eq(examMakeups.isCompleted, false)),
    ]);

  const blockCountMap = new Map<number, number>();
  const ruleViolationSet = new Set<number>();

  for (const b of activeBlocks) {
    // Hanya hitung ke jumlah mapel jika subjectId ada (bukan pelanggaran tata tertib)
    if (b.subjectId !== null) {
      blockCountMap.set(b.studentId, (blockCountMap.get(b.studentId) || 0) + 1);
    }
    if (b.reason === "TATA_TERTIB") {
      ruleViolationSet.add(b.studentId);
    }
  }

  const makeupCountMap = new Map<number, number>();
  for (const m of activeMakeups) {
    makeupCountMap.set(m.studentId, (makeupCountMap.get(m.studentId) || 0) + 1);
  }

  const studentListWithSummary = rawStudents.map((st) => ({
    ...st,
    blockedCount: blockCountMap.get(st.id) || 0,
    makeupCount: makeupCountMap.get(st.id) || 0,
    hasRuleViolation: ruleViolationSet.has(st.id),
  }));

  return (
    <AdminMasterClient
      classes={classList}
      subjects={subjectList}
      students={studentListWithSummary}
    />
  );
}

export default function AdminMasterHomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Memuat master data...
        </div>
      }
    >
      <MasterLoader />
    </Suspense>
  );
}
