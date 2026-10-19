import { confirmDeletion, pendingDeletions } from './cleanup.js';

// Dependencies are passed in so the important deletion sequence can be tested
// without touching anyone's real photo library.
export async function deleteReviewedPhotos(
  ledger,
  { resolvePhoto, saveMeasured, deleteAssets, now = Date.now },
) {
  const items = pendingDeletions(ledger);
  if (!items.length) return { confirmed: false, ledger };

  // A missing photo or an unreadable library stops the entire request safely.
  const details = await Promise.all(
    items.map(async (item) => {
      const info = await resolvePhoto(item.id);
      return { ...item, size: info.size ?? null };
    }),
  );
  const measured = { ...ledger, decisions: { ...ledger.decisions } };
  for (const item of details) measured.decisions[item.id] = item;

  // Persist before the OS prompt. A failed save must never trigger deletion.
  await saveMeasured(measured);
  const confirmed = await deleteAssets(items.map((item) => item.id));
  if (!confirmed) return { confirmed: false, ledger: measured };

  // Counters change only after the phone confirms success.
  return {
    confirmed: true,
    ledger: confirmDeletion(
      measured,
      items.map((item) => item.id),
      now(),
    ),
  };
}
