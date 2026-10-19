import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyLedger,
  decide,
  dailyStats,
  localDay,
  pendingDeletions,
} from '../src/lib/cleanup.js';
import { deleteReviewedPhotos } from '../src/lib/deletePhotos.js';
const at = new Date(2026, 9, 14, 12).getTime();
const queued = () =>
  decide(emptyLedger(), { id: 'photo', uri: 'file://photo.jpg', size: 12 }, 'left', at);

test('cancelling the OS prompt leaves the queue and counters intact', async () => {
  const calls = [];
  const result = await deleteReviewedPhotos(queued(), {
    resolvePhoto: async () => ({ size: 3000 }),
    saveMeasured: async (value) => {
      calls.push('save');
      assert.equal(value.decisions.photo.size, 3000);
    },
    deleteAssets: async (ids) => {
      calls.push('delete');
      assert.deepEqual(ids, ['photo']);
      return false;
    },
    now: () => at,
  });
  assert.deepEqual(calls, ['save', 'delete']);
  assert.equal(result.confirmed, false);
  assert.equal(pendingDeletions(result.ledger).length, 1);
  assert.equal(dailyStats(result.ledger, localDay(at)).bytes, 0);
});
test('success uses the freshly measured size and marks the photo deleted', async () => {
  const result = await deleteReviewedPhotos(queued(), {
    resolvePhoto: async () => ({ size: 3000 }),
    saveMeasured: async () => {},
    deleteAssets: async () => true,
    now: () => at,
  });
  assert.equal(result.confirmed, true);
  assert.equal(dailyStats(result.ledger, localDay(at)).bytes, 3000);
  assert.equal(pendingDeletions(result.ledger).length, 0);
});
test('a failed local save prevents OS deletion', async () => {
  let deleted = false;
  await assert.rejects(
    deleteReviewedPhotos(queued(), {
      resolvePhoto: async () => ({ size: 3000 }),
      saveMeasured: async () => {
        throw new Error('disk full');
      },
      deleteAssets: async () => {
        deleted = true;
        return true;
      },
    }),
  );
  assert.equal(deleted, false);
});
test('a missing photo stops the request before saving or deleting', async () => {
  let saved = false,
    deleted = false;
  await assert.rejects(
    deleteReviewedPhotos(queued(), {
      resolvePhoto: async () => {
        throw new Error('missing photo');
      },
      saveMeasured: async () => {
        saved = true;
      },
      deleteAssets: async () => {
        deleted = true;
        return true;
      },
    }),
  );
  assert.equal(saved, false);
  assert.equal(deleted, false);
});
test('an empty queue never requests OS deletion', async () => {
  let deleted = false;
  const result = await deleteReviewedPhotos(emptyLedger(), {
    deleteAssets: async () => {
      deleted = true;
      return true;
    },
  });
  assert.equal(deleted, false);
  assert.equal(result.confirmed, false);
});
