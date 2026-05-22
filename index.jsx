import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions  } from "react-native";
import React from "react";
import { Link } from "expo-router";

const Home = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/swipr-logo.jpeg")}
        style={{ width: 150, height: 150, marginBottom: 30 }}
      />

      <Text style={styles.title}>Swipr</Text>
      <Text style={styles.subtitle}>Swipe to clean your camera roll</Text>

      <Link href="/onboarding" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Start Cleaning</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
  },
  button: {
    backgroundColor: "#E61A5F",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
