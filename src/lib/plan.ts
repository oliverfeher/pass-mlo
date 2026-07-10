// Exam-date math + a study pace tied to what's actually left to shore up.

const DAY = 86_400_000;

// Whole days from today to the exam (negative = past, 0 = today). Both args yyyy-mm-dd.
export function daysUntil(examISO: string, todayISO: string): number {
  return Math.round((Date.parse(examISO + "T00:00:00Z") - Date.parse(todayISO + "T00:00:00Z")) / DAY);
}

// Suggested questions/day. `notReadyRemaining` is the count of questions still
// needed across areas not yet at the bar; spread over the days left (capped so
// the number stays realistic even when the exam is imminent).
export function studyPace(daysLeft: number, notReadyRemaining: number): { dailyGoal: number; onTrack: boolean } {
  if (notReadyRemaining <= 0) return { dailyGoal: 0, onTrack: true };
  const days = Math.max(1, daysLeft);
  const dailyGoal = Math.min(60, Math.max(5, Math.ceil(notReadyRemaining / days)));
  return { dailyGoal, onTrack: false };
}
