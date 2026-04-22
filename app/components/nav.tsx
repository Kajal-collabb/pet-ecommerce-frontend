import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Alert, Platform, useWindowDimensions, StatusBar
} from 'react-native';
import { Search, Heart, ShoppingBag, User, LogOut, Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResetPasswordModal from '../ResetPasswordModal';
import MobileSidebar from './MobileSidebar';
export default function NavBar() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const router = useRouter();
    const [showReset, setShowReset] = useState(false);
    const [email, setEmail] = useState("");
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    // --- Core Logic ---
    const performLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                "userToken", "admin_id", "admin_role",
                "token_expires", "user_session", "userEmail"
            ]);
            router.replace("/");
        } catch (error) {
            console.error("Logout Error:", error);
            router.replace("/");
        }
    };

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to logout?")) performLogout();
        } else {
            Alert.alert("Logout", "Are you sure you want to logout?", [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: performLogout }
            ]);
        }
    };

    // --- 1. MOBILE VIEW ---
    if (isMobile) {
        return (
            <View style={styles.mobileWrapper}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="transparent"
                    translucent
                />

                {/* Top Notch Blue Line */}


                {/* Main Row: Hamburger | careTail | Wishlist & Bag */}
                <View style={styles.mobileMainRow}>
                    <TouchableOpacity onPress={() => setSidebarVisible(true)}>
                        <Menu size={24} color="#1a2744" />
                    </TouchableOpacity>

                    <View style={styles.logoContainerMobile}>
                        <Text style={styles.logoTextMobile}>
                            care<Text style={styles.logoHighlight}>Tail</Text>
                        </Text>
                    </View>

                    <View style={styles.mobileActionIcons}>
                        <TouchableOpacity style={{ marginRight: 15 }} onPress={() => router.push('/wishlist')}>
                            <Heart size={24} color="#1a2744" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/bag')}>
                            <ShoppingBag size={24} color="#1a2744" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar Row (Always visible below logo in mobile) */}
                <View style={styles.mobileSearchRow}>
                    <View style={styles.mobileSearchInputContainer}>
                        <Search size={18} color="#888" style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Search For Grooming Tools"
                            style={styles.searchInput}
                            placeholderTextColor="#888"
                        />
                    </View>
                </View>
                <MobileSidebar
                    visible={isSidebarVisible}
                    onClose={() => setSidebarVisible(false)}
                    onLogout={handleLogout}
                    router={router}
                />
            </View>
        );
    }


    return (
        <View style={styles.navbar}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>
                    care<Text style={styles.logoHighlight}>Tail</Text>
                </Text>
            </View>

            <View style={styles.menuItems}>
                <TouchableOpacity><Text style={styles.menuTextRed}>Sale</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/HospitalLocator')}>
                    <Text style={styles.menuTextRed}>Vetcare</Text>
                </TouchableOpacity>
                <TouchableOpacity><Text style={styles.menuTextRed}>Grooming</Text></TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search size={18} color="#888" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search For Grooming Tools"
                    style={styles.searchInput}
                    placeholderTextColor="#888"
                />
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wishlist')}>
                    <Heart size={24} color="#1a2744" />
                    <Text style={styles.actionLabel}>Wishlist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/bag')}>
                    <ShoppingBag size={24} color="#1a2744" />
                    <Text style={styles.actionLabel}>Bag</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile')}>
                    <User size={24} color="#1a2744" />
                    <Text style={styles.actionLabel}>Profile</Text>
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
                onSuccess={() => { setShowReset(false); performLogout(); }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // --- Mobile Specific Styles ---
    mobileWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    mobileMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    logoContainerMobile: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: -1, // Logo center mein rahega
    },
    logoTextMobile: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a2744',
    },
    mobileActionIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mobileSearchRow: {
        paddingHorizontal: 15,
        paddingBottom: 12,
    },
    mobileSearchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7f9',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: '#e1e8ed',
    },

    // --- Web / Shared Styles ---
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
    },
    logoText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a2744',
    },
    logoHighlight: {
        color: '#E63946',
        fontStyle: 'italic',
    },
    menuItems: { flexDirection: 'row', gap: 15 },
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
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    actionButton: { alignItems: 'center', minWidth: 50 },
    actionLabel: { fontSize: 12, color: '#666', marginTop: 2 },
});