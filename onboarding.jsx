import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { Link, router } from "expo-router";
import { useState } from "react";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Clean Smarter,\nKeep Better.",
    subtitle: "Your camera roll deserves a second look.",
    content: null,
    cta: "Get Started",
    icon: "📷",
  },
  {
    title: "Swipe to Decide",
    subtitle: "Right to keep. Left to delete.\nIt's that fast.",
    content: "delete",
    cta: "Got it",
  },
  {
    title: "Swipe to Decide",
    subtitle: "Right to keep. Left to delete.\nIt's that fast.",
    content: "keep",
    cta: "Got it",
  },
  {
    title: "Nothing Goes\nWithout You.",
    subtitle: "You decide whats deleted, we'll never get rid of photos without your permission.",
    content: null,
    cta: "Sounds Good",
  },
  {
    title: "Let's Get\nStarted!",
    subtitle: "Let's clear the clutter and find the photos that matter.",
    content: null,
    cta: "Start Cleaning",
    last: true,
  },
];

export default function onboarding() {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  const next = () => {
    if (slide.last) {
      router.push("/login");
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => router.push("/login");

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        {slide.icon && <Text style={styles.icon}>{slide.icon}</Text>}

        {slide.content === "delete" && (
          <View style={styles.cardStack}>
            <View style={[styles.card, styles.cardBack]} />
            <View style={[styles.card, styles.cardDelete]}>
              <Text style={styles.cardLabel}>Delete</Text>
            </View>
          </View>
        )}
        {slide.content === "keep" && (
          <View style={styles.cardStack}>
            <View style={[styles.card, styles.cardBack]} />
            <View style={[styles.card, styles.cardKeep]}>
              <Text style={styles.cardLabel}>Keep</Text>
            </View>
          </View>
        )}

        <Text style={[styles.title, step === 0 && styles.titleBlue]}>
          {slide.title}
        </Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>{slide.cta}</Text>
        </TouchableOpacity>
        {!slide.last && (
          <TouchableOpacity onPress={skip}>
            <Text style={styles.skip}>Skip intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 50,
    justifyContent: "space-between",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#2D2D8F",
    width: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  icon: {
    fontSize: 60,
    marginBottom: 10,
  },
  cardStack: {
    width: 200,
    height: 260,
    marginBottom: 20,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 160,
    height: 220,
    borderRadius: 20,
    position: "absolute",
  },
  cardBack: {
    backgroundColor: "#eee",
    transform: [{ rotate: "6deg" }],
  },
  cardDelete: {
    backgroundColor: "#E05A3A",
    transform: [{ rotate: "-8deg" }],
    justifyContent: "center",
    alignItems: "center",
  },
  cardKeep: {
    backgroundColor: "#2ECC71",
    transform: [{ rotate: "8deg" }],
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1a1a2e",
    lineHeight: 38,
  },
  titleBlue: {
    color: "#2D2D8F",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
  },
  bottom: {
    alignItems: "center",
    gap: 14,
  },
  button: {
    backgroundColor: "#2D2D8F",
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skip: {
    color: "#aaa",
    fontSize: 13,
  },
});