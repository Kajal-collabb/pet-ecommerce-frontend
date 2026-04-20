import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Tag, CreditCard, ShoppingBag, Check, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const NAVY = '#1a2744';
const RED = '#dc2626';
const GRAY_BG = '#f2f3f5';
const LIGHT_RED = '#fff5f5';
const BORDER = '#e5e7eb';

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);

    const [address, setAddress] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [coupons, setCoupons] = useState([]);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('COD');

    const addressId = params.addressId;

    useEffect(() => {
        loadData();
    }, []);

    const getToken = async () => {
        const session = await AsyncStorage.getItem('user_session');
        return session ? JSON.parse(session).token : null;
    };

    const loadData = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // fetch address
            const addrRes = await api.get('/address/all', { headers });
            const allAddresses = Array.isArray(addrRes.data) ? addrRes.data : [];
            const selected = allAddresses.find(a => String(a.id) === String(addressId)) || allAddresses[0];
            setAddress(selected);

            // fetch cart items - adjust this endpoint to your cart API
            const cartRes = await api.get('/cart', { headers });
            setCartItems(Array.isArray(cartRes.data) ? cartRes.data : []);

            // fetch coupons
            const couponRes = await api.get('/coupons/all', { headers });
            setCoupons(Array.isArray(couponRes.data) ? couponRes.data : []);

        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const applyCoupon = () => {
        setCouponError('');
        setCouponSuccess('');
        setAppliedCoupon(null);

        const code = couponCode.trim().toUpperCase();
        if (!code) {
            setCouponError('Please enter a coupon code');
            return;
        }

        const found = coupons.find(c => c.code === code);

        if (!found) {
            setCouponError('Invalid coupon code');
            return;
        }
        if (!found.active) {
            setCouponError('This coupon is no longer active');
            return;
        }
        if (subtotal < found.minAmount) {
            setCouponError(`Minimum order of ₹${found.minAmount} required`);
            return;
        }

        const discount = Math.round((subtotal * found.discount) / 100);
        setAppliedCoupon({ ...found, discountAmount: discount });
        setCouponSuccess(`Saved ₹${discount}!`);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
        setCouponSuccess('');
    };

    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalAmount = subtotal - discountAmount;

    const placeOrder = async () => {
        if (!address) {
            showAlert('Error', 'No address selected');
            return;
        }
        if (cartItems.length === 0) {
            showAlert('Error', 'Your cart is empty');
            return;
        }

        setPlacing(true);
        try {
            const token = await getToken();
            const body = {
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                paymentMode: paymentMethod,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                addressId: address.id,
            };

            const response = await api.post('/orders', body, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                const order = response.data;
                showAlert('Order Placed!', `Order #${order.id} placed successfully. Total: ₹${order.finalAmount}`);
                router.replace('/orders');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to place order. Try again.';
            showAlert('Error', msg);
        } finally {
            setPlacing(false);
        }
    };

    const showAlert = (title, msg) => {
        if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
        else Alert.alert(title, msg);
    };

    if (loading) {
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={NAVY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Place Order</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.pageContainer}>

                    {/* Address Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <MapPin size={16} color={RED} />
                            </View>
                            <Text style={styles.cardTitle}>Delivery Address</Text>
                        </View>

                        {address ? (
                            <View style={styles.cardBody}>
                                <Text style={styles.addrName}>{address.fullName}</Text>
                                <Text style={styles.addrPhone}>{address.phoneNumber}</Text>
                                <Text style={styles.addrLine}>
                                    {address.addressLine1}, {address.city}, {address.state} - {address.pincode}, {address.country}
                                </Text>
                                <TouchableOpacity
                                    style={styles.changeBtn}
                                    onPress={() => router.push('/address')}
                                >
                                    <Text style={styles.changeBtnText}>Change Address</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.cardBody}>
                                <Text style={styles.emptyText}>No address selected</Text>
                                <TouchableOpacity style={styles.changeBtn} onPress={() => router.push('/address')}>
                                    <Text style={styles.changeBtnText}>Select Address</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Order Items Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <ShoppingBag size={16} color={RED} />
                            </View>
                            <Text style={styles.cardTitle}>Order Items</Text>
                            <Text style={styles.itemCount}>{cartItems.length} items</Text>
                        </View>

                        <View style={styles.cardBody}>
                            {cartItems.length === 0 ? (
                                <Text style={styles.emptyText}>No items in cart</Text>
                            ) : (
                                cartItems.map((item, index) => (
                                    <View
                                        key={item.productId}
                                        style={[
                                            styles.itemRow,
                                            index === cartItems.length - 1 && styles.itemRowLast
                                        ]}
                                    >
                                        {item.productImage ? (
                                            <Image source={{ uri: item.productImage }} style={styles.itemImg} />
                                        ) : (
                                            <View style={styles.itemImgPlaceholder} />
                                        )}
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                                            <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                                        </View>
                                        <Text style={styles.itemPrice}>
                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    {/* Coupon Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Tag size={16} color={RED} />
                            </View>
                            <Text style={styles.cardTitle}>Apply Coupon</Text>
                        </View>

                        <View style={styles.cardBody}>
                            {appliedCoupon ? (
                                // Coupon Applied State
                                <View style={styles.couponApplied}>
                                    <View>
                                        <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                                        <Text style={styles.couponAppliedSaving}>
                                            You saved ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}!
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={removeCoupon}>
                                        <Text style={styles.removeText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                // Coupon Input State
                                <>
                                    <View style={styles.couponRow}>
                                        <TextInput
                                            style={styles.couponInput}
                                            placeholder="Enter coupon code"
                                            placeholderTextColor="#aaa"
                                            value={couponCode}
                                            onChangeText={text => {
                                                setCouponCode(text.toUpperCase());
                                                setCouponError('');
                                                setCouponSuccess('');
                                            }}
                                            autoCapitalize="characters"
                                        />
                                        <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon}>
                                            <Text style={styles.applyBtnText}>Apply</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {couponError ? (
                                        <Text style={styles.couponError}>{couponError}</Text>
                                    ) : null}

                                    {couponSuccess ? (
                                        <Text style={styles.couponSuccessText}>{couponSuccess}</Text>
                                    ) : null}

                                    {coupons.length > 0 && (
                                        <View style={styles.availCoupons}>
                                            <Text style={styles.availLabel}>Available:</Text>
                                            <View style={styles.couponPillsRow}>
                                                {coupons.filter(c => c.active).map(c => (
                                                    <TouchableOpacity
                                                        key={c.id}
                                                        style={styles.couponPill}
                                                        onPress={() => {
                                                            setCouponCode(c.code);
                                                            setCouponError('');
                                                        }}
                                                    >
                                                        <Text style={styles.couponPillCode}>{c.code}</Text>
                                                        <Text style={styles.couponPillDesc}>
                                                            {c.discount}% off above ₹{c.minAmount}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    {/* Payment Method Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <CreditCard size={16} color={RED} />
                            </View>
                            <Text style={styles.cardTitle}>Payment Method</Text>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.payOptions}>

                                <TouchableOpacity
                                    style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionSelected]}
                                    onPress={() => setPaymentMethod('COD')}
                                >
                                    <View style={styles.payTop}>
                                        <Text style={styles.payEmoji}>💵</Text>
                                        {paymentMethod === 'COD' && (
                                            <View style={styles.selectedDot} />
                                        )}
                                    </View>
                                    <Text style={styles.payName}>Cash on Delivery</Text>
                                    <Text style={styles.payDesc}>Pay when order arrives</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.payOption, paymentMethod === 'UPI' && styles.payOptionSelected]}
                                    onPress={() => setPaymentMethod('UPI')}
                                >
                                    <View style={styles.payTop}>
                                        <Text style={styles.payEmoji}>📱</Text>
                                        {paymentMethod === 'UPI' && (
                                            <View style={styles.selectedDot} />
                                        )}
                                    </View>
                                    <Text style={styles.payName}>UPI</Text>
                                    <Text style={styles.payDesc}>GPay, PhonePe, Paytm</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </View>

                    {/* Price Summary Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Check size={16} color={RED} />
                            </View>
                            <Text style={styles.cardTitle}>Price Summary</Text>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>
                                    Subtotal ({cartItems.length} items)
                                </Text>
                                <Text style={styles.priceValue}>
                                    ₹{subtotal.toLocaleString('en-IN')}
                                </Text>
                            </View>

                            {appliedCoupon && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.discountLabel}>
                                        Coupon ({appliedCoupon.code})
                                    </Text>
                                    <Text style={styles.discountValue}>
                                        -₹{discountAmount.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Delivery</Text>
                                <Text style={styles.freeText}>FREE</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Total to Pay</Text>
                                <Text style={styles.totalValue}>
                                    ₹{finalAmount.toLocaleString('en-IN')}
                                </Text>
                            </View>

                            {appliedCoupon && (
                                <View style={styles.savingsBanner}>
                                    <Text style={styles.savingsText}>
                                        You are saving ₹{discountAmount.toLocaleString('en-IN')} on this order!
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Place Order Button */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerTotal}>₹{finalAmount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.footerMethod}>{paymentMethod}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
                    onPress={placeOrder}
                    disabled={placing}
                >
                    {placing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.placeBtnText}>Place Order</Text>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: GRAY_BG,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: GRAY_BG,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backBtn: {
        marginRight: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: NAVY,
    },

    // Page layout
    pageContainer: {
        maxWidth: 680,
        width: '100%',
        alignSelf: 'center',
        padding: 16,
        paddingBottom: 20,
    },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        gap: 10,
    },
    iconBox: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: LIGHT_RED,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: NAVY,
        flex: 1,
    },
    itemCount: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    cardBody: {
        padding: 16,
    },

    // Address
    addrName: {
        fontSize: 15,
        fontWeight: '700',
        color: NAVY,
        marginBottom: 3,
    },
    addrPhone: {
        fontSize: 13,
        color: '#888',
        marginBottom: 5,
    },
    addrLine: {
        fontSize: 13,
        color: '#555',
        lineHeight: 20,
    },
    changeBtn: {
        marginTop: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: RED,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    changeBtnText: {
        color: RED,
        fontSize: 13,
        fontWeight: '600',
    },
    emptyText: {
        color: '#999',
        fontSize: 13,
    },

    // Items
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        gap: 12,
    },
    itemRowLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    itemImg: {
        width: 50,
        height: 50,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    itemImgPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: GRAY_BG,
        borderWidth: 1,
        borderColor: BORDER,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: NAVY,
        marginBottom: 3,
    },
    itemQty: {
        fontSize: 12,
        color: '#888',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: NAVY,
    },

    // Coupon
    couponRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    couponInput: {
        flex: 1,
        height: 46,
        borderWidth: 1.5,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 14,
        color: NAVY,
        backgroundColor: '#fafafa',
        letterSpacing: 1,
    },
    applyBtn: {
        height: 46,
        paddingHorizontal: 20,
        backgroundColor: NAVY,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    couponError: {
        color: RED,
        fontSize: 12,
        marginBottom: 8,
    },
    couponSuccessText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    couponApplied: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    couponAppliedCode: {
        fontSize: 14,
        fontWeight: '800',
        color: '#166534',
        marginBottom: 3,
    },
    couponAppliedSaving: {
        fontSize: 12,
        color: '#166534',
    },
    removeText: {
        color: RED,
        fontSize: 13,
        fontWeight: '600',
    },
    availCoupons: {
        marginTop: 8,
    },
    availLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    couponPillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    couponPill: {
        borderWidth: 1,
        borderColor: RED,
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: LIGHT_RED,
    },
    couponPillCode: {
        color: RED,
        fontSize: 13,
        fontWeight: '700',
    },
    couponPillDesc: {
        color: RED,
        fontSize: 11,
        marginTop: 2,
        opacity: 0.8,
    },

    // Payment
    payOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    payOption: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 14,
    },
    payOptionSelected: {
        borderColor: RED,
        backgroundColor: LIGHT_RED,
    },
    payTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    payEmoji: {
        fontSize: 24,
    },
    selectedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: RED,
    },
    payName: {
        fontSize: 13,
        fontWeight: '700',
        color: NAVY,
        marginBottom: 3,
    },
    payDesc: {
        fontSize: 11,
        color: '#888',
    },

    // Price Summary
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    priceLabel: {
        fontSize: 13,
        color: '#666',
    },
    priceValue: {
        fontSize: 13,
        color: NAVY,
        fontWeight: '600',
    },
    discountLabel: {
        fontSize: 13,
        color: RED,
    },
    discountValue: {
        fontSize: 13,
        color: RED,
        fontWeight: '600',
    },
    freeText: {
        fontSize: 13,
        color: '#16a34a',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: BORDER,
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: NAVY,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: NAVY,
    },
    savingsBanner: {
        marginTop: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    savingsText: {
        fontSize: 12,
        color: '#166534',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: BORDER,
        gap: 16,
        maxWidth: 680,
        width: '100%',
        alignSelf: 'center',
    },
    footerInfo: {
        flex: 1,
    },
    footerTotal: {
        fontSize: 18,
        fontWeight: '800',
        color: NAVY,
    },
    footerMethod: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    placeBtn: {
        backgroundColor: RED,
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    placeBtnDisabled: {
        opacity: 0.7,
    },
    placeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});