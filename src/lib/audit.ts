// Audit helpers (currently only diff utilities are used).

export type Audit = {
  id: string; // canonical audit_id (e.g., AUD-0001)
  name: string;
  location?: string;
  createdBy?: string;
  comparedAuditId?: string | null;
  timestamp: string; // ISO
  itemCount?: number;
};

export type AuditItem = {
  id: number;
  auditId: string;
  serialNumber: string;
  assetId?: string;
  found: boolean;
  statusSnapshot?: string;
  notes?: string;
};

export type AuditDiff = {
  added: string[];
  removed: string[];
  statusChanged: { serialNumber: string; from: string; to: string }[];
};

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers) },
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function fetchAuditDiff(
  currentAuditId: string,
  previousAuditId: string
): Promise<AuditDiff> {
  return http(
    `/api/assets/audits/${encodeURIComponent(
      currentAuditId
    )}/diff?previous=${encodeURIComponent(previousAuditId)}`
  );
}

export function computeAuditDiff(prev: AuditItem[], curr: AuditItem[]): AuditDiff {
  const prevMap = new Map<string, AuditItem>();
  for (const p of prev) prevMap.set(p.serialNumber, p);
  const currMap = new Map<string, AuditItem>();
  for (const c of curr) currMap.set(c.serialNumber, c);

  const added: string[] = [];
  const removed: string[] = [];
  const statusChanged: { serialNumber: string; from: string; to: string }[] = [];

  for (const [sn] of currMap) if (!prevMap.has(sn)) added.push(sn);
  for (const [sn] of prevMap) if (!currMap.has(sn)) removed.push(sn);

  for (const [sn, item] of currMap) {
    const prevItem = prevMap.get(sn);
    if (
      prevItem?.statusSnapshot &&
      item.statusSnapshot &&
      prevItem.statusSnapshot !== item.statusSnapshot
    ) {
      statusChanged.push({
        serialNumber: sn,
        from: prevItem.statusSnapshot,
        to: item.statusSnapshot,
      });
    }
  }

  return { added, removed, statusChanged };
}
