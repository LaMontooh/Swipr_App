// Pure cleanup ledger: swipes are decisions, successful OS deletions are events.
export const emptyLedger = () => ({ decisions: {}, deletions: [] });
export const localDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function decide(ledger, asset, direction, now = Date.now()) {
  if (!asset || ledger.decisions[asset.id]) return ledger;
  return {
    ...ledger,
    decisions: {
      ...ledger.decisions,
      [asset.id]: {
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime || null,
        width: asset.width || null,
        height: asset.height || null,
        size: asset.size ?? null,
        direction,
        at: now,
      },
    },
  };
}
export function undoDecision(ledger, id) {
  if (ledger.decisions[id]?.direction === 'deleted') return ledger;
  const decisions = { ...ledger.decisions };
  delete decisions[id];
  return { ...ledger, decisions };
}
export function confirmDeletion(ledger, ids, now = Date.now()) {
  const decisions = { ...ledger.decisions };
  const events = [];
  for (const id of new Set(ids)) {
    const item = decisions[id];
    if (!item || item.direction !== 'left') continue;
    events.push({ id, size: item.size, at: now });
    decisions[id] = { ...item, direction: 'deleted' };
  }
  return { decisions, deletions: [...ledger.deletions, ...events] };
}
export const pendingDeletions = (ledger) =>
  Object.values(ledger.decisions).filter((x) => x.direction === 'left');
export function dailyStats(ledger, today = localDay()) {
  const decisions = Object.values(ledger.decisions).filter(
    (x) => localDay(x.at) === today,
  );
  const deleted = ledger.deletions.filter((x) => localDay(x.at) === today);
  return {
    reviewed: decisions.length,
    kept: decisions.filter((x) => x.direction === 'right').length,
    deleted: deleted.length,
    bytes: deleted.reduce((n, x) => n + (x.size ?? 0), 0),
    unknown: deleted.filter((x) => x.size == null).length,
  };
}
export function formatBytes(bytes) {
  if (bytes == null) return 'Size unavailable';
  if (bytes < 1000) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let n = bytes / 1000,
    unit = 0;
  while (n >= 1000 && unit < units.length - 1) {
    n /= 1000;
    unit++;
  }
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[unit]}`;
}
