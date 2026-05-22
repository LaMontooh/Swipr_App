import { StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { auth } from "../Firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (email === "" || password === "") {
      alert("Please fill in all fields");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    }
    catch (error) {
      alert(error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.showBtn}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.showText}>Show</Text>
        </TouchableOpacity>
      </View>

      <Link href="/signup" asChild>
        <TouchableOpacity>
          <Text style={styles.signupLink}>
            Don't have an account? <Text style={styles.signupBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </Link>

      
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.forgot}>Forgot your password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 80,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  showBtn: {
    paddingLeft: 10,
  },
  showText: {
    color: "#2D2D8F",
    fontSize: 14,
  },
  signupLink: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
  signupBold: {
    color: "#2D2D8F",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2D2D8F",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgot: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 13,
  },
});