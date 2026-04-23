import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    TouchableOpacity, ActivityIndicator, SafeAreaView,
    useWindowDimensions, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, Tag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import NavBar from '../components/nav'; // Path as per your structure

const BRAND_RED = '#E63946';
const NAVY = '#1a2744';

export default function SalePage() {
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Responsive Column Logic
    const isMobile = width < 768;
    const numColumns = isMobile ? 2 : 4;
    const gap = 15;
    const cardWidth = (width - (isMobile ? 40 : 100) - (numColumns - 1) * gap) / numColumns;

    useEffect(() => {
        fetchSaleProducts();
    }, []);

    const fetchSaleProducts = async () => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            const response = await api.get("/products/discounts?page=0&size=10", {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                setProducts(response.data.content || []);
            }
        } catch (error) {
            console.error("Sale Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            {/* Discount Badge */}
            <View style={styles.badge}>
                <Tag size={12} color="#fff" />
                <Text style={styles.badgeText}>{item.discount}% OFF</Text>
            </View>

            <Image source={{ uri: item.photoUrl }} style={styles.productImg} />

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.price}>₹{item.price}</Text>
                        <Text style={styles.actualPrice}>₹{item.actualPrice}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.cartBtn}
                        onPress={() => {/* Add to Bag Logic */ }}
                    >
                        <ShoppingCart size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />

            <View style={styles.headerBanner}>
                <Text style={styles.bannerTitle}>FLASH SALE ⚡</Text>
                <Text style={styles.bannerSub}>Up to 50% off on your favorite pet supplies</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={BRAND_RED} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={numColumns}
                    key={numColumns} // Re-render when columns change
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={numColumns > 1 ? styles.row : null}
                    ListEmptyComponent={<Text style={styles.empty}>No sale items active right now.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerBanner: {
        backgroundColor: BRAND_RED,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    bannerTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    bannerSub: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 5 },
    list: { padding: 20 },
    row: { justifyContent: 'flex-start', gap: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
            android: { elevation: 3 }
        })
    },
    badge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#22c55e',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
        gap: 4
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    productImg: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
    info: { padding: 12 },
    name: { fontSize: 16, fontWeight: '700', color: NAVY },
    desc: { fontSize: 12, color: '#777', marginVertical: 6, height: 32 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    price: { fontSize: 18, fontWeight: '800', color: BRAND_RED },
    actualPrice: { fontSize: 12, color: '#bbb', textDecorationLine: 'line-through' },
    cartBtn: {
        backgroundColor: NAVY,
        padding: 8,
        borderRadius: 8,
    },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});