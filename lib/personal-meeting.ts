import { createHash } from "node:crypto";

export const meetingTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export function validateMeeting(value: Record<string, unknown>, now = Date.now()) {
  const name = String(value.name || "").trim().slice(0, 80);
  const email = String(value.email || "").trim().toLowerCase();
  const topic = String(value.topic || "").trim().slice(0, 1200);
  const location = String(value.location || "").trim().slice(0, 240);
  const mode = value.mode;
  const duration = Number(value.duration);
  const timezone = String(value.timezone || "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !topic) throw new Error("Add your name, email and what you’d like to talk about.");
  if (!["call", "in-person"].includes(String(mode)) || ![15, 30, 60].includes(duration)) throw new Error("Choose a conversation format and duration.");
  if (mode === "in-person" && !location) throw new Error("Suggest an area where you’d like to meet.");
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); } catch { throw new Error("Choose a valid timezone."); }
  const slots = Array.isArray(value.slots) ? [...new Set(value.slots)] : [];
  if (!slots.length || slots.length > 5 || slots.some(slot => typeof slot !== "string" || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(slot) || !Number.isFinite(Date.parse(slot)) || Date.parse(slot) <= now || Date.parse(slot) > now + 90 * 86400000)) throw new Error("Suggest one to five future times within the next 90 days.");
  return { name, email, topic, location: mode === "in-person" ? location : "", mode: mode as "call" | "in-person", duration, timezone, slots: slots as string[] };
}
