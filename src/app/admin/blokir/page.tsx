import { Suspense } from "react";
import { db } from "@/db";
import { classes, examBlocks, students, subjects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdminBlokirClient } from "@/components/admin-blokir-client";

async function BlokirLoader() {
  const [classList, subjectList, studentList, blockList] = await Promise.all([
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
        id: examBlocks.id,
        examId: students.examId,
        studentName: students.name,
        classId: classes.id,
        className: classes.name,
        subjectId: subjects.id,
        subjectName: subjects.name,
        reason: examBlocks.reason,
        notes: examBlocks.notes,
        isCleared: examBlocks.isCleared,
      })
      .from(examBlocks)
      .innerJoin(students, eq(examBlocks.studentId, students.id))
      .innerJoin(classes, eq(students.classId, classes.id))
      .leftJoin(subjects, eq(examBlocks.subjectId, subjects.id))
      .orderBy(examBlocks.isCleared, desc(examBlocks.createdAt)),
  ]);

  return (
    <AdminBlokirClient
      classes={classList}
      subjects={subjectList}
      students={studentList}
      blocks={blockList}
    />
  );
}

export default function AdminBlokirPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Memuat daftar blokir...
        </div>
      }
    >
      <BlokirLoader />
    </Suspense>
  );
}
