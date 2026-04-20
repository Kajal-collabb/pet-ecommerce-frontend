import React, { useState, useRef } from "react";
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  ActivityIndicator,
  Modal, // ← Import Modal
} from "react-native";

export default function OTPModal({ visible, onClose, onVerify, onResend, loading }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  console.log("OTP Modal Visible State:", visible); // ← Debugging log

  function handleChange(text, index) {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, "").slice(-1);
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleBackspace(e, index) {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>

          <View style={s.header}>
            <Text style={s.logo}>Care<Text style={{ color: "#e8333a" }}>Tail</Text></Text>
            <Text style={s.headerSub}>OTP verification</Text>
          </View>

          <View style={s.body}>
            <Text style={s.title}>Enter verification code</Text>
            <Text style={s.sub}>6-digit code sent to your email</Text>

            <View style={s.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={r => inputs.current[i] = r}
                  style={[s.box, digit ? s.boxFilled : null]}
                  value={digit}
                  onChangeText={t => handleChange(t, i)}
                  onKeyPress={e => handleBackspace(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity onPress={onResend} style={s.resendContainer}>
              <Text style={s.resend}>
                Didn't receive it?{" "}
                <Text style={{ color: "#e8333a", fontWeight: "700" }}>Resend OTP</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, otp.join("").length < 6 || loading ? s.btnDisabled : null]}
              onPress={() => onVerify(otp.join(""))}
              disabled={otp.join("").length < 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Verify & continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={s.back}>← Back to login</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",   // ← yeh key hai
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 999,
  },
  card: { backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 400, overflow: "hidden", elevation: 10 },
  header: { backgroundColor: "#1a2744", padding: 25 },
  logo: { fontSize: 26, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  body: { padding: 30 },
  title: { fontSize: 20, fontWeight: "800", color: "#1a2744", marginBottom: 6 },
  sub: { fontSize: 14, color: "#666", marginBottom: 30 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  box: {
    width: 48, height: 58, borderRadius: 12,
    borderWidth: 2, borderColor: "#eee",
    textAlign: "center", fontSize: 24, fontWeight: "700",
    color: "#1a2744", backgroundColor: "#fafafa"
  },
  boxFilled: { borderColor: "#1a2744", backgroundColor: "#fff" },
  resendContainer: { marginBottom: 25 },
  resend: { textAlign: "center", fontSize: 14, color: "#666" },
  btn: {
    backgroundColor: "#1a2744", height: 54, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginBottom: 15,
  },
  btnDisabled: { backgroundColor: "#ccc" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  back: { textAlign: "center", fontSize: 14, color: "#999", marginTop: 10 },
});