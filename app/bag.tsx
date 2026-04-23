import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Image, ActivityIndicator, Alert,
    Platform, RefreshControl
} from 'react-native';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ChevronRight, Tag, Truck, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { StatusBar } from 'react-native';
const NAVY = '#1a2744';
const RED = '#dc2626';
const LIGHT_RED = '#fff1f1';
const GRAY_BG = '#f7f8fa';

export default function BagScreen() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [clearing, setClearing] = useState(false);

    const getToken = async () => {
        const session = await AsyncStorage.getItem('user_session');
        return session ? JSON.parse(session).token : null;
    };

    const fetchBag = async () => {
        try {
            const token = await getToken();
            const res = await api.get('/bag/all?page=0&size=50', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                setItems(res.data.content || []);
            }
        } catch (error) {
            console.error('Fetch bag error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchBag(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBag();
    }, []);

    const handleIncrease = async (itemId) => {
        setUpdatingId(itemId);
        try {
            const token = await getToken();
            const res = await api.patch(`/bag/increase/${itemId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                setItems(prev => prev.map(i => i.id === itemId ? res.data : i));
            }
        } catch (error) {
            showAlert('Error', 'Could not update quantity.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDecrease = async (item) => {
        if (item.quantity === 1) { handleDelete(item.id); return; }
        setUpdatingId(item.id);
        try {
            const token = await getToken();
            const res = await api.patch(`/bag/decrease/${item.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
            }
        } catch (error) {
            showAlert('Error', 'Could not update quantity.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (itemId) => {
        setUpdatingId(itemId);
        try {
            const token = await getToken();
            await api.delete(`/bag/delete/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(prev => prev.filter(i => i.id !== itemId));
        } catch (error) {
            showAlert('Error', 'Could not remove item.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleClearBag = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Clear all items from your bag?')) doClear();
        } else {
            Alert.alert('Clear Bag', 'Remove all items from your bag?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: doClear }
            ]);
        }
    };

    const doClear = async () => {
        setClearing(true);
        try {
            const token = await getToken();
            await api.delete('/bag/clear', { headers: { Authorization: `Bearer ${token}` } });
            setItems([]);
        } catch (error) {
            showAlert('Error', 'Could not clear bag.');
        } finally {
            setClearing(false);
        }
    };

    const showAlert = (title, msg) => {
        if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
        else Alert.alert(title, msg);
    };

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={RED} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={NAVY} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>My Bag</Text>
                    {items.length > 0 && (
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>{totalItems}</Text>
                        </View>
                    )}
                </View>
                {items.length > 0 && (
                    <TouchableOpacity onPress={handleClearBag} style={styles.clearBtn} disabled={clearing}>
                        {clearing
                            ? <ActivityIndicator size="small" color={RED} />
                            : <Text style={styles.clearText}>Clear All</Text>}
                    </TouchableOpacity>
                )}
            </View>

            {items.length === 0 ? (

                /* ── Empty State ── */
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyCircleOuter}>
                        <View style={styles.emptyCircleInner}>
                            <ShoppingBag size={48} color={RED} strokeWidth={1.5} />
                        </View>
                    </View>
                    <Text style={styles.emptyTitle}>Your bag is empty</Text>
                    <Text style={styles.emptySub}>Add items you love to your bag.{'\n'}Review them before placing your order.</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/dashboard')} activeOpacity={0.85}>
                        <Text style={styles.shopBtnText}>Continue Shopping</Text>
                        <ChevronRight size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

            ) : (
                <>
                    {/* ── Free Delivery Banner ── */}
                    <View style={styles.deliveryBanner}>
                        <Truck size={15} color="#16a34a" />
                        <Text style={styles.deliveryBannerText}>
                            🎉 You've got <Text style={styles.deliveryBold}>FREE delivery</Text> on this order!
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={RED} />}
                    >
                        {/* ── Item Cards ── */}
                        {items.map((item) => (
                            <View key={item.id} style={styles.card}>

                                {/* Image */}
                                <View style={styles.imgWrap}>
                                    <Image source={{ uri: item.productImage }} style={styles.productImg} />
                                </View>

                                {/* Info */}
                                <View style={styles.cardBody}>
                                    <View style={styles.cardTop}>
                                        <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => handleDelete(item.id)}
                                            disabled={updatingId === item.id}
                                        >
                                            <Trash2 size={15} color="#ccc" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.unitPrice}>₹{item.price.toFixed(2)} per unit</Text>

                                    <View style={styles.cardBottom}>
                                        {/* Qty Controls */}
                                        <View style={styles.qtyRow}>
                                            <TouchableOpacity
                                                style={styles.qtyBtn}
                                                onPress={() => handleDecrease(item)}
                                                disabled={updatingId === item.id}
                                            >
                                                <Minus size={13} color={NAVY} />
                                            </TouchableOpacity>

                                            <View style={styles.qtyValueWrap}>
                                                {updatingId === item.id
                                                    ? <ActivityIndicator size="small" color={RED} />
                                                    : <Text style={styles.qtyText}>{item.quantity}</Text>
                                                }
                                            </View>

                                            <TouchableOpacity
                                                style={styles.qtyBtn}
                                                onPress={() => handleIncrease(item.id)}
                                                disabled={updatingId === item.id}
                                            >
                                                <Plus size={13} color={NAVY} />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Item Total */}
                                        <Text style={styles.itemTotal}>₹{item.totalPrice.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* ── Trust Badges ── */}
                        <View style={styles.trustRow}>
                            <View style={styles.trustItem}>
                                <Shield size={18} color={NAVY} />
                                <Text style={styles.trustText}>Secure{'\n'}Payment</Text>
                            </View>
                            <View style={styles.trustDivider} />
                            <View style={styles.trustItem}>
                                <Truck size={18} color={NAVY} />
                                <Text style={styles.trustText}>Free{'\n'}Delivery</Text>
                            </View>
                            <View style={styles.trustDivider} />
                            <View style={styles.trustItem}>
                                <Tag size={18} color={NAVY} />
                                <Text style={styles.trustText}>Best{'\n'}Prices</Text>
                            </View>
                        </View>

                        <View style={{ height: 16 }} />
                    </ScrollView>

                    {/* ── Order Summary ── */}
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryHeading}>Order Summary</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</Text>
                            <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Charges</Text>
                            <Text style={styles.freeText}>FREE</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Payable</Text>
                            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            activeOpacity={0.88}
                            onPress={async () => {
                                const checkoutItems = items.map(i => ({
                                    productId: i.productId,
                                    productName: i.productName,
                                    productImage: i.productImage,
                                    price: i.price,
                                    quantity: i.quantity
                                }));
                                await AsyncStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));
                                router.push('/address');
                            }}
                        >
                            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                            <ChevronRight size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f3f5',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GRAY_BG },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: GRAY_BG,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
    itemCountBadge: {
        backgroundColor: RED,
        borderRadius: 10,
        minWidth: 20, height: 20,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 5,
    },
    itemCountText: { fontSize: 11, color: '#fff', fontWeight: '800' },
    clearBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: LIGHT_RED },
    clearText: { fontSize: 12, color: RED, fontWeight: '700' },

    /* Delivery banner */
    deliveryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderBottomWidth: 1,
        borderBottomColor: '#bbf7d0',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    deliveryBannerText: { fontSize: 13, color: '#166534' },
    deliveryBold: { fontWeight: '800' },

    /* Empty */
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyCircleOuter: {
        width: 130, height: 130, borderRadius: 65,
        backgroundColor: LIGHT_RED,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 28,
    },
    emptyCircleInner: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#fecaca',
        justifyContent: 'center', alignItems: 'center',
    },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 10 },
    emptySub: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    shopBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: RED,
        paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: 14,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    /* List */
    list: { flex: 1 },
    listContent: { padding: 14, paddingTop: 12 },

    /* Card */
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 12,
        marginBottom: 12,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        maxWidth: 680,
        width: '100%',
        alignSelf: 'center',
    },
    imgWrap: {
        width: 88, height: 88,
        borderRadius: 14,
        backgroundColor: GRAY_BG,
        overflow: 'hidden',
    },
    productImg: { width: '100%', height: '100%', resizeMode: 'cover' },

    cardBody: { flex: 1, marginLeft: 12 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    productName: { flex: 1, fontSize: 14, fontWeight: '700', color: NAVY, lineHeight: 20, marginRight: 8 },
    deleteBtn: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: '#f9fafb',
        justifyContent: 'center', alignItems: 'center',
    },
    unitPrice: { fontSize: 12, color: '#aaa', marginTop: 3, marginBottom: 12 },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    /* Qty */
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
    },
    qtyBtn: {
        width: 32, height: 32,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: GRAY_BG,
    },
    qtyValueWrap: {
        width: 34, height: 32,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#fff',
    },
    qtyText: { fontSize: 14, fontWeight: '800', color: NAVY },
    itemTotal: { fontSize: 16, fontWeight: '800', color: NAVY },

    /* Trust badges */
    trustRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'space-around',
        maxWidth: 680, width: '100%', alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    trustItem: { alignItems: 'center', flex: 1 },
    trustText: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 5, lineHeight: 15 },
    trustDivider: { width: 1, height: 36, backgroundColor: '#f0f0f0' },

    /* Summary */
    summaryBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        maxWidth: 680, width: '100%', alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 8,
    },
    summaryHeading: {
        fontSize: 12, fontWeight: '800', color: '#aaa',
        textTransform: 'uppercase', letterSpacing: 1.2,
        marginBottom: 14,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 14, color: '#666' },
    summaryValue: { fontSize: 14, fontWeight: '700', color: NAVY },
    freeText: { fontSize: 14, fontWeight: '800', color: '#16a34a' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: NAVY },
    totalValue: { fontSize: 22, fontWeight: '900', color: RED },

    checkoutBtn: {
        backgroundColor: RED,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 54,
        borderRadius: 14,
        gap: 6,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});