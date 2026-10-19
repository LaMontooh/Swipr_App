// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../src/context/AppContext';
import { Brand, Button, Icon } from '../src/components/UI';
import { demoPhotos } from '../src/lib/media';
export default function Welcome() {
  const { user, ready, theme: t, setDemo } = useApp();
  const router = useRouter();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={t.accent} />
      </View>
    );
  if (user) return <Redirect href="/home" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <Brand />
          <View style={[styles.pill, { backgroundColor: t.soft }]}>
            <Icon name="sparkles-outline" color={t.purple} size={15} />
            <Text style={{ color: t.purple, fontSize: 11, fontWeight: '700' }}>
              A little less clutter
            </Text>
          </View>
        </View>
        <View style={styles.art}>
          <View
            style={[
              styles.back,
              { backgroundColor: t.purple, transform: [{ rotate: '-12deg' }] },
            ]}
          />
          <View
            style={[
              styles.back,
              { backgroundColor: '#EDB976', transform: [{ rotate: '11deg' }] },
            ]}
          />
          <View style={styles.photo}>
            <Image source={{ uri: demoPhotos[0].uri }} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['transparent', '#17182799']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.memory}>
              <Icon name="heart" color="white" size={17} />
              <Text style={styles.memoryText}>Make room for what matters.</Text>
            </View>
          </View>
          <View style={[styles.floating, { backgroundColor: t.surface }]}>
            <Icon name="checkmark" color={t.green} />
            <Text style={{ color: t.ink, fontWeight: '700' }}>This one's a keeper.</Text>
          </View>
        </View>
        <Text style={[styles.eyebrow, { color: t.accent }]}>
          YOUR CAMERA ROLL, REIMAGINED
        </Text>
        <Text style={[styles.title, { color: t.ink }]}>
          Less clutter.{'\n'}More memories.
        </Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>
          A fresh start for your photos. Swipe through the extras and keep the moments you
          love.
        </Text>
        <Button
          title="Let's make some space"
          icon="arrow-forward"
          onPress={() => router.push('/onboarding')}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={styles.link}
        >
          <Text style={{ color: t.muted }}>
            Already have an account?{' '}
            <Text style={{ color: t.purple, fontWeight: '700' }}>Log in</Text>
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setDemo(true);
            router.push('/home');
          }}
          style={styles.preview}
        >
          <Text style={{ color: t.muted, fontSize: 12 }}>Take a quick look · demo</Text>
        </Pressable>
        <View style={styles.trust}>
          <Icon name="shield-checkmark-outline" size={14} color={t.muted} />
          <Text style={{ color: t.muted, fontSize: 11 }}>
            Your camera roll stays on your device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
// STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 26,
    paddingBottom: 26,
    flexGrow: 1,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: {
    borderRadius: 20,
    padding: 9,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  art: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 24,
  },
  back: { position: 'absolute', width: 218, height: 260, borderRadius: 27, opacity: 0.6 },
  photo: {
    width: 220,
    height: 265,
    borderRadius: 26,
    overflow: 'hidden',
    transform: [{ rotate: '-3deg' }],
  },
  memory: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memoryText: { fontSize: 12, fontWeight: '600', color: 'white', flex: 1 },
  floating: {
    position: 'absolute',
    bottom: 9,
    right: 4,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    boxShadow: '0 8px 25px #25233F15',
    transform: [{ rotate: '3deg' }],
  },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 12 },
  title: { fontSize: 42, fontWeight: '800', lineHeight: 46, letterSpacing: -1.7 },
  subtitle: { fontSize: 15, lineHeight: 23, marginTop: 14, marginBottom: 26 },
  link: { alignItems: 'center', paddingTop: 20, paddingBottom: 6 },
  preview: { alignItems: 'center', padding: 12 },
  trust: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
});
