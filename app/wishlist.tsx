import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Platform, useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Trash2, ShoppingBag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const NAVY = '#1a2744';
const RED = '#dc2626';

export default function WishlistScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);
    const [addingToBagId, setAddingToBagId] = useState(null);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const getToken = async () => {
        const session = await AsyncStorage.getItem('user_session');
        return session ? JSON.parse(session).token : null;
    };

    const fetchWishlist = async () => {
        try {
            const token = await getToken();
            const res = await api.get('/wishlist/all?page=0&size=50', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(res.data.content || []);
        } catch (error) {
            console.error('Wishlist fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (Id) => {
        const confirm = async () => {
            console.log('Remove karne ki koshish:', Id);
            setRemovingId(Id);
            try {
                const token = await getToken();
                console.log('Token:', token);
                const res = await api.delete(`/wishlist/${Id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Delete response:', res.status);
                setItems(prev => prev.filter(item => item.id !== Id));
            } catch (error) {
                console.log('Delete error:', error.response?.status, error.response?.data);
            } finally {
                setRemovingId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Remove this item from wishlist?')) confirm();
        } else {
            Alert.alert('Remove Item', 'Remove this item from wishlist?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: confirm }
            ]);
        }
    };

    const addToBag = async (productId) => {
        setAddingToBagId(productId);
        try {
            const token = await getToken();
            const res = await api.post('/bag', { productId, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200 || res.status === 201) {
                if (Platform.OS === 'web') window.alert("Added to Bag!");
                else Alert.alert("Success", "Added to Bag!");
            }
        } catch (error) {
            console.error('Error adding to bag:', error);
            const msg = error.response?.data?.message || "Failed to add to bag.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Error", msg);
        } finally {
            setAddingToBagId(null);
        }
    };

    const clearWishlist = async () => {
        const confirm = async () => {
            try {
                const token = await getToken();
                await api.delete('/wishlist/clear', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setItems([]);
            } catch (error) {
                const msg = 'Failed to clear wishlist';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Error', msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Clear all wishlist items?')) confirm();
        } else {
            Alert.alert('Clear Wishlist', 'Remove all items?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: confirm }
            ]);
        }
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
                <Text style={styles.headerTitle}>My Wishlist</Text>
                {items.length > 0 && (
                    <TouchableOpacity onPress={clearWishlist} style={styles.clearBtn}>
                        <Text style={styles.clearText}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {items.length === 0 ? (
                // Empty State
                <View style={styles.center}>
                    <Heart size={60} color="#e5e7eb" />
                    <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                    <Text style={styles.emptySubtitle}>Save products you love here</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()}>
                        <Text style={styles.shopBtnText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.pageContainer}>
                        <View style={[styles.mainBox, isMobile && { padding: 12 }]}>
                            <View style={styles.boxHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Heart size={20} color={RED} fill={RED} style={{ marginRight: 8 }} />
                                    <Text style={styles.boxTitle}>My Favorites</Text>
                                </View>
                                <Text style={styles.countText}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
                            </View>

                            {items.map((item, index) => (
                                <View key={item.id} style={[styles.card, index === items.length - 1 && styles.lastCard]}>

                                    {/* Product Image */}
                                <TouchableOpacity onPress={() => router.push(`/products/${item.productId}`)}>
                                    <Image source={{ uri: item.productImage }} style={[styles.productImg, isMobile && { width: 90, height: 90, marginRight: 12 }]} />
                                </TouchableOpacity>

                                {/* Product Info */}
                                <View style={styles.info}>
                                    <TouchableOpacity onPress={() => router.push(`/products/${item.productId}`)}>
                                        <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.priceRow}>
                                        <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
                                        <Text style={styles.actualPrice}>₹{item.actualPrice.toLocaleString('en-IN')}</Text>
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>{item.discount}% OFF</Text>
                                        </View>
                                    </View>

                                    {/* Buttons */}
                                    <View style={styles.btnRow}>
                                        <TouchableOpacity 
                                            style={styles.addCartBtn} 
                                            onPress={() => addToBag(item.productId)}
                                            disabled={addingToBagId === item.productId}
                                        >
                                            {addingToBagId === item.productId ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <ShoppingBag size={16} color="#fff" />
                                                    <Text style={styles.addCartText}>Add to Bag</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => {
                                                console.log('Deleting id:', item.id);
                                                removeItem(item.id);
                                            }}
                                            disabled={removingId === item.id}
                                        >
                                            {removingId === item.id ? (
                                                <ActivityIndicator size="small" color={RED} />
                                            ) : (
                                                <Trash2 size={20} color={RED} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f3f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: { marginRight: 12 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: NAVY },
    clearBtn: { paddingHorizontal: 10, paddingVertical: 4 },
    clearText: { fontSize: 13, color: RED, fontWeight: '600' },

    pageContainer: {
        maxWidth: 680,
        width: '100%',
        alignSelf: 'center',
        padding: 16,
    },
    mainBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        padding: 20,
    },
    boxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    boxTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: NAVY,
    },
    countText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    lastCard: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    productImg: {
        width: 110,
        height: 110,
        borderRadius: 12,
        resizeMode: 'contain',
        backgroundColor: '#f5f6f8',
        marginRight: 16,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '800',
        color: NAVY,
        marginBottom: 6,
        lineHeight: 22,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
        color: NAVY,
    },
    actualPrice: {
        fontSize: 14,
        color: '#aaa',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#ffebeb',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    discountText: {
        color: RED,
        fontSize: 11,
        fontWeight: '800',
    },

    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    addCartBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: RED,
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    addCartText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    removeBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: NAVY,
        marginTop: 16,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        marginBottom: 24,
    },
    shopBtn: {
        backgroundColor: RED,
        borderRadius: 10,
        paddingHorizontal: 28,
        paddingVertical: 12,
    },
    shopBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});