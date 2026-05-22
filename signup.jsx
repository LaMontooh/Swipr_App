import { StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";

// Firebase
import { auth } from "../Firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";


const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleSignUp = async () => {
    if (name === "" || email === "" || password === "") {
      alert("Please fill in all fields");
      return;
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/home");
    }
    catch (error) {
      alert(error.message);
    }
  }



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </Link>
        <Text style={styles.title}>Sign Up</Text>
        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}

        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showText}>Show</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.newsletter}>
        I would like to receive your newsletter and other promotional information.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
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
    paddingTop: 60,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  close: {
    fontSize: 18,
    color: "#333",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  loginLink: {
    color: "#2D2D8F",
    fontSize: 14,
    fontWeight: "600",
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
  showText: {
    color: "#2D2D8F",
    fontSize: 14,
    paddingLeft: 10,
  },
  newsletter: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 18,
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