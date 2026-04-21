import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Search, Heart, ShoppingBag, User, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResetPasswordModal from '../ResetPasswordModal';

export default function NavBar() {
    const router = useRouter();
    const [showReset, setShowReset] = useState(false);
    const [email, setEmail] = useState("");

    const performLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                "userToken",
                "admin_id",
                "admin_role",
                "token_expires",
                "user_session",
                "userEmail"
            ]);
            console.log("Storage cleared. Redirecting to login...");
            router.replace("/");
        } catch (error) {
            console.error("Error clearing storage:", error);
            router.replace("/");
        }
    };

    const handleChangePassword = async () => {
        const session = await AsyncStorage.getItem("user_session");
        const storedEmail = session ? JSON.parse(session).email : null;

        if (!storedEmail) {
            Alert.alert("Error", "User email not found. Please log in again.");
            return;
        }
        setEmail(storedEmail);
        setShowReset(true);
    };

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to logout?");
            if (confirmed) performLogout();
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Logout", style: "destructive", onPress: performLogout }
                ]
            );
        }
    };

    return (
        <View style={styles.navbar}>

            {/* 1. Logo */}
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>
                    care<Text style={styles.logoHighlight}>Tail</Text>
                </Text>
            </View>
            {/* 2. Menu Links (Sale, Vetcare, Grooming) */}
            <View style={styles.menuItems}>
                <TouchableOpacity>
                    <Text style={styles.menuTextRed}>Sale</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.menuTextRed}>Vetcare</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.menuTextRed}>Grooming</Text>
                </TouchableOpacity>
            </View>

            {/* 3. Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={18} color="#888" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search For Grooming Tools"
                    style={styles.searchInput}
                    placeholderTextColor="#888"
                />
            </View>

            {/* 4. Action Icons (Change Password, Wishlist, Bag, Logout) */}
            <View style={styles.actions}>

                <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
                    <User size={24} color="#1a2744" />
                    <Text style={styles.actionLabel}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wishlist')}>
                    <Heart size={24} color="#1a2744" />
                    <Text style={styles.actionLabel}>Wishlist</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <ShoppingBag size={24} color="#1a2744" />
                    <Text style={styles.actionLabel}>Bag</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                    <LogOut size={24} color="#cf1313" />
                    <Text style={[styles.actionLabel, { color: '#cf1313' }]}>Logout</Text>
                </TouchableOpacity>

            </View>

            <ResetPasswordModal
                visible={showReset}
                email={email}
                mode="change"
                onClose={() => setShowReset(false)}
                onSuccess={() => {
                    setShowReset(false);
                    performLogout(); // ← Automatically logout after success
                }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderTopWidth: 20,
        borderTopColor: '#0a3083ff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        // Elevation for shadow on Android
        elevation: 3,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoContainer: {
        marginRight: 10,
    },
    logoText: {
        fontSize: 26, // Boosted size for the main nav
        fontWeight: '800',
        color: '#1a2744',
        letterSpacing: -0.5,
    },
    logoHighlight: {
        color: '#E63946', // Consistent Brand Red
        fontStyle: 'italic', // Signature "Tail" wag
    },
    menuItems: {
        flexDirection: 'row',
        gap: 15,
    },
    menuTextRed: {
        fontSize: 17,
        fontWeight: '600',
        color: '#cf1313',
        marginLeft: 10,

    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7f9',
        borderRadius: 20,
        paddingHorizontal: 12,
        marginHorizontal: 20,
        height: 40,
        borderWidth: 1,
        borderColor: '#e1e8ed',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    actionLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
});

