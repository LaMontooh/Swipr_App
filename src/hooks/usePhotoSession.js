import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { readLocal, writeLocal } from '../lib/storage';
import { emptyLedger, decide, undoDecision, pendingDeletions } from '../lib/cleanup';
import { demoPhotos, getPhotoPage, photoDetails } from '../lib/media';
import { deleteReviewedPhotos } from '../lib/deletePhotos';

// This hook owns the device library. React screens only display its state and call actions.
export function usePhotoSession(uid, demo) {
  const [ledger, setLedger] = useState(emptyLedger),
    [assets, setAssets] = useState([]);
  const [permission, setPermission] = useState(null),
    [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [total, setTotal] = useState(0),
    [hasMore, setHasMore] = useState(false);
  const cursor = useRef(null),
    more = useRef(false),
    ledgerRef = useRef(emptyLedger());
  const fetching = useRef(false),
    locked = useRef(false),
    active = useRef(true),
    meta = useRef(new Map());
  const key = `cleanup:${uid}`;
  const commit = async (value) => {
    if (!demo) await writeLocal(key, value);
    ledgerRef.current = value;
    setLedger(value);
  };
  const fetchPage = useCallback(
    async (reset = false) => {
      if (fetching.current || demo || Platform.OS === 'web') return;
      if (!reset && !more.current) return;
      fetching.current = true;
      setLoading(true);
      try {
        let after = reset ? null : cursor.current,
          items = [];
        do {
          const page = await getPhotoPage(after);
          items.push(...page.assets.filter((x) => !ledgerRef.current.decisions[x.id]));
          cursor.current = page.endCursor;
          more.current = page.hasNextPage;
          if (active.current) {
            setTotal(page.totalCount);
            setHasMore(page.hasNextPage);
          }
          if (!page.hasNextPage || page.endCursor === after) break;
          after = page.endCursor;
        } while (more.current);

        // Shuffle the photos into a random order.
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }

        if (active.current)
          setAssets((prev) =>
            reset
              ? items
              : [...prev, ...items.filter((x) => !prev.some((p) => p.id === x.id))],
          );
      } catch {
        if (active.current)
          setError('Could not load your photos. Check photo access and try refreshing.');
      } finally {
        fetching.current = false;
        if (active.current) setLoading(false);
      }
    },
    [demo, uid],
  );
  useEffect(() => {
    active.current = true;
    (async () => {
      try {
        const saved = demo ? emptyLedger() : await readLocal(key, emptyLedger());
        if (
          !saved ||
          !saved.decisions ||
          Array.isArray(saved.decisions) ||
          typeof saved.decisions !== 'object' ||
          !Array.isArray(saved.deletions)
        )
          throw new Error('Saved cleanup history is unreadable.');
        if (!active.current) return;
        ledgerRef.current = saved;
        setLedger(saved);
        setReady(true);
        if (demo) {
          setAssets(demoPhotos);
          setTotal(demoPhotos.length);
          return;
        }
        if (Platform.OS === 'web') return;
        const p = await MediaLibrary.getPermissionsAsync(false, ['photo']);
        if (!active.current) return;
        setPermission(p);
        if (p.granted || p.accessPrivileges === 'limited') await fetchPage(true);
      } catch (e) {
        if (active.current) setError(e.message || 'Could not load your saved progress.');
      }
    })();
    return () => {
      active.current = false;
    };
  }, [uid, demo]);
  useEffect(() => {
    if (demo || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || !active.current || locked.current) return;
      try {
        const p = await MediaLibrary.getPermissionsAsync(false, ['photo']);
        setPermission(p);
        if (p.granted || p.accessPrivileges === 'limited') fetchPage(true);
        else setAssets([]);
      } catch {
        setError('Unable to check photo access. Try refreshing.');
      }
    });
    const listener = MediaLibrary.addListener((event) => {
      if (!locked.current && !event.hasIncrementalChanges) fetchPage(true);
    });
    return () => {
      sub.remove();
      listener.remove();
    };
  }, [fetchPage, demo]);
  const queue = assets.filter((x) => !ledger.decisions[x.id]);
  const current = queue[0];
  useEffect(() => {
    if (
      !ready ||
      demo ||
      loading ||
      !(permission?.granted || permission?.accessPrivileges === 'limited')
    )
      return;
    if (queue.length < 5 && more.current) fetchPage();
  }, [queue.length, ready, loading, permission, demo, fetchPage]);
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    const first = queue.slice(0, 2);
    Promise.all(
      first
        .filter((x) => !meta.current.has(x.id))
        .map(async (x) => {
          const info = await photoDetails(x);
          meta.current.set(x.id, info);
          if (!cancelled && active.current)
            setAssets((prev) =>
              prev.map((p) => (p.id === x.id ? { ...info, resolved: true } : p)),
            );
        }),
    );
    // Also hydrate previously cached results if a page was refreshed.
    setAssets((prev) => {
      let changed = false;
      const result = prev.map((p) => {
        const cached = meta.current.get(p.id);
        if (!p.resolved && cached) {
          changed = true;
          return { ...cached, resolved: true };
        }
        return p;
      });
      return changed ? result : prev;
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id, queue[1]?.id, demo, assets.length]);
  async function requestAccess() {
    setError('');
    try {
      const p = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      setPermission(p);
      if (p.granted || p.accessPrivileges === 'limited') await fetchPage(true);
    } catch {
      setError(
        'Photo access could not be requested. Open your phone’s settings to allow access.',
      );
    }
  }
  // Save a swipe before removing the card from the screen. It does not delete a file.
  async function swipe(asset, direction) {
    if (locked.current || !asset || !ready || ledgerRef.current.decisions[asset.id])
      return false;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await commit(decide(ledgerRef.current, asset, direction));
      return true;
    } catch {
      setError(
        'Could not save this decision. The photo is still here; please try again.',
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function restore(id) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    const item = ledgerRef.current.decisions[id];
    try {
      await commit(undoDecision(ledgerRef.current, id));
      if (item && item.direction !== 'deleted')
        setAssets((prev) => [
          { ...item, resolved: true },
          ...prev.filter((p) => p.id !== id),
        ]);
    } catch {
      setError('Could not save your undo. Please try again.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  // This is the only place that requests a real operating-system deletion.
  async function deletePending() {
    if (demo) {
      setError('This is a demo. No photos or storage are deleted.');
      return false;
    }
    if (locked.current) return false;
    const items = pendingDeletions(ledgerRef.current);
    if (!items.length) return false;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await deleteReviewedPhotos(ledgerRef.current, {
        resolvePhoto: async (id) => {
          const raw = await MediaLibrary.getAssetInfoAsync(id, {
            shouldDownloadFromNetwork: false,
          });
          return photoDetails(raw);
        },
        saveMeasured: commit,
        deleteAssets: (ids) => MediaLibrary.deleteAssetsAsync(ids),
      });
      if (!result.confirmed) {
        setError('Deletion was cancelled. Your review tray is unchanged.');
        return false;
      }
      const next = result.ledger;
      ledgerRef.current = next;
      setLedger(next); // Never undo a confirmed OS deletion.
      try {
        await writeLocal(key, next);
      } catch {
        setError(
          'Photos were deleted, but progress could not be saved. Keep the app open and tap Refresh to retry.',
        );
      }
      cursor.current = null;
      more.current = true;
      await fetchPage(true);
      return true;
    } catch {
      setError(
        'Deletion was not confirmed. Check photo access, refresh, and review the tray again.',
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    if (busy) return;
    if (!ready) {
      setError(
        'Saved cleanup history could not be loaded. Restart the app before continuing; your saved history has not been overwritten.',
      );
      return;
    }
    setError('');
    try {
      if (!demo) await writeLocal(key, ledgerRef.current);
      if (demo) return;
      const p = await MediaLibrary.getPermissionsAsync(false, ['photo']);
      setPermission(p);
      if (p.granted || p.accessPrivileges === 'limited') await fetchPage(true);
      else setAssets([]);
    } catch {
      setError('Could not refresh. Check photo permissions and try again.');
    }
  }
  return {
    ledger,
    queue,
    current,
    permission,
    ready,
    loading,
    busy,
    error,
    total,
    hasMore,
    requestAccess,
    swipe,
    restore,
    deletePending,
    refresh,
    undo: () => {
      const latest = Object.values(ledgerRef.current.decisions)
        .filter((x) => x.direction !== 'deleted')
        .sort((a, b) => b.at - a.at)[0];
      if (latest) restore(latest.id);
    },
  };
}
