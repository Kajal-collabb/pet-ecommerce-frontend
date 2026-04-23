import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, Alert
} from 'react-native';
import { ArrowLeft, User, MapPin, ShoppingBag, Lock, ChevronRight, Mail, Phone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import ResetPasswordModal from './ResetPasswordModal';
import { StatusBar } from 'react-native';
const NAVY = '#1a2744';
const RED = '#dc2626';

export default function ProfileScreen() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');
    const [showReset, setShowReset] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const session = await AsyncStorage.getItem('user_session');
        if (session) {
            const parsed = JSON.parse(session);
            setUserEmail(parsed.email || '');
        }
    };

    const performLogout = async () => {
        await AsyncStorage.multiRemove(["userToken", "admin_id", "admin_role", "token_expires", "user_session", "userEmail"]);
        router.replace("/");
    };

    const menuItems = [
        {
            icon: <ShoppingBag size={20} color={NAVY} />,
            label: 'My Orders',
            sub: 'Track and view your orders',
            onPress: () => router.push('/my-orders'),
        },
        {
            icon: <MapPin size={20} color={NAVY} />,
            label: 'My Addresses',
            sub: 'Manage delivery addresses',
            onPress: () => router.push('/my-addresses'),
        },
        {
            icon: <Lock size={20} color={NAVY} />,
            label: 'Change Password',
            sub: 'Update your login password',
            onPress: () => setShowReset(true),
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={NAVY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar Card */}
                <View style={styles.avatarCard}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>
                            {userEmail ? userEmail[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View style={styles.avatarInfo}>
                        <Text style={styles.avatarName}>Hello there! 👋</Text>
                        <View style={styles.emailRow}>
                            <Mail size={13} color="#999" />
                            <Text style={styles.avatarEmail}>{userEmail}</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Account</Text>
                    <View style={styles.menuCard}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuIcon}>{item.icon}</View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                    <Text style={styles.menuSub}>{item.sub}</Text>
                                </View>
                                <ChevronRight size={18} color="#ccc" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                        if (Platform.OS === 'web') {
                            if (window.confirm('Are you sure you want to logout?')) performLogout();
                        } else {
                            Alert.alert('Logout', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', style: 'destructive', onPress: performLogout }
                            ]);
                        }
                    }}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <ResetPasswordModal
                visible={showReset}
                email={userEmail}
                mode="change"
                onClose={() => setShowReset(false)}
                onSuccess={() => {
                    setShowReset(false);
                    performLogout();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fa',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#f7f8fa',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: NAVY },

    avatarCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: NAVY,
        margin: 16, borderRadius: 20,
        padding: 20,
    },
    avatarCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: RED,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    avatarLetter: { fontSize: 28, fontWeight: '900', color: '#fff' },
    avatarInfo: { flex: 1 },
    avatarName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 6 },
    emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    avatarEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 },

    section: { paddingHorizontal: 16, marginBottom: 16 },
    sectionLabel: {
        fontSize: 11, fontWeight: '800', color: '#aaa',
        textTransform: 'uppercase', letterSpacing: 1.2,
        marginBottom: 10,
    },
    menuCard: {
        backgroundColor: '#fff', borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16,
    },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    menuIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#f7f8fa',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 2 },
    menuSub: { fontSize: 12, color: '#aaa' },

    logoutBtn: {
        backgroundColor: '#fff',
        borderRadius: 14, height: 52,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#fecaca',
    },
    logoutText: { fontSize: 15, fontWeight: '800', color: RED },
});