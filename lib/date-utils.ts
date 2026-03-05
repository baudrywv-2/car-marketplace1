export function formatListedDate(createdAt: string | null | undefined, t: (k: string) => string): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return t("listedToday");
  if (diffDays === 1) return t("listedYesterday");
  return t("listedDaysAgo").replace("{n}", String(diffDays));
}
