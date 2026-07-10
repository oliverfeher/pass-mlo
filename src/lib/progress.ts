import type { SupabaseClient } from "@supabase/supabase-js";

// Durable, cross-session progress derived from session_items. Diagnostic runs
// don't persist, so this reflects real (entitled) practice + exam history only.

export type ProgressItem = {
  question_id: string;
  is_correct: boolean | null;
  answered_at: string;
  content_area: string;
  type: string | null;         // recall | application-scenario | calculation
  difficulty: string | null;   // easy | medium | hard
};

export type Progress = {
  byArea: Record<string, { correct: number; total: number }>;
  totalAnswered: number;
  totalCorrect: number;
  answeredDates: string[]; // distinct yyyy-mm-dd (UTC)
  items: ProgressItem[];
};

export async function fetchProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<Progress> {
  const { data } = await supabase
    .from("session_items")
    .select("question_id, is_correct, answered_at, questions(content_area, type, difficulty)")
    .eq("user_id", userId);

  const items: ProgressItem[] = (data ?? []).map((r: any) => ({
    question_id: r.question_id,
    is_correct: r.is_correct,
    answered_at: r.answered_at,
    content_area: r.questions?.content_area ?? "Unknown",
    type: r.questions?.type ?? null,
    difficulty: r.questions?.difficulty ?? null,
  }));

  const byArea: Record<string, { correct: number; total: number }> = {};
  const dates = new Set<string>();
  let totalCorrect = 0;
  for (const it of items) {
    const cur = (byArea[it.content_area] ??= { correct: 0, total: 0 });
    cur.total += 1;
    if (it.is_correct) {
      cur.correct += 1;
      totalCorrect += 1;
    }
    dates.add(it.answered_at.slice(0, 10));
  }

  return {
    byArea,
    totalAnswered: items.length,
    totalCorrect,
    answeredDates: [...dates],
    items,
  };
}

// Questions whose MOST RECENT attempt was wrong — the review queue. Getting one
// right on a later attempt drops it out, so the queue shrinks as you improve.
export function missedIds(items: ProgressItem[]): string[] {
  const last = new Map<string, { t: string; ok: boolean }>();
  for (const it of items) {
    const prev = last.get(it.question_id);
    if (!prev || it.answered_at > prev.t) {
      last.set(it.question_id, { t: it.answered_at, ok: !!it.is_correct });
    }
  }
  return [...last.entries()].filter(([, v]) => !v.ok).map(([id]) => id);
}

// Consecutive-day streak ending today (or yesterday, so a not-yet-practiced
// today doesn't zero a live streak). `todayISO` is yyyy-mm-dd, passed in so this
// stays pure/testable.
export function currentStreak(dates: string[], todayISO: string): number {
  const set = new Set(dates);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const DAY = 86_400_000;
  let cursor = new Date(todayISO + "T00:00:00Z");
  if (!set.has(iso(cursor))) {
    cursor = new Date(cursor.getTime() - DAY);
    if (!set.has(iso(cursor))) return 0;
  }
  let n = 0;
  while (set.has(iso(cursor))) {
    n += 1;
    cursor = new Date(cursor.getTime() - DAY);
  }
  return n;
}
