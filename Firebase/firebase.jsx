// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB1ltaIsDsXeRngXnGWIX9deLZd5bs3dS4',
  authDomain: 'swipr-cc934.firebaseapp.com',
  projectId: 'swipr-cc934',
  storageBucket: 'swipr-cc934.firebasestorage.app',
  messagingSenderId: '360751608949',
  appId: '1:360751608949:web:9deaa2254ee725d822b43c',
  measurementId: 'G-Q3EM4L2Q7D',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let auth;
try {
  auth =
    Platform.OS === 'web'
      ? getAuth(app)
      : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (error) {
  if (error.code !== 'auth/already-initialized') throw error;
  auth = getAuth(app);
}
const db = getFirestore(app);

export { auth, db };
