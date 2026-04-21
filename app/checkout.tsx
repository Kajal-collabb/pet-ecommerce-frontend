import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform, Image
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, MapPin, Tag, CreditCard, Truck, ShoppingBag, CheckCircle, ShieldCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const NAVY = '#1a2744';
const RED = '#dc2626';
const LIGHT_BG = '#f4f6f8';
const GREEN = '#059669';

export default function CheckoutScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [coupons, setCoupons] = useState([]);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [paymentMode, setPaymentMode] = useState('ONLINE'); // ONLINE or COD
    const [addressId, setAddressId] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchCoupons();
        loadCheckoutItems();
    }, []);

    const loadCheckoutItems = async () => {
        try {
            const storedItems = await AsyncStorage.getItem('checkoutItems');
            if (storedItems) {
                setItems(JSON.parse(storedItems));
            }
        } catch (error) {
            console.error("Error loading checkout items:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSelectedAddress();
        }, [])
    );

    const fetchSelectedAddress = async () => {
        try {
            const token = await getToken();
            const response = await api.get('/address/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const addresses = response.data;
                if (addresses && addresses.length > 0) {
                    const savedId = await AsyncStorage.getItem('selectedAddressId');
                    let addr = null;
                    if (savedId) {
                        addr = addresses.find(a => a.id.toString() === savedId);
                    }
                    if (!addr) {
                        addr = addresses[0]; // Fallback to the first available address
                    }
                    setAddressId(addr.id);
                    setSelectedAddress(addr);
                }
            }
        } catch (error) {
            console.log('Error fetching addresses for checkout:', error);
        }
    };

    const getToken = async () => {
        const session = await AsyncStorage.getItem('user_session');
        return session ? JSON.parse(session).token : null;
    };

    const fetchCoupons = async () => {
        try {
            const token = await getToken();
            const response = await api.get('/coupons/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                setCoupons(response.data);
            }
        } catch (error) {
            console.log('Error fetching coupons:', error);
            setCoupons([]);
        } finally {
            setPageLoading(false);
        }
    };

    // Calculations
    const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    
    if (selectedCoupon && itemTotal >= selectedCoupon.minAmount) {
        // Applying percentage discount as per the example given by user
        discountAmount = (itemTotal * selectedCoupon.discount) / 100;
    }
    const finalAmount = itemTotal - discountAmount;

    const handleApplyCouponText = () => {
        const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
        if (coupon) {
            applyCoupon(coupon);
        } else {
            showAlert("Invalid Coupon", "Please enter a valid coupon code.");
        }
    };

    const applyCoupon = (c) => {
        if (itemTotal >= c.minAmount) {
            setSelectedCoupon(c);
            setCouponCode(c.code);
            showAlert("Success", `Coupon '${c.code}' applied successfully!`);
        } else {
            showAlert("Error", `Minimum order amount should be ₹${c.minAmount}`);
        }
    };

    const handleRemoveCoupon = () => {
        setSelectedCoupon(null);
        setCouponCode('');
    };

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
        else Alert.alert(title, message);
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            
            if (!addressId) {
                showAlert("Error", "Please select a delivery address.");
                setLoading(false);
                return;
            }

            // Construct payload matching exact backend requirement
            const orderPayload = {
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                paymentMode: paymentMode,
                couponCode: selectedCoupon ? selectedCoupon.code : null,
                addressId: addressId
            };

            const response = await api.post('/orders', orderPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                const orderData = response.data;
                
                if (paymentMode === 'COD') {
                    showAlert("Success", "Order placed successfully!");
                    router.push('/dashboard');
                } else {
                    // Online Razorpay Flow
                    await initiateRazorpayPayment(orderData.id);
                }
            }
        } catch (error) {
            console.error("Order creation failed", error);
            showAlert("Error", "Failed to place order. Please try again.");
            setLoading(false);
        }
    };

    const initiateRazorpayPayment = async (orderId) => {
        try {
            const token = await getToken();
            // Create payment intent on backend
            const createPaymentRes = await api.post(`/payment/create/${orderId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const rzpDetails = createPaymentRes.data; 
            
            // NOTE: Here you would integrate actual 'react-native-razorpay' SDK.
            // For now, we simulate a successful SDK callback payload for the UI.
            setTimeout(() => {
                const mockSdkResponse = {
                    razorpay_order_id: rzpDetails.id || "order_mock_id",
                    razorpay_payment_id: "pay_mock_id",
                    razorpay_signature: "sig_mock_hash"
                };
                verifyPayment(mockSdkResponse);
            }, 1500);
            
        } catch (error) {
            setLoading(false);
            showAlert("Error", "Failed to initiate payment gateway.");
        }
    };

    const verifyPayment = async (paymentData) => {
        try {
            const token = await getToken();
            // Verify payment
            const response = await api.post('/payment/verify', paymentData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.status === 200) {
                showAlert("Payment Successful", "Your order has been confirmed!");
                router.push('/dashboard');
            }
        } catch (error) {
            showAlert("Payment Failed", "Verification failed. If money was deducted, it will be refunded.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={RED} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
                    <ArrowLeft size={24} color={NAVY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.pageContainer}>
                {/* 1. Address Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.row}>
                            <MapPin size={20} color={NAVY} />
                            <Text style={styles.cardTitle}>Delivery Address</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/address')}>
                            <Text style={styles.changeText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {selectedAddress ? (
                        <View style={styles.addressBox}>
                            <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                            <Text style={styles.addressText}>{selectedAddress.addressLine1}</Text>
                            <Text style={styles.addressText}>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</Text>
                            <Text style={styles.addressPhone}>+91 {selectedAddress.phoneNumber}</Text>
                        </View>
                    ) : (
                        <View style={[styles.addressBox, { justifyContent: 'center', alignItems: 'center', paddingVertical: 24 }]}>
                            <Text style={styles.addressText}>No address selected.</Text>
                            <TouchableOpacity onPress={() => router.push('/address')} style={{ marginTop: 8 }}>
                                <Text style={styles.changeText}>Add/Select Address</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 2. Order Summary Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.row}>
                            <ShoppingBag size={20} color={NAVY} />
                            <Text style={styles.cardTitle}>Order Summary</Text>
                        </View>
                        <Text style={styles.itemsCountText}>{items.length} Items</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={[styles.itemRow, index === items.length - 1 && { borderBottomWidth: 0 }]}>
                            <Image source={{ uri: item.productImage }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                                <View style={styles.itemMetaRow}>
                                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 3. Coupon Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.row}>
                            <Tag size={20} color={NAVY} />
                            <Text style={styles.cardTitle}>Apply Coupon</Text>
                        </View>
                    </View>

                    {selectedCoupon ? (
                        <View style={styles.appliedCouponBox}>
                            <View style={styles.row}>
                                <CheckCircle size={24} color={GREEN} />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.appliedCouponText}>'{selectedCoupon.code}' applied</Text>
                                    <Text style={styles.savingText}>You saved ₹{discountAmount.toFixed(2)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeBtn}>
                                <Text style={styles.removeCouponText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.couponInputBox}>
                            <TextInput 
                                style={styles.couponInput}
                                placeholder="Enter coupon code"
                                placeholderTextColor="#94a3b8"
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity 
                                style={[styles.applyBtn, !couponCode.trim() && styles.applyBtnDisabled]} 
                                onPress={handleApplyCouponText}
                                disabled={!couponCode.trim()}
                            >
                                <Text style={styles.applyBtnText}>APPLY</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Available Coupons List */}
                    {!selectedCoupon && coupons.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.couponsList}>
                            {coupons.map(c => (
                                <TouchableOpacity 
                                    key={c.id} 
                                    style={styles.miniCoupon} 
                                    onPress={() => applyCoupon(c)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.miniCouponCode}>{c.code}</Text>
                                    <Text style={styles.miniCouponDesc}>Save {c.discount}% on orders above ₹{c.minAmount}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* 4. Payment Options Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.row}>
                            <CreditCard size={20} color={NAVY} />
                            <Text style={styles.cardTitle}>Payment Method</Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.paymentOption, paymentMode === 'ONLINE' && styles.paymentOptionSelected]} 
                        onPress={() => setPaymentMode('ONLINE')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.row}>
                            <View style={[styles.radioOut, paymentMode === 'ONLINE' && styles.radioOutSelected]}>
                                {paymentMode === 'ONLINE' && <View style={styles.radioIn} />}
                            </View>
                            <View>
                                <Text style={styles.paymentText}>Pay Online</Text>
                                <Text style={styles.paymentSub}>UPI, Cards, NetBanking, Wallets</Text>
                            </View>
                        </View>
                        <ShieldCheck size={24} color={GREEN} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.paymentOption, paymentMode === 'COD' && styles.paymentOptionSelected, { marginBottom: 0 }]} 
                        onPress={() => setPaymentMode('COD')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.row}>
                            <View style={[styles.radioOut, paymentMode === 'COD' && styles.radioOutSelected]}>
                                {paymentMode === 'COD' && <View style={styles.radioIn} />}
                            </View>
                            <View>
                                <Text style={styles.paymentText}>Cash on Delivery</Text>
                                <Text style={styles.paymentSub}>Pay at your doorstep</Text>
                            </View>
                        </View>
                        <Truck size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* 5. Price Details Section */}
                <View style={styles.card}>
                    <Text style={[styles.cardTitle, { marginBottom: 16, marginLeft: 0 }]}>Price Details</Text>
                    
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Item Total</Text>
                        <Text style={styles.priceValue}>₹{itemTotal.toFixed(2)}</Text>
                    </View>
                    
                    {discountAmount > 0 && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Coupon Discount</Text>
                            <Text style={styles.priceValueDiscount}>- ₹{discountAmount.toFixed(2)}</Text>
                        </View>
                    )}
                    
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Delivery Fee</Text>
                        <Text style={styles.priceValueFree}>FREE</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.priceRow}>
                        <Text style={styles.grandTotalLabel}>Grand Total</Text>
                        <Text style={styles.grandTotalValue}>₹{finalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Checkout Action Card */}
                <View style={styles.checkoutActionCard}>
                    <View style={styles.bottomBarInfo}>
                        <Text style={styles.bottomTotalLabel}>Total Amount</Text>
                        <Text style={styles.bottomTotalValue}>₹{finalAmount.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.placeOrderBtn} 
                        onPress={handlePlaceOrder} 
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.placeOrderBtnText}>
                                {paymentMode === 'ONLINE' ? 'Pay Now' : 'Place Order'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BG },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LIGHT_BG },
    
    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
    
    // Layout
    pageContainer: { maxWidth: 680, width: '100%', alignSelf: 'center', padding: 16, paddingBottom: 32 },
    
    // Cards
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16,
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: NAVY, marginLeft: 10 },
    
    // Address
    changeText: { color: RED, fontWeight: '700', fontSize: 14 },
    addressBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    addressName: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 6 },
    addressText: { fontSize: 13, color: '#475569', lineHeight: 20 },
    addressPhone: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 8 },
    
    // Items
    itemsCountText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    itemRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    itemImage: { width: 65, height: 65, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    itemDetails: { flex: 1, marginLeft: 14, justifyContent: 'space-between', paddingVertical: 2 },
    itemName: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 4, lineHeight: 20 },
    itemMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemQty: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    itemPrice: { fontSize: 16, fontWeight: '800', color: NAVY },
    
    // Coupons
    couponInputBox: { flexDirection: 'row', alignItems: 'center' },
    couponInput: { flex: 1, height: 48, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 16, backgroundColor: '#f8fafc', fontSize: 15, fontWeight: '600', color: NAVY },
    applyBtn: { marginLeft: 12, backgroundColor: NAVY, paddingHorizontal: 22, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    applyBtnDisabled: { backgroundColor: '#94a3b8' },
    applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    appliedCouponBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ecfdf5', borderWidth: 1.5, borderColor: '#6ee7b7', borderRadius: 12, padding: 16 },
    appliedCouponText: { fontSize: 15, fontWeight: '800', color: GREEN },
    savingText: { fontSize: 13, color: '#047857', marginTop: 4, fontWeight: '600' },
    removeBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    removeCouponText: { color: RED, fontWeight: '700', fontSize: 13 },
    couponsList: { marginTop: 16 },
    miniCoupon: { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', borderRadius: 10, padding: 12, marginRight: 12, width: 220 },
    miniCouponCode: { fontSize: 14, fontWeight: '800', color: '#1d4ed8', marginBottom: 4 },
    miniCouponDesc: { fontSize: 12, color: '#3b82f6', fontWeight: '500', lineHeight: 18 },
    
    // Payment Options
    paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, marginBottom: 12, backgroundColor: '#fff' },
    paymentOptionSelected: { borderColor: RED, backgroundColor: '#fff5f5' },
    radioOut: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    radioOutSelected: { borderColor: RED },
    radioIn: { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },
    paymentText: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 3 },
    paymentSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    
    // Price Details
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    priceLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    priceValue: { fontSize: 15, fontWeight: '700', color: NAVY },
    priceValueDiscount: { fontSize: 15, fontWeight: '700', color: GREEN },
    priceValueFree: { fontSize: 15, fontWeight: '800', color: GREEN },
    divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
    grandTotalLabel: { fontSize: 16, fontWeight: '800', color: NAVY },
    grandTotalValue: { fontSize: 20, fontWeight: '900', color: NAVY },
    
    // Checkout Action Card
    checkoutActionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', shadowColor: '#64748b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
    bottomBarInfo: { flex: 1 },
    bottomTotalLabel: { fontSize: 13, color: '#64748b', fontWeight: '700', marginBottom: 4 },
    bottomTotalValue: { fontSize: 22, fontWeight: '900', color: NAVY },
    placeOrderBtn: { backgroundColor: RED, paddingHorizontal: 36, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
    placeOrderBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});
