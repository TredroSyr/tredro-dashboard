const ARABIC_MONTHS: Record<number, string> = {
  0: "كانون الثاني",
  1: "شباط",
  2: "اذار",
  3: "نيسان",
  4: "ايار",
  5: "حزيران",
  6: "تموز",
  7: "اب",
  8: "ايلول",
  9: "تشرين الأول",
  10: "تشرين الثاني",
  11: "كانون الأول",
};

export function formatQuantity(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

function padZero(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  const day = date.getDate();
  const month = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  const day = date.getDate();
  const month = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  return `${day} ${month} ${year} · ${hours}:${minutes}`;
}

export function formatDateNumeric(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function calculateRemainingTime(deadline: string | null | undefined): string {
  if (!deadline) return "—";

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "انتهى الوقت";
  }

  const diffHours = diffMs / (1000 * 60 * 60);
  const diffMinutes = diffMs / (1000 * 60);

  if (diffHours >= 1) {
    const hours = Math.floor(diffHours);
    const minutes = Math.floor((diffMinutes % 60));
    if (minutes > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${hours} ساعة`;
  } else {
    const minutes = Math.floor(diffMinutes);
    return `${minutes} دقيقة`;
  }
}
