import { createHash, randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { getTable, listApplications, listTables, readJson, readPrefix, type TableRecord, writeRecord } from "./concierge";

const SESSION_MS = 2 * 60 * 60 * 1000;
export const DINNER_COOKIE = "interaction_dinner_session";
export function canonicalDinnerId(value: string) {
  const match = /^dinner-?(\d{1,6})$/i.exec(value);
  const number = match ? Number(match[1]) : 0;
  return number > 0 ? `dinner-${String(number).padStart(3, "0")}` : null;
}
export function normalizeGuestName(value: unknown) {
  if (typeof value !== "string" || value.length > 80) return "";
  return value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").trim().toLocaleLowerCase("en-US");
}
// Optional private bootstrap configuration is never committed to this repo.
function firstDinnerConfig(): { guests: string[]; table: Omit<TableRecord, "members"> } | null {
  try {
    const config = JSON.parse(process.env.INTERACTION_FIRST_DINNER_JSON || "null");
    if (!config || !Array.isArray(config.guests) || !config.table || config.table.id !== "dinner-001") return null;
    const guests = config.guests.map(normalizeGuestName).filter(Boolean);
    if (!guests.length || new Set(guests).size !== guests.length) return null;
    return { guests, table: config.table };
  } catch { return null; }
}
type Session = { dinnerId: string; tableId: string; applicationId: string; guestName: string; expiresAt: number };
export async function findDinnerForName(dinnerId: string) {
  const tables = await listTables();
  const numbered = tables.filter(table => canonicalDinnerId((table as TableRecord & { dinnerId?: string }).dinnerId || table.id) === dinnerId);
  if (numbered.length === 1) return numbered[0];
  if (numbered.length > 1 || dinnerId !== "dinner-001") return null;
  const config = firstDinnerConfig();
  if (!config) return null;
  // Seed only if the privately configured names all correspond to
  // unique saved profiles; never create a guest based on an arbitrary entry.
  const applications = await listApplications();
  const people = config.guests.map(name => {
    const matches = applications.filter(person => normalizeGuestName(person.fullName.trim().split(/\s+/)[0]) === name);
    // Repeat test submissions from one email are one person, not extra seats.
    const emails = new Set(matches.map(person => person.email.trim().toLowerCase()));
    return emails.size === 1 ? matches.slice(0, 1) : matches;
  });
  if (people.some(matches => matches.length !== 1)) return null;
  const table: TableRecord = { ...config.table, createdAt: new Date().toISOString(), members: people.map(([person]) => ({applicationId:person.id,token:randomBytes(32).toString("hex"),rsvp:"pending",attendance:"unknown"})) };
  try { await put("tables/dinner-001.json", JSON.stringify(table), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" }); return table; }
  catch { return getTable("dinner-001"); }
}
export async function createDinnerSession(dinnerId: string, input: unknown) {
  const name = normalizeGuestName(input);
  if (!name) return null;
  // Reject an unknown name before initializing the first event.
  // Existing private records remain usable even without bootstrap config.
  const bootstrap = firstDinnerConfig();
  if (dinnerId === "dinner-001" && bootstrap && !bootstrap.guests.includes(name)) return null;
  const table = await findDinnerForName(dinnerId);
  if (!table || table.status === "draft") return null;
  const applications = await listApplications();
  const matches = table.members.filter(member => {
    const person = applications.find(person => person.id === member.applicationId);
    return person && normalizeGuestName(person.fullName.trim().split(/\s+/)[0]) === name;
  });
  if (matches.length !== 1) return null;
  const sessionToken = randomBytes(32).toString("hex");
  const session: Session = { dinnerId, tableId: table.id, applicationId: matches[0].applicationId, guestName: String(input).trim().slice(0,80), expiresAt: Date.now() + SESSION_MS };
  await writeRecord(`dinner-sessions/${sessionToken}.json`,session);
  return { sessionToken, session, table };
}
export async function readDinnerSession(dinnerId: string, request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map(part=>part.trim()).find(part=>part.startsWith(`${DINNER_COOKIE}=`))?.slice(DINNER_COOKIE.length+1);
  if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) return null;
  const session = await readJson<Session>(`dinner-sessions/${cookie}.json`);
  if (!session || session.dinnerId !== dinnerId || session.expiresAt <= Date.now()) return null;
  const table = await getTable(session.tableId);
  const member = table?.members.find(member=>member.applicationId===session.applicationId);
  return table && table.status !== "draft" && member ? { session, table, member } : null;
}
export async function permitNameAttempt(dinnerId: string, request: Request) {
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const hash = createHash("sha256").update(ip).digest("hex");
  const prefix = `dinner-name-attempts/${dinnerId}/${hash}/`;
  const attempts = await readPrefix<{at:number}>(prefix);
  if (attempts.filter(item=>item.at > Date.now()-15*60*1000).length >= 10) return false;
  await writeRecord(`${prefix}${randomBytes(12).toString("hex")}.json`,{at:Date.now()});
  return true;
}
