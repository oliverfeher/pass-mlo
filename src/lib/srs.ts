import type { ProgressItem } from "./progress";

// Spaced repetition derived from attempt history — no separate table. Each
// question's "box" is its run of consecutive correct answers (most recent
// first); the box maps to a review interval. A miss drops it to box 0 (due
// now); each subsequent correct answer pushes the next review further out.
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
const DAY = 86_400_000;

export type SrsCard = { questionId: string; box: number; lastTS: number; dueTS: number };

export function srsCards(items: ProgressItem[]): SrsCard[] {
  const byQ = new Map<string, ProgressItem[]>();
  for (const it of items) {
    const arr = byQ.get(it.question_id) ?? byQ.set(it.question_id, []).get(it.question_id)!;
    arr.push(it);
  }
  const cards: SrsCard[] = [];
  for (const [questionId, attempts] of byQ) {
    attempts.sort((a, b) => (a.answered_at < b.answered_at ? -1 : a.answered_at > b.answered_at ? 1 : 0));
    let box = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].is_correct) box += 1;
      else break;
    }
    box = Math.min(box, INTERVAL_DAYS.length - 1);
    const lastTS = Date.parse(attempts[attempts.length - 1].answered_at);
    cards.push({ questionId, box, lastTS, dueTS: lastTS + INTERVAL_DAYS[box] * DAY });
  }
  return cards;
}

// Cards due for review at `nowTS`, most overdue first.
export function dueCards(items: ProgressItem[], nowTS: number): SrsCard[] {
  return srsCards(items)
    .filter((c) => c.dueTS <= nowTS)
    .sort((a, b) => a.dueTS - b.dueTS);
}

export function dueQuestionIds(items: ProgressItem[], nowTS: number): string[] {
  return dueCards(items, nowTS).map((c) => c.questionId);
}
