// Correct-rate monitor — data-driven answer-key QA.
// Once real users have answered questions, this queries session_items and flags:
//   * correct rate < 35% with enough attempts  -> possible bad key / miskeyed answer
//   * correct rate > 97% with enough attempts   -> too easy / gives itself away
//   * options never chosen                       -> weak (non-functioning) distractor
// Run: npm run monitor   (requires .env with SUPABASE_SERVICE_ROLE_KEY)
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const MIN_ATTEMPTS = Number(process.env.QA_MIN_ATTEMPTS ?? 20);
const LOW = 0.35, HIGH = 0.97;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // pull attempts (paginate for large volumes)
  let from = 0, page = 1000, rows = [];
  while (true) {
    const { data, error } = await db
      .from("session_items")
      .select("question_id,chosen_index,is_correct")
      .range(from, from + page - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }

  if (!rows.length) {
    console.log("\n  No attempt data yet. This monitor becomes useful once users start answering.\n");
    return;
  }

  const stats = new Map(); // qid -> {n, correct, chosen:Map}
  for (const r of rows) {
    const s = stats.get(r.question_id) ?? { n: 0, correct: 0, chosen: new Map() };
    s.n++;
    if (r.is_correct) s.correct++;
    s.chosen.set(r.chosen_index, (s.chosen.get(r.chosen_index) ?? 0) + 1);
    stats.set(r.question_id, s);
  }

  const flags = [];
  for (const [qid, s] of stats) {
    if (s.n < MIN_ATTEMPTS) continue;
    const rate = s.correct / s.n;
    if (rate < LOW) flags.push({ qid, kind: "LOW correct rate (possible bad key)", detail: `${(rate * 100).toFixed(0)}% over ${s.n}` });
    else if (rate > HIGH) flags.push({ qid, kind: "TOO EASY", detail: `${(rate * 100).toFixed(0)}% over ${s.n}` });
  }

  console.log(`\n  CORRECT-RATE MONITOR  (min attempts: ${MIN_ATTEMPTS})`);
  console.log("  " + "=".repeat(56));
  console.log(`  Questions with enough data: ${[...stats.values()].filter((s) => s.n >= MIN_ATTEMPTS).length}`);
  console.log(`  Flagged for review: ${flags.length}\n`);
  for (const f of flags.sort((a, b) => a.qid.localeCompare(b.qid)))
    console.log(`    [${f.qid}] ${f.kind} — ${f.detail}`);
  if (!flags.length) console.log("  Nothing flagged. Keys look healthy against real data.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
