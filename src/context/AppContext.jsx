import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../Firebase/firebase';
import { readLocal, writeLocal } from '../lib/storage';
const light = {
  bg: '#F8F6F2',
  surface: '#FFFFFF',
  ink: '#25233F',
  muted: '#777489',
  line: '#E7E3EB',
  soft: '#EFEDF6',
  accent: '#DA4167',
  accentSoft: '#FBEAF0',
  purple: '#6251A2',
  green: '#3A806B',
  greenSoft: '#E6F3EC',
  card: '#E9E7F0',
  dark: false,
};
const dark = {
  bg: '#181722',
  surface: '#242232',
  ink: '#F6F2FA',
  muted: '#ABA6BC',
  line: '#393548',
  soft: '#302C44',
  accent: '#F57A99',
  accentSoft: '#442C3A',
  purple: '#B3A0F1',
  green: '#8FD5B7',
  greenSoft: '#253E36',
  card: '#302C44',
  dark: true,
};
const Context = createContext(null);
async function cloudWrite(operation) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                'Account sync timed out. Check your connection and Firebase rules, then retry.',
              ),
            ),
          12000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export function AppProvider({ children }) {
  const system = useColorScheme();
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null),
    [themeMode, setThemeMode] = useState('system');
  const [syncError, setSyncError] = useState(''),
    [demo, setDemo] = useState(false);
  const generation = useRef(0),
    profileRevision = useRef(0),
    themeRevision = useRef(0);
  // Firebase restores the session first. Local profile data keeps home usable offline.
  useEffect(
    () =>
      onAuthStateChanged(auth, async (next) => {
        const token = ++generation.current;
        setReady(false);
        setProfile(null);
        setUser(next);
        setSyncError('');
        try {
          const mode = await readLocal('theme', 'system');
          if (token !== generation.current) return;
          setThemeMode(mode);
          if (next) {
            const cached = await readLocal(`profile:${next.uid}`, null);
            if (token !== generation.current) return;
            setProfile(
              cached || {
                username: next.displayName || 'Photo lover',
                photoData: next.photoURL || null,
              },
            );
          }
        } catch {
          if (token === generation.current)
            setSyncError('Could not load saved preferences.');
        }
        if (token === generation.current) setReady(true);
        if (!next) return;
        try {
          const revision = profileRevision.current;
          const appearanceRevision = themeRevision.current;
          const snapshot = await getDoc(doc(db, 'users', next.uid));
          if (token !== generation.current || revision !== profileRevision.current)
            return;
          if (snapshot.exists()) {
            const data = snapshot.data();
            const value = {
              username: data.username || next.displayName || 'Photo lover',
              photoData: data.photoData || next.photoURL || null,
            };
            setProfile(value);
            if (data.themeMode && appearanceRevision === themeRevision.current) {
              setThemeMode(data.themeMode);
              await writeLocal('theme', data.themeMode);
            }
            await writeLocal(`profile:${next.uid}`, value);
          }
        } catch {
          if (token === generation.current)
            setSyncError(
              'Cloud profile unavailable. Check your connection and Firebase rules.',
            );
        }
      }),
    [],
  );
  // The small, compressed avatar is stored in this user’s private Firestore document.
  async function saveProfile({ username, photoData }) {
    const account = auth.currentUser;
    if (!account) throw new Error('Please sign in to save your profile.');
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username))
      throw new Error('Use 3–15 letters, numbers, or underscores for your username.');
    const value = { username, photoData: photoData || null };
    profileRevision.current++;
    await updateProfile(account, { displayName: username });
    await writeLocal(`profile:${account.uid}`, value);
    setProfile(value);
    try {
      await cloudWrite(setDoc(doc(db, 'users', account.uid), value, { merge: true }));
      setSyncError('');
    } catch {
      const message =
        'Profile saved on this device. Account sync did not finish; check your connection and Firebase rules, then save again.';
      setSyncError(message);
      throw new Error(message);
    }
  }
  async function setAppearance(mode) {
    themeRevision.current++;
    setThemeMode(mode);
    try {
      await writeLocal('theme', mode);
      if (user)
        await cloudWrite(
          setDoc(doc(db, 'users', user.uid), { themeMode: mode }, { merge: true }),
        );
      setSyncError('');
    } catch {
      setSyncError('Appearance changed here, but could not sync to your account.');
    }
  }
  const theme =
    themeMode === 'dark' || (themeMode === 'system' && system === 'dark') ? dark : light;
  return (
    <Context.Provider
      value={{
        user,
        ready,
        profile,
        theme,
        themeMode,
        setAppearance,
        saveProfile,
        syncError,
        demo,
        setDemo,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
