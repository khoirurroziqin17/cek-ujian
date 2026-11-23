import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  pgEnum,
  text,
  boolean,
} from "drizzle-orm/pg-core";

// 1. Tabel Kelas
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 30 }).notNull().unique(), // Misal: "7A", "7B", "9C"
});

// 2. Tabel Mata Pelajaran
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Misal: "IPA", "Matematika"
});

// 3. Tabel Siswa (Hanya diisi siswa yang bersangkutan saja)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  examId: varchar("exam_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  classId: integer("class_id")
    .references(() => classes.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enum Alasan Blokir (Pra-Ujian)
export const blockReasonEnum = pgEnum("block_reason", [
  "TUGAS_HARIAN", // Tugas harian belum selesai
  "TATA_TERTIB", // Melanggar tata tertib
]);

// 4. Tabel Daftar Blokir (Diupload sebelum ujian berlangsung)
export const examBlocks = pgTable("exam_blocks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  subjectId: integer("subject_id").references(() => subjects.id, {
    onDelete: "cascade",
  }),
  reason: blockReasonEnum("reason").notNull(),
  notes: text("notes"), // Detail tugas / pelanggaran
  isCleared: boolean("is_cleared").default(false).notNull(), // True jika blokir sudah dibuka
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enum Alasan Ujian Susulan / Mengerjakan Ulang
export const makeupReasonEnum = pgEnum("makeup_reason", [
  "TIDAK_MASUK", // Sakit / Izin / Alpa saat jadwal ujian
  "TERBLOKIR_TUGAS", // Tidak bisa ikut karena status terblokir
  "JAWABAN_TIDAK_TERKIRIM", // Jawaban gagal masuk server -> wajib ulang dari awal
]);

// 5. Tabel Ujian Susulan / Ulang dari Awal
export const examMakeups = pgTable("exam_makeups", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  subjectId: integer("subject_id")
    .references(() => subjects.id, { onDelete: "cascade" })
    .notNull(),
  reason: makeupReasonEnum("reason").notNull(),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false).notNull(), // True jika sudah selesai susulan
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
