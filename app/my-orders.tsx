import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TouchableOpacity, ActivityIndicator
} from 'react-native';
import { ArrowLeft, ShoppingBag, ChevronRight, Package } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { StatusBar, Platform } from 'react-native';
const NAVY = '#1a2744';
const RED = '#dc2626';


const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return { bg: '#f0fdf4', text: '#16a34a' };
    if (s === 'cancelled') return { bg: '#fff1f1', text: RED };
    if (s === 'shipped') return { bg: '#eff6ff', text: '#2563eb' };
    return { bg: '#fefce8', text: '#ca8a04' }; // pending/processing
};
const paymentColor = (mode) => {
    const m = (mode || '').toLowerCase();
    if (m === 'cod') return { bg: '#fff7ed', text: '#ea580c' }; // orange
    if (m === 'online') return { bg: '#ecfdf5', text: '#16a34a' }; // green
    return { bg: '#f1f5f9', text: '#64748b' }; // default
};
export default function MyOrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const session = await AsyncStorage.getItem('user_session');
            const token = session ? JSON.parse(session).token : null;
            const res = await api.get('/orders/all?page=0&size=20', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                setOrders(res.data.content || res.data || []);
            }
        } catch (error) {
            console.error('Fetch orders error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOrder = ({ item }) => {
        const sc = statusColor(item.status);
        const pc = paymentColor(item.paymentMode);
        return (
            <View style={styles.card}>
                {/* Top Row */}
                <View style={styles.cardTop}>
                    <View style={styles.orderIdRow}>
                        <Package size={15} color="#aaa" />
                        <Text style={styles.orderId}>Order #{item.id}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>

                        {/* Status */}
                        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                            <Text style={[styles.statusText, { color: sc.text }]}>
                                {item.status || 'Processing'}
                            </Text>
                        </View>

                        {/* Payment Mode */}
                        <View style={[styles.statusBadge, { backgroundColor: pc.bg }]}>
                            <Text style={[styles.statusText, { color: pc.text }]}>
                                {item.paymentMode === 'COD' ? 'Cash' : 'Online'}
                            </Text>
                        </View>

                    </View>
                </View>

                {/* Items */}
                {(item.orderItems || item.items || []).map((prod, i) => (
                    <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemDot}>•</Text>
                        <Text style={styles.itemName} numberOfLines={1}>
                            {prod.productName || prod.name}
                        </Text>
                        <Text style={styles.itemQty}>x{prod.quantity}</Text>
                    </View>
                ))}

                {/* Bottom Row */}
                <View style={styles.cardBottom}>
                    <Text style={styles.dateText}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </Text>
                    <Text style={styles.totalText}>₹{(item.totalAmount || item.total || 0).toFixed(2)}</Text>
                </View>
            </View>
        );
    };

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
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyCircle}>
                        <ShoppingBag size={44} color={RED} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptySub}>Your placed orders will show up here</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/dashboard')}>
                        <Text style={styles.shopBtnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id?.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
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
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        maxWidth: 680, width: '100%', alignSelf: 'center',
    },
    cardTop: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderId: { fontSize: 14, fontWeight: '700', color: NAVY },
    statusBadge: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: { fontSize: 12, fontWeight: '700' },

    itemRow: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 4,
    },
    itemDot: { color: '#ccc', marginRight: 6, fontSize: 16 },
    itemName: { flex: 1, fontSize: 13, color: '#555' },
    itemQty: { fontSize: 13, color: '#aaa', marginLeft: 8 },

    cardBottom: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#f5f5f5',
    },
    dateText: { fontSize: 12, color: '#aaa' },
    totalText: { fontSize: 16, fontWeight: '800', color: NAVY },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyCircle: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: '#fff1f1',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: NAVY, marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#aaa', marginBottom: 28 },
    shopBtn: {
        backgroundColor: RED, paddingHorizontal: 28,
        paddingVertical: 13, borderRadius: 12,
    },
    shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});