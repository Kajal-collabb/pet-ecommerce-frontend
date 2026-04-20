import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Platform
} from "react-native";
import { Eye, EyeOff } from 'lucide-react-native';
import api from "../utils/api";


export default function ResetPasswordModal({ visible, email: initialEmail, onClose, onSuccess, mode = "forgot" }) {
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Pwd
  const [modalEmail, setModalEmail] = useState(initialEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isChangeMode = mode === "change";

  // Dynamic Text based on mode
  const headerTitle = isChangeMode ? "Security Update" : "Password Recovery";
  const mainTitle = isChangeMode ? "Change Password" : "Forgot Password?";
  const subTitle = isChangeMode
    ? "Request a verification code to update your password."
    : "Enter your email address to receive a reset code.";
  const actionBtnText = isChangeMode ? "Send Verification Code" : "Send Reset Code";
  const backBtnText = isChangeMode ? " Cancel" : "← Back to Login";

  // Reset modal state when it closes or opens
  useEffect(() => {
    if (visible) {
      setStep(1);
      setModalEmail(initialEmail || "");
      setOtp("");
      setNewPassword("");
    }
  }, [visible, initialEmail]);

  const handleSendOTP = async () => {
    const trimmedEmail = modalEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      const msg = "Please enter a valid email address";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/forgot-password?email=${trimmedEmail}`);

      if (response.status === 200) {
        if (Platform.OS === 'web') window.alert("Verification code sent to your email!");
        else Alert.alert("Success", "Verification code sent to your email!");
        setStep(2);
      } else {
        let errorMsg = response.data || "Failed to send verification code";

        if (response.status === 404) {
          errorMsg = "This email is not registered with us. Please check your spelling.";
        } else if (typeof response.data === 'object' && response.data.message) {
          errorMsg = response.data.message;
        }

        if (Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert("Error", errorMsg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || "Unable to connect to server";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!otp || !newPassword) {
      const msg = "Please enter both the code and your new password";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    if (newPassword.length < 8) {
      const msg = "New password must be at least 8 characters long";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password?email=${modalEmail}&otp=${otp}&newPassword=${newPassword}`);

      if (response.status === 200) {
        const msg = isChangeMode
          ? "Password updated successfully!"
          : "Password reset successfully! Please login with your new password.";
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert("Success", msg);
        onSuccess();
      } else {
        const msg = response.data?.message || response.data || "Invalid code or request";
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert("Failed", msg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || "Unable to connect to server";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.logo}>Care<Text style={{ color: "#cf1313" }}>Tail</Text></Text>
            <Text style={s.headerSub}>{headerTitle}</Text>
          </View>

          <View style={s.body}>
            {step === 1 ? (
              <>
                <Text style={s.title}>{mainTitle}</Text>
                <Text style={s.sub}>{subTitle}</Text>

                <Text style={s.label}>Email Address</Text>
                <TextInput
                  style={[s.input, isChangeMode && { opacity: 0.7 }]}
                  placeholder="name@example.com"
                  value={modalEmail}
                  onChangeText={setModalEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isChangeMode}
                />

                <TouchableOpacity style={s.btn} onPress={handleSendOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{actionBtnText}</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.title}>{isChangeMode ? "Update Password" : "Set New Password"}</Text>
                <Text style={s.sub}>Enter the code sent to {modalEmail}.</Text>

                <Text style={s.label}>Verification Code</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />

                <Text style={s.label}>New Password</Text>
                <View style={s.passwordContainer}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }]}
                    placeholder="Min 8 characters"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color="#999" /> : <Eye size={20} color="#999" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{isChangeMode ? "Save Changes" : "Update Password"}</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => isChangeMode ? handleSendOTP() : setStep(1)}
                  style={{ marginTop: 15 }}
                >
                  <Text style={[s.back, { textAlign: 'center' }]}>
                    {isChangeMode ? "Didn't get it? Re-send Code" : "Wait, I need to change the email"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
              <Text style={s.back}>{backBtnText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 400, overflow: "hidden", elevation: 10 },
  header: { backgroundColor: "#1a2744", padding: 25, alignItems: 'center' },
  logo: { fontSize: 26, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  body: { padding: 30 },
  title: { fontSize: 20, fontWeight: "800", color: "#1a2744", marginBottom: 6 },
  sub: { fontSize: 14, color: "#666", marginBottom: 25 },
  label: { fontSize: 12, fontWeight: "700", color: "#999", marginBottom: 8, textTransform: "uppercase" },
  input: {
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    fontSize: 16,
    color: "#1a2744",
    backgroundColor: '#fafafa'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 12,
    marginBottom: 20,
    paddingRight: 10,
    backgroundColor: '#fafafa'
  },
  btn: {
    backgroundColor: "#1a2744",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1a2744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  back: { color: "#4c4a6b", fontWeight: "600", fontSize: 14, textAlign: 'center' },
});
