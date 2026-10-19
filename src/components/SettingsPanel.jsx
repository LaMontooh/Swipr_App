// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Linking,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { auth } from '../../Firebase/firebase';
import { useApp } from '../context/AppContext';
import { Avatar, Button, ErrorNote, Icon } from './UI';
export default function SettingsPanel({ visible, onClose, onRefresh, limited }) {
  const {
    profile,
    user,
    theme: t,
    themeMode,
    setAppearance,
    saveProfile,
    syncError,
    demo,
    setDemo,
  } = useApp();
  const [username, setUsername] = useState(''),
    [photoData, setPhotoData] = useState(null),
    [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const y = useRef(new Animated.Value(-24)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useEffect(() => {
    if (visible) {
      setUsername(profile?.username || '');
      setPhotoData(profile?.photoData || null);
      setEditing(false);
      setError('');
      setSaved(false);
      y.setValue(-24);
      Animated.spring(y, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        damping: 19,
      }).start();
    }
  }, [visible]);
  async function pick() {
    setError('');
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const side = Math.min(asset.width, asset.height);
      const photo = await manipulateAsync(
        asset.uri,
        [
          {
            crop: {
              originX: (asset.width - side) / 2,
              originY: (asset.height - side) / 2,
              width: side,
              height: side,
            },
          },
          { resize: { width: 256, height: 256 } },
        ],
        { compress: 0.65, format: SaveFormat.JPEG, base64: true },
      );
      if (!photo.base64 || photo.base64.length > 180000)
        throw new Error('Choose a smaller photo for your profile.');
      setPhotoData(`data:image/jpeg;base64,${photo.base64}`);
      setSaved(false);
    } catch (e) {
      setError(e.message || 'Could not open that photo.');
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError('');
    try {
      await saveProfile({ username: username.trim(), photoData });
      setSaved(true);
      setEditing(false);
    } catch (e) {
      setError(e.message || 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      if (!demo) await signOut(auth);
      setDemo(false);
      onClose();
      router.replace('/login');
    } catch {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !busy && onClose()}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close settings"
        style={styles.backdrop}
        onPress={() => !busy && onClose()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          marginTop: insets.top + 70,
          maxHeight: '83%',
          paddingHorizontal: 18,
        }}
      >
        <Animated.View
          style={[
            styles.panel,
            { backgroundColor: t.surface, transform: [{ translateY: y }] },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 22 }}
          >
            <View style={styles.row}>
              <Text style={[styles.title, { color: t.ink }]}>Your little corner</Text>
              <Pressable
                onPress={onClose}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Close settings"
                style={{ padding: 8 }}
              >
                <Icon name="close" color={t.muted} />
              </Pressable>
            </View>
            <View style={[styles.profile, { borderBottomColor: t.line }]}>
              <Avatar profile={editing ? { username, photoData } : profile} size={60} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 17, fontWeight: '800' }}>
                  {demo
                    ? 'Demo explorer'
                    : profile?.username || user?.displayName || 'Photo lover'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: t.muted, fontSize: 12, marginTop: 5 }}
                >
                  {demo ? 'Try it out. Nothing gets deleted.' : user?.email}
                </Text>
              </View>
            </View>
            {!demo && (
              <Pressable
                style={styles.setting}
                accessibilityRole="button"
                onPress={() => {
                  setEditing(!editing);
                  setSaved(false);
                }}
              >
                <Icon name="person-outline" color={t.purple} />
                <Text style={[styles.settingText, { color: t.ink }]}>Edit profile</Text>
                <Icon name="chevron-down" size={18} color={t.muted} />
              </Pressable>
            )}
            {editing && (
              <View style={{ gap: 12, marginBottom: 12 }}>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  USERNAME · 3–15 CHARACTERS
                </Text>
                <TextInput
                  accessibilityLabel="Edit username"
                  value={username}
                  onChangeText={setUsername}
                  maxLength={15}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: t.bg,
                    color: t.ink,
                    borderRadius: 13,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: t.line,
                  }}
                />
                <Button
                  title="Choose profile photo"
                  variant="secondary"
                  icon="image-outline"
                  onPress={pick}
                  disabled={busy}
                />
                {photoData && (
                  <Pressable
                    onPress={() => setPhotoData(null)}
                    accessibilityRole="button"
                  >
                    <Text style={{ color: t.muted, textAlign: 'center', padding: 8 }}>
                      Remove profile photo
                    </Text>
                  </Pressable>
                )}
                <Button title="Save profile" onPress={save} loading={busy} />
              </View>
            )}
            {saved && (
              <Text style={{ color: t.green, marginVertical: 8 }}>
                Profile saved to your account.
              </Text>
            )}
            <View style={styles.setting}>
              <Icon name="contrast-outline" color={t.purple} />
              <Text style={[styles.settingText, { color: t.ink }]}>Make it yours</Text>
            </View>
            <View style={[styles.modes, { backgroundColor: t.bg }]}>
              {[
                ['light', 'sunny-outline', 'Light'],
                ['dark', 'moon-outline', 'Dark'],
                ['system', 'phone-portrait-outline', 'Auto'],
              ].map(([mode, icon, label]) => (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} appearance`}
                  accessibilityState={{ selected: themeMode === mode }}
                  onPress={() => setAppearance(mode)}
                  style={[
                    styles.mode,
                    { backgroundColor: themeMode === mode ? t.soft : 'transparent' },
                  ]}
                >
                  <Icon
                    name={icon}
                    size={18}
                    color={themeMode === mode ? t.purple : t.muted}
                  />
                  <Text
                    style={{
                      color: themeMode === mode ? t.purple : t.muted,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.setting}
              onPress={async () => {
                onClose();
                await onRefresh();
              }}
              accessibilityRole="button"
            >
              <Icon name="refresh-outline" color={t.purple} />
              <Text style={[styles.settingText, { color: t.ink }]}>
                Refresh photo library
              </Text>
            </Pressable>
            {!demo && Platform.OS !== 'web' && (
              <Pressable
                style={styles.setting}
                onPress={() => Linking.openSettings()}
                accessibilityRole="button"
              >
                <Icon name="images-outline" color={t.purple} />
                <Text style={[styles.settingText, { color: t.ink }]}>
                  {limited ? 'Manage selected photo access' : 'Photo permissions'}
                </Text>
                <Icon name="open-outline" size={17} color={t.muted} />
              </Pressable>
            )}
            <View style={[styles.note, { backgroundColor: t.bg }]}>
              <Icon name="shield-checkmark-outline" color={t.green} size={19} />
              <Text style={{ color: t.muted, fontSize: 12, lineHeight: 19, flex: 1 }}>
                Your library stays on this phone. Only your username, profile photo, and
                appearance preference sync to your account.
              </Text>
            </View>
            <ErrorNote text={error || syncError} />
            <Button
              title={demo ? 'Leave demo' : 'Log out'}
              variant="secondary"
              icon="log-out-outline"
              onPress={logout}
              disabled={busy}
              style={{ marginTop: 10 }}
            />
            <Text
              style={{
                color: t.muted,
                fontSize: 10,
                textAlign: 'center',
                marginTop: 18,
                letterSpacing: 1,
              }}
            >
              SWIPR · A LITTLE LESS, A LITTLE BETTER
            </Text>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
// STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#14122477' },
  panel: { borderRadius: 26, overflow: 'hidden', boxShadow: '0 20px 70px #00000030' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.6 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  setting: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 50 },
  settingText: { flex: 1, fontSize: 14, fontWeight: '600' },
  modes: { flexDirection: 'row', borderRadius: 15, padding: 5, marginBottom: 8 },
  mode: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 7,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 15,
    gap: 10,
    marginVertical: 14,
  },
});
