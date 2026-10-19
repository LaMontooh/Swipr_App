import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Small settings use AsyncStorage. Native cleanup history uses files so a large
// camera roll does not hit Android's per-entry AsyncStorage size limit.
const storageKey = (key) => `swipr:${key}`;
const isNativeLedger = (key) => key.startsWith('cleanup:') && Platform.OS !== 'web';
const ledgerDirectory = () => `${FileSystem.documentDirectory}swipr-history/`;

export async function readLocal(key, fallback) {
  const raw = await AsyncStorage.getItem(storageKey(key));
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    if (isNativeLedger(key) && value.ledgerFile) {
      const contents = await FileSystem.readAsStringAsync(
        `${ledgerDirectory()}${value.ledgerFile}`,
      );
      return JSON.parse(contents);
    }
    return value;
  } catch {
    throw new Error('Saved data could not be read. Restart the app before continuing.');
  }
}

export async function writeLocal(key, value) {
  if (!isNativeLedger(key)) {
    return AsyncStorage.setItem(storageKey(key), JSON.stringify(value));
  }
  const directory = ledgerDirectory();
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const previous = await AsyncStorage.getItem(storageKey(key));
  const filename = `${encodeURIComponent(key)}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const uri = `${directory}${filename}`;
  // Write a new snapshot first. Only switch the pointer after the write succeeds.
  // If the app closes mid-write, the previous complete snapshot remains readable.
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(value));
  try {
    await AsyncStorage.setItem(storageKey(key), JSON.stringify({ ledgerFile: filename }));
  } catch (error) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    throw error;
  }
  try {
    const old = previous ? JSON.parse(previous) : null;
    if (old?.ledgerFile)
      await FileSystem.deleteAsync(`${directory}${old.ledgerFile}`, { idempotent: true });
  } catch {
    /* Old snapshots are harmless; the current pointer is already saved. */
  }
}
