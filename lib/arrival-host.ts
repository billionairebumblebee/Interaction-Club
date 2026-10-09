import { createHash, timingSafeEqual } from "node:crypto";
import { getTable, readJson, type TableRecord } from "./concierge";
export type ArrivalPlan = { hostName: string; landmark: string; updatedAt: string };
export async function getArrivalPlan(table: TableRecord): Promise<ArrivalPlan> {
  return await readJson<ArrivalPlan>(`arrival-plans/${table.id}.json`) || { hostName: table.hostName || "Assigned host to be confirmed", landmark: "Look for the small pink Interaction Club sign. Exact table position has not been posted yet.", updatedAt: table.createdAt };
}
export async function requireArrivalHost(request: Request, tableId: string) {
  const key = request.headers.get("x-interaction-host-key");
  if (!key || !/^[a-f0-9]{64}$/.test(key)) return false;
  const saved = await readJson<{ keyHash: string; hostName: string }>(`arrival-host-access/${tableId}.json`);
  const table = await getTable(tableId);
  if (!saved || !/^[a-f0-9]{64}$/.test(saved.keyHash) || !table || saved.hostName !== table.hostName || table.status !== "invited") return false;
  return timingSafeEqual(Buffer.from(saved.keyHash, "hex"), createHash("sha256").update(key).digest());
}
