/**
 * Seeds the questions table from content/questions.json.
 * Uses the service-role key (server-only) to bypass RLS for the insert.
 *
 *   1. cp .env.example .env  (fill in values)
 *   2. npm run seed
 *
 * Marks the first N questions per area as `is_free` so the public
 * diagnostic has coverage across all five content areas.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

const FREE_PER_AREA = 1; // how many questions per area to expose in the free diagnostic

type Q = {
  id: string;
  content_area: string;
  outline_ref?: string;
  subtopic?: string;
  difficulty?: string;
  type?: string;
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
  primary_source_citation?: string;
  last_reviewed_date?: string;
};

async function main() {
  const raw = JSON.parse(readFileSync("content/questions.json", "utf8"));
  const questions: Q[] = raw.questions;

  // choose the free diagnostic subset
  const freeCount: Record<string, number> = {};
  const rows = questions.map((q) => {
    freeCount[q.content_area] = (freeCount[q.content_area] ?? 0) + 1;
    const is_free = freeCount[q.content_area] <= FREE_PER_AREA;
    return {
      id: q.id,
      content_area: q.content_area,
      outline_ref: q.outline_ref ?? null,
      subtopic: q.subtopic ?? null,
      difficulty: q.difficulty ?? null,
      type: q.type ?? null,
      stem: q.stem,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      primary_source_citation: q.primary_source_citation ?? null,
      is_free,
      last_reviewed_date: q.last_reviewed_date ?? null,
    };
  });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  console.log(`Seeded ${rows.length} questions (${rows.filter((r) => r.is_free).length} marked free).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
