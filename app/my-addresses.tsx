import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TouchableOpacity, ActivityIndicator
} from 'react-native';
import { ArrowLeft, MapPin, Home } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { StatusBar, Platform } from 'react-native';
const NAVY = '#1a2744';
const RED = '#dc2626';

export default function MyAddressesScreen() {
    const router = useRouter();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const session = await AsyncStorage.getItem('user_session');
            const token = session ? JSON.parse(session).token : null;
            const res = await api.get('/address/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                setAddresses(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            console.error('Fetch addresses error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderAddress = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                    <MapPin size={18} color={RED} />
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    {item.default && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.phone}>{item.phoneNumber}</Text>
                <Text style={styles.address}>
                    {item.addressLine1}, {item.city}, {item.state} - {item.pincode}
                </Text>
                <Text style={styles.country}>{item.country}</Text>
            </View>
        </View>
    );

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={RED} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={NAVY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
            </View>

            {addresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyCircle}>
                        <Home size={44} color={RED} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.emptyTitle}>No addresses saved</Text>
                    <Text style={styles.emptySub}>Add an address when you checkout</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/address')}>
                        <Text style={styles.addBtnText}>Add Address</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={(item) => item.id?.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/address')}>
                            <Text style={styles.addMoreText}>+ Add New Address</Text>
                        </TouchableOpacity>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fa',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

    list: { padding: 16 },

    card: {
        flexDirection: 'row',
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        maxWidth: 680, width: '100%', alignSelf: 'center',
    },
    cardLeft: { marginRight: 14 },
    iconBox: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: '#fff1f1',
        justifyContent: 'center', alignItems: 'center',
    },
    cardBody: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 15, fontWeight: '700', color: NAVY, marginRight: 8 },
    defaultBadge: {
        backgroundColor: '#f0fdf4', paddingHorizontal: 8,
        paddingVertical: 2, borderRadius: 10,
    },
    defaultText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
    phone: { fontSize: 13, color: '#888', marginBottom: 6 },
    address: { fontSize: 13, color: '#555', lineHeight: 20 },
    country: { fontSize: 12, color: '#aaa', marginTop: 2 },

    addMoreBtn: {
        borderWidth: 1.5, borderColor: RED, borderStyle: 'dashed',
        borderRadius: 12, height: 50,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 4, marginBottom: 20,
        maxWidth: 680, width: '100%', alignSelf: 'center',
    },
    addMoreText: { color: RED, fontWeight: '700', fontSize: 14 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyCircle: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: '#fff1f1',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: NAVY, marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#aaa', marginBottom: 28 },
    addBtn: {
        backgroundColor: RED, paddingHorizontal: 28,
        paddingVertical: 13, borderRadius: 12,
    },
    addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});