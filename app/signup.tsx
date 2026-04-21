import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "../utils/api";
import OTPModal from "./OTPModal";
import { Eye, EyeOff } from 'lucide-react-native';

export default function SignupScreen({ onBackToLogin }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !trimmedEmail || !password || !confirmPassword) {
      const msg = "Please fill in all fields";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      const msg = "Please enter a valid email address";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    if (password.length < 8) {
      const msg = "Password must be at least 8 characters long";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/signup", {
        username,
        email: trimmedEmail,
        password,
        confirmPassword,
      });

      if (response.status === 200) {
        setShowOTP(true);
      } else {
        Alert.alert("Signup Failed", response.data.message || "Something went wrong");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Unable to connect to server";
      Alert.alert("Error", errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (otp) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      const data = response.data;

      if (response.status === 200) {
        if (data.token) {
          const session = JSON.stringify({ token: data.token, email });
          await AsyncStorage.setItem("user_session", session);
        }
        Alert.alert("Success", "Account Verified Successfully", [
          { text: "OK", onPress: () => onBackToLogin() }
        ]);
      } else {
        Alert.alert("Verification Failed", data.message || "Invalid OTP");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Unable to verify OTP";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const response = await api.post(`/auth/resend-otp?email=${email}`);
      if (response.status === 200) {
        Alert.alert("Success", response.data || "OTP resent successfully");
      } else {
        Alert.alert("Error", response.data || "Failed to resend OTP");
      }
    } catch (error) {
      const errorMsg = error.response?.data || "Unable to resend OTP";
      Alert.alert("Error", errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f0e8" />

      {/* Main Background (Main Screen) */}
      <View style={styles.bgScreen}>
        <Text style={styles.bgText}>PET CARE</Text>
        <Text style={styles.bgText}>SERVICES</Text>
        <Text style={styles.bgText}>DASHBOARD</Text>
      </View>

      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.card}>
            {/* Header Area with Primary Color Accent */}
            <View style={styles.cardHeader}>
              <Text style={styles.logoZigly}>Care<Text style={{ color: '#cf1313' }}>Tail</Text></Text>
              <Text style={styles.heading}>Join the Family</Text>
              <Text style={styles.cardSub}>Create an account to get started</Text>
            </View>

            {/* Signup form */}
            <View style={styles.body}>
              <View style={styles.loginHint}>
                <Text style={styles.subheading}>Already have an account?</Text>
                <TouchableOpacity onPress={onBackToLogin}>
                  <Text style={styles.linkText}> Login here</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a unique username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <View style={isMobile ? null : s.row}>
                <View style={isMobile ? null : { flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.innerInput}
                      placeholder="Password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      {showPassword ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={isMobile ? null : { flex: 1 }}>
                  <Text style={styles.label}>Confirm</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.innerInput}
                      placeholder="Confirm"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                      {showConfirmPassword ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.quoteText}>"Join our community of pet lovers today!"</Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <OTPModal
        visible={showOTP}
        onClose={() => setShowOTP(false)}
        onVerify={handleVerify}
        onResend={handleResend}
        loading={loading}
      />
    </SafeAreaView>
  );
}

const NAVY = "#1a2744";
const CREAM = "#e6bb7b";

const s = StyleSheet.create({
  row: { flexDirection: 'row' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  bgScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f0e8",
  },
  bgText: {
    fontSize: 60,
    fontWeight: "900",
    color: "#ddd",
    opacity: 0.5,
    letterSpacing: 2,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalWrapper: { width: "100%", maxWidth: 600 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: NAVY,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoZigly: { fontSize: 32, fontWeight: "900", color: "#fff", marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: '500' },
  body: { padding: 24 },
  loginHint: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  subheading: { fontSize: 14, color: "#888" },
  linkText: { color: "#4c4a6b", fontWeight: 'bold' },
  label: { fontSize: 13, color: NAVY, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 16,
    backgroundColor: "#fafafa",
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#fafafa",
    paddingRight: 5,
  },
  innerInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#333',
  },
  eyeBtn: { padding: 8 },
  signupButton: {
    backgroundColor: NAVY,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: { marginTop: 15 },
  quoteText: { textAlign: 'center', fontSize: 14, color: '#c7722c', fontWeight: '500', fontStyle: 'italic' }
});