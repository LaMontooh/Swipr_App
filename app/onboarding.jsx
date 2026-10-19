// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { Brand, Button, Icon } from '../src/components/UI';
const slides = [
  {
    icon: 'swap-horizontal-outline',
    label: '01 / MAKE THE CALL',
    title: 'One photo.\nOne little decision.',
    body: 'Swipe left for the extras. Swipe right for the memories. Buttons work too, if that’s more your style.',
  },
  {
    icon: 'shield-checkmark-outline',
    label: '02 / YOU’RE IN CONTROL',
    title: 'A second chance\nbefore goodbye.',
    body: 'Left swipes go into your review tray. Undo a swipe or restore a photo there. Nothing is deleted until you confirm.',
  },
  {
    icon: 'leaf-outline',
    label: '03 / SEE YOUR PROGRESS',
    title: 'Small swipes.\nA lighter library.',
    body: 'See how many photos you’ve swiped through and the measured size of photos you remove. Your photo library stays on your phone.',
  },
];
export default function Onboarding() {
  const { user, theme: t } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = slides[step];
  if (user) return <Redirect href="/home" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.row}>
          <Brand small />
          <Pressable onPress={() => router.replace('/login')} accessibilityRole="button">
            <Text style={{ color: t.muted, padding: 12 }}>Log in</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <View style={[styles.circle, { backgroundColor: t.soft }]}>
            <Icon name={slide.icon} size={72} color={t.purple} />
          </View>
          {step === 0 && (
            <View style={styles.row}>
              <View style={[styles.hint, { backgroundColor: t.accentSoft }]}>
                <Icon name="close" color={t.accent} />
                <Text style={{ color: t.accent, fontWeight: '700' }}>Delete</Text>
              </View>
              <View style={[styles.hint, { backgroundColor: t.greenSoft }]}>
                <Icon name="heart-outline" color={t.green} />
                <Text style={{ color: t.green, fontWeight: '700' }}>Keep</Text>
              </View>
            </View>
          )}
          <Text style={[styles.label, { color: t.accent }]}>{slide.label}</Text>
          <Text style={[styles.title, { color: t.ink }]}>{slide.title}</Text>
          <Text style={[styles.body, { color: t.muted }]}>{slide.body}</Text>
        </View>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setStep(i)}
              accessibilityLabel={`Intro page ${i + 1}`}
              style={{
                height: 7,
                width: i === step ? 26 : 7,
                borderRadius: 6,
                backgroundColor: i === step ? t.purple : t.line,
              }}
            />
          ))}
        </View>
        <Button
          title={step === 2 ? 'Create my account' : 'Sounds good'}
          icon="arrow-forward"
          onPress={() => (step === 2 ? router.replace('/signup') : setStep(step + 1))}
        />
        <Pressable
          onPress={() => router.replace('/signup')}
          accessibilityRole="button"
          style={{ padding: 18, alignItems: 'center' }}
        >
          <Text style={{ color: t.muted, fontSize: 13 }}>Skip introduction</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
// STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 28, width: '100%', maxWidth: 480, alignSelf: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 46,
  },
  circle: {
    width: 190,
    height: 190,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    transform: [{ rotate: '-7deg' }],
  },
  hint: {
    padding: 12,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  label: {
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 34,
    marginBottom: 15,
  },
  title: {
    fontSize: 35,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 40,
  },
  body: { fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 24 },
});
