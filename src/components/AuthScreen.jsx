// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../Firebase/firebase';
import { useApp } from '../context/AppContext';
import { Brand, Button, ErrorNote, Icon } from './UI';
const messages = {
  'auth/invalid-credential': 'That email and password don’t match. Please try again.',
  'auth/email-already-in-use':
    'There’s already an account with this email. Try logging in.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests':
    'Too many attempts. Please wait a little before trying again.',
  'auth/network-request-failed': 'Check your internet connection and try again.',
};
export default function AuthScreen({ signup = false }) {
  const { user, ready, theme: t, saveProfile, setDemo } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [username, setUsername] = useState('');
  const [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const createdAccount = useRef(null);

  async function submit() {
    if (!email.trim() || !password || (signup && !username.trim()))
      return setError('Fill in all the fields to continue.');
    if (signup && !/^[a-zA-Z0-9_]{3,15}$/.test(username.trim()))
      return setError('Username: 3–15 letters, numbers, or underscores.');
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (signup) {
        // A retry after a profile/network error finishes the same new account.
        const account =
          createdAccount.current ||
          (await createUserWithEmailAndPassword(auth, email.trim(), password)).user;
        createdAccount.current = account;
        await updateProfile(account, { displayName: username.trim() });
        try {
          await saveProfile({ username: username.trim(), photoData: null });
        } catch {
          /* Home displays cloud sync status; account is valid. */
        }
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
      setDemo(false);
      router.replace('/home');
    } catch (e) {
      setError(messages[e.code] || 'We couldn’t complete that. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function resetPassword() {
    if (!email.trim())
      return setError('Enter your email above, then tap Forgot password.');
    setBusy(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(
        'If an account exists for this email, a reset link is on its way. Check your inbox.',
      );
    } catch (e) {
      setError(messages[e.code] || 'Could not request a reset. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  if (user && ready && !busy && !error) return <Redirect href="/home" />;
  const field = { backgroundColor: t.surface, color: t.ink, borderColor: t.line };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <View style={styles.top}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to welcome"
              onPress={() => router.replace('/')}
              style={{ padding: 10 }}
            >
              <Icon name="arrow-back" color={t.ink} />
            </Pressable>
            <Brand small />
          </View>
          <View style={[styles.symbol, { backgroundColor: t.accentSoft }]}>
            <Icon
              name={signup ? 'sparkles-outline' : 'heart-outline'}
              color={t.accent}
              size={35}
            />
          </View>
          <Text style={[styles.title, { color: t.ink }]}>
            {signup ? 'A fresh start\nstarts here.' : 'Welcome\nback, keeper.'}
          </Text>
          <Text style={[styles.body, { color: t.muted }]}>
            {signup
              ? 'Make a little room for your next favorite memory.'
              : 'Your memories are waiting. Let’s pick up where you left off.'}
          </Text>
          {signup && (
            <>
              <Text style={[styles.label, { color: t.ink }]}>Username</Text>
              <TextInput
                accessibilityLabel="Username"
                style={[styles.input, field]}
                placeholder="Your name here"
                placeholderTextColor={t.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={15}
                textContentType="username"
              />
            </>
          )}
          <Text style={[styles.label, { color: t.ink }]}>Email address</Text>
          <TextInput
            accessibilityLabel="Email address"
            style={[styles.input, field]}
            placeholder="you@example.com"
            placeholderTextColor={t.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Text style={[styles.label, { color: t.ink }]}>Password</Text>
          <View style={[styles.password, field]}>
            <TextInput
              accessibilityLabel="Password"
              style={{ flex: 1, color: t.ink, fontSize: 16, padding: 16 }}
              placeholder={signup ? 'At least 6 characters' : 'Your password'}
              placeholderTextColor={t.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoComplete={signup ? 'new-password' : 'current-password'}
              textContentType={signup ? 'newPassword' : 'password'}
              onSubmitEditing={submit}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={show ? 'Hide password' : 'Show password'}
              onPress={() => setShow(!show)}
              style={{ padding: 16 }}
            >
              <Icon
                name={show ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={t.muted}
              />
            </Pressable>
          </View>
          {!signup && (
            <Pressable
              onPress={resetPassword}
              disabled={busy}
              accessibilityRole="button"
              style={{ alignSelf: 'flex-end', paddingVertical: 15 }}
            >
              <Text style={{ color: t.purple, fontSize: 13, fontWeight: '600' }}>
                Forgot password?
              </Text>
            </Pressable>
          )}
          <ErrorNote text={error} />
          {notice ? (
            <Text style={{ color: t.green, lineHeight: 20, marginVertical: 10 }}>
              {notice}
            </Text>
          ) : null}
          <Button
            title={signup ? 'Create account' : 'Log in'}
            icon="arrow-forward"
            onPress={submit}
            loading={busy}
            style={{ marginTop: 18 }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace(signup ? '/login' : '/signup')}
            style={{ paddingVertical: 25, alignItems: 'center' }}
          >
            <Text style={{ color: t.muted, fontSize: 14 }}>
              {signup ? 'Already part of the club? ' : 'New around here? '}
              <Text style={{ color: t.purple, fontWeight: '700' }}>
                {signup ? 'Log in' : 'Create an account'}
              </Text>
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              marginTop: 18,
            }}
          >
            <Icon name="lock-closed-outline" size={13} color={t.muted} />
            <Text style={{ color: t.muted, fontSize: 11 }}>
              Your photos stay yours. Always.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
// STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', padding: 26 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  symbol: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: { fontSize: 40, fontWeight: '800', lineHeight: 45, letterSpacing: -1.3 },
  body: { fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 26 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 9, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 16, minHeight: 55, fontSize: 16, padding: 16 },
  password: {
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
