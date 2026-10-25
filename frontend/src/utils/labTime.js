import { useEffect, useState } from "react";

/** Milliseconds until an ISO deadline (negative once it has passed); null when there is no deadline. */
export function msUntil(deadline, now = Date.now()) {
  if (!deadline) return null;
  const t = new Date(deadline).getTime();
  return Number.isNaN(t) ? null : t - now;
}

/** "5h 12m left", "12m left", "under 1m left" — or "Time up" once the deadline has passed. */
export function formatTimeLeft(ms) {
  if (ms === null || ms === undefined) return "";
  if (ms <= 0) return "Time up";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return "under 1m left";
}

/** Re-renders every `intervalMs` and returns the milliseconds left until `deadline` (null if none). */
export function useTimeLeft(deadline, intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [deadline, intervalMs]);
  return msUntil(deadline, now);
}
