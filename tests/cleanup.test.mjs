import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyLedger,
  localDay,
  decide,
  undoDecision,
  confirmDeletion,
  pendingDeletions,
  dailyStats,
  formatBytes,
} from '../src/lib/cleanup.js';
const photo = {
  id: 'one',
  uri: 'file://photo.jpg',
  filename: 'photo.jpg',
  size: 2500000,
};
const noon = new Date(2026, 9, 14, 12).getTime();
test('a left swipe is queued and never counts as deleted bytes', () => {
  const ledger = decide(emptyLedger(), photo, 'left', noon);
  assert.equal(pendingDeletions(ledger).length, 1);
  assert.deepEqual(dailyStats(ledger, localDay(noon)), {
    reviewed: 1,
    kept: 0,
    deleted: 0,
    bytes: 0,
    unknown: 0,
  });
});
test('only confirmed queued deletions count, with no double counting', () => {
  let ledger = decide(emptyLedger(), photo, 'left', noon);
  ledger = decide(ledger, { ...photo, id: 'two', size: null }, 'left', noon);
  ledger = decide(ledger, { ...photo, id: 'keep' }, 'right', noon);
  ledger = confirmDeletion(ledger, ['one', 'one', 'two', 'keep', 'missing'], noon);
  const again = confirmDeletion(ledger, ['one', 'two'], noon);
  assert.deepEqual(dailyStats(again, localDay(noon)), {
    reviewed: 3,
    kept: 1,
    deleted: 2,
    bytes: 2500000,
    unknown: 1,
  });
  assert.equal(pendingDeletions(again).length, 0);
});
test('undo restores the decision and daily progress, but cannot restore an OS deletion', () => {
  const queued = decide(emptyLedger(), photo, 'left', noon);
  assert.deepEqual(undoDecision(queued, 'one'), emptyLedger());
  const deleted = confirmDeletion(queued, ['one'], noon);
  assert.deepEqual(undoDecision(deleted, 'one'), deleted);
});
test('a second swipe on the same asset is ignored', () => {
  const first = decide(emptyLedger(), photo, 'right', noon);
  assert.strictEqual(decide(first, photo, 'left', noon), first);
  assert.equal(dailyStats(first, localDay(noon)).reviewed, 1);
});
test('review and deletion belong to the local day when each happened', () => {
  const nextNoon = new Date(2026, 9, 15, 12).getTime();
  const ledger = confirmDeletion(
    decide(emptyLedger(), photo, 'left', noon),
    ['one'],
    nextNoon,
  );
  assert.equal(dailyStats(ledger, localDay(noon)).bytes, 0);
  assert.equal(dailyStats(ledger, localDay(nextNoon)).reviewed, 0);
  assert.equal(dailyStats(ledger, localDay(nextNoon)).bytes, 2500000);
  assert.equal(localDay(new Date(2026, 9, 14, 23, 59).getTime()), '2026-10-14');
  assert.equal(localDay(new Date(2026, 9, 15, 0, 1).getTime()), '2026-10-15');
});
test('unknown sizes stay unknown and format does not invent storage', () => {
  assert.equal(formatBytes(null), 'Size unavailable');
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(2500000), '2.5 MB');
  assert.equal(formatBytes(1200000000), '1.2 GB');
});
