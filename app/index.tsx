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
import { Eye, EyeOff } from 'lucide-react-native'; // ← Add this
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"; // ← Add this
import api from "../utils/api";
import SignupScreen from "./signup";
import OTPModal from "./OTPModal";
import ResetPasswordModal from "./ResetPasswordModal";

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const router = useRouter(); // ← Initialize router
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ← Add this

  const handleForgotPassword = () => {
    setShowResetModal(true);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !password) {
      const msg = "Please enter both email and password";
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

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: trimmedEmail,
        password,
      });

      console.log("Response Status:", response.status);
      console.log("Processed Data:", response.data);

      if (response.status === 200) {
        setShowOTP(true);
      } else {
        Alert.alert("Login Failed", response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.log("Login Error:", error);
      const errorMsg = error.response?.data?.message || "Unable to connect to server";
      Alert.alert("Error", errorMsg);
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
          // Store session as a JSON object to match user's preferred pattern
          const session = JSON.stringify({ token: data.token, email });
          await AsyncStorage.setItem("user_session", session);
        }
        console.log("Login Success! Navigating to dashboard...");
        setShowOTP(false);
        router.push("/dashboard");

        Alert.alert("Success", "Login Successful");
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

  if (isSignup) {
    return <SignupScreen onBackToLogin={() => setIsSignup(false)} />;
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f0e8" />

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
            <View style={styles.modal}>
              {/* left panel */}
              {!isMobile && (
                <View style={styles.leftPanel}>
                  <Image source={require('../assets/mm.png')} style={styles.petImage} resizeMode="cover" />
                  <View style={styles.leftOverlay}>
                    <Text style={styles.leftTitle}>Welcome back</Text>
                    <Text style={styles.leftSub}>Your pet's health, simplified</Text>
                  </View>
                </View>
              )}

              {/* right panel */}
              <View style={[styles.rightPanel, isMobile && { padding: 25 }]}>
                <View style={styles.formHeader}>
                  <Text style={styles.logoZigly}>Care<Text style={{ color: '#cf1313' }}>Tail</Text></Text>
                  <Text style={styles.heading}>Welcome Back</Text>
                  <TouchableOpacity onPress={() => setIsSignup(true)}>
                    <Text style={styles.subheading}>
                      Don't have an account? <Text style={styles.linkText}>Signup</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formContent}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}

                  />

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }]}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.loginButton} onPress={handleLogin}
                    disabled={loading} activeOpacity={0.85}>
                    {loading ? <ActivityIndicator color="#fff" /> :
                      <Text style={styles.loginButtonText}>Log In</Text>}
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.quoteText}>"Access everything your pet needs all in one place."</Text>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      <OTPModal
        visible={showOTP}
        onClose={() => setShowOTP(false)}
        onVerify={handleVerify}
        onResend={handleResend}
        loading={loading}
      />
      <ResetPasswordModal
        visible={showResetModal}
        email={email}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => setShowResetModal(false)}
      />
    </>
  );
}

const NAVY = "#1a2744";
const CREAM = "#e6bb7b";

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
  modalWrapper: { width: "100%", maxWidth: 900 },
  modal: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 580,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  leftPanel: { flex: 1, backgroundColor: CREAM, minWidth: 400, position: 'relative' },
  petImage: { width: "100%", height: "100%" },
  leftOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    backgroundColor: 'rgba(26, 39, 68, 0.4)',
  },
  leftTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  leftSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 5 },
  rightPanel: { flex: 1, backgroundColor: "#fff", padding: 40, justifyContent: "space-between" },
  formHeader: { alignItems: 'center', marginBottom: 20 },
  logoRow: { marginBottom: 15 },
  logoZigly: { fontSize: 36, fontWeight: "900", color: NAVY, letterSpacing: -1 },
  heading: { fontSize: 28, fontWeight: "800", color: NAVY, marginBottom: 8 },
  subheading: { fontSize: 15, color: "#666", marginBottom: 5, textAlign: 'center' },
  formContent: { flex: 1, justifyContent: 'center' },
  linkText: { color: "#cf1313", fontWeight: '700' },
  label: { fontSize: 12, color: NAVY, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    fontSize: 16,
    color: NAVY,
    backgroundColor: "#fafafa",
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    marginBottom: 10,
    paddingRight: 5,
  },
  eyeIcon: { padding: 10 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: "#4c4a6b", fontSize: 14, fontWeight: '600' },
  loginButton: {
    backgroundColor: NAVY,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  footer: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20, marginTop: 25, alignItems: 'center' },
  quoteText: { textAlign: 'center', fontSize: 14, color: '#c7722c', fontWeight: '500', fontStyle: 'italic' },
});
