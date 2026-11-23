import { Suspense } from "react";
import { db } from "@/db";
import { classes, examMakeups, students, subjects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdminSusulanClient } from "@/components/admin-susulan-client";

async function SusulanLoader() {
  const [classList, subjectList, studentList, makeupList] = await Promise.all([
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
        id: examMakeups.id,
        examId: students.examId,
        studentName: students.name,
        classId: classes.id,
        className: classes.name,
        subjectId: subjects.id,
        subjectName: subjects.name,
        reason: examMakeups.reason,
        notes: examMakeups.notes,
        isCompleted: examMakeups.isCompleted,
      })
      .from(examMakeups)
      .innerJoin(students, eq(examMakeups.studentId, students.id))
      .innerJoin(classes, eq(students.classId, classes.id))
      .innerJoin(subjects, eq(examMakeups.subjectId, subjects.id))
      .orderBy(examMakeups.isCompleted, desc(examMakeups.createdAt)),
  ]);

  return (
    <AdminSusulanClient
      classes={classList}
      subjects={subjectList}
      students={studentList}
      makeups={makeupList}
    />
  );
}

export default function AdminSusulanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Memuat daftar susulan...
        </div>
      }
    >
      <SusulanLoader />
    </Suspense>
  );
}
