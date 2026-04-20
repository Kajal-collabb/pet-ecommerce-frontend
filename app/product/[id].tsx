import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, ActivityIndicator, SafeAreaView,
    Dimensions, TextInput, Alert, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Plus, Minus, MapPin, Truck, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

const ProductDetails = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchProductDetails();
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            const response = await api.get(`/products/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                setProduct(response.data);
            }
        } catch (error) {
            console.error("Fetch Product Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ff724c" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.centerContainer}>
                <Text>Product not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1a2744" />
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Heart size={22} color="#1a2744" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.mainWrapper}>
                    {/* Product Image */}
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: product.photoUrl }} style={styles.productImage} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.productName}>{product.name}</Text>
                        
                        {/* Rating Badge */}
                        <View style={styles.badgeContainer}>
                            <View style={styles.ratingBadge}>
                                <Star size={14} color="#fff" fill="#fff" />
                                <Text style={styles.ratingText}>{product.rating} </Text>
                            </View>
                        </View>

                        <Text style={styles.description}>{product.description}</Text>

                        {/* Price Section */}
                        <View style={styles.priceSection}>
                            <View style={styles.priceRow}>
                                <Text style={styles.mrpLabel}>MRP : </Text>
                                <Text style={styles.mrpPrice}>₹{product.actualPrice}</Text>
                                <Text style={styles.sellingPrice}>₹{product.price}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{product.discount}% OFF</Text>
                                </View>
                            </View>
                            <Text style={styles.taxText}>incl. of all taxes calculated at checkout.</Text>
                            
                            {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                                <Text style={styles.lowStockWarning}>Only {product.stockQuantity} left in stock!</Text>
                            )}
                            {product.stockQuantity === 0 && (
                                <Text style={styles.outOfStockLabel}>Currently Unavailable</Text>
                            )}
                        </View>

                        {/* Delivery Section */}
                        <View style={styles.deliverySection}>
                            <View style={styles.deliveryRow}>
                                <Truck size={20} color="#666" />
                                <Text style={styles.deliveryText}>
                                    Expected Delivery Date <Text style={styles.boldText}>Sat, 25th Apr</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomWrapper}>
                <View style={styles.bottomBar}>
                    {product.stockQuantity > 0 ? (
                        <>
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity 
                                    onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                                    style={styles.qtyBtn}
                                >
                                    <Minus size={18} color="#666" />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{quantity}</Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                        console.log("Current Qty:", quantity, "Stock:", product.stockQuantity);
                                        if (quantity < product.stockQuantity) {
                                            setQuantity(quantity + 1);
                                        } else {
                                            if (Platform.OS === 'web') {
                                                alert(`Limit Reached: Sorry, only ${product.stockQuantity} units available.`);
                                            } else {
                                                Alert.alert("Limit Reached", `Sorry, only ${product.stockQuantity} units available.`);
                                            }
                                        }
                                    }}
                                    style={styles.qtyBtn}
                                >
                                    <Plus size={18} color={quantity >= product.stockQuantity ? "#ccc" : "#666"} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.addCartBtn}>
                                <Text style={styles.addCartText}>Add to Bag</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.outOfStockFull}>
                            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                        </View>
                    )}
                </View>
                
                {product.stockQuantity > 0 && (
                    <TouchableOpacity style={styles.buyNowBtn}>
                        <Text style={styles.buyNowText}>BUY NOW</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    scrollContent: {
        alignItems: 'center',
    },
    mainWrapper: {
        width: '100%',
        maxWidth: 1000,
    },
    bottomWrapper: {
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    imageContainer: {
        width: '100%',
        height: 350,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    content: {
        padding: 20,
    },
    productName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2744',
        marginBottom: 10,
    },
    badgeContainer: {
        marginBottom: 15,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        backgroundColor: '#16a34a', // Green for rating
    },
    ratingText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
        marginLeft: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 20,
    },
    priceSection: {
        marginBottom: 25,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    mrpLabel: {
        fontSize: 16,
        color: '#666',
    },
    mrpPrice: {
        fontSize: 16,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 10,
    },
    sellingPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
        marginRight: 10,
    },
    discountBadge: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    taxText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    deliverySection: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    deliveryText: {
        fontSize: 14,
        color: '#444',
        marginLeft: 10,
    },
    boldText: {
        fontWeight: '700',
        color: '#000',
    },
    bottomBar: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 45,
        marginRight: 15,
    },
    qtyBtn: {
        padding: 5,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '700',
        marginHorizontal: 15,
    },
    addCartBtn: {
        flex: 1,
        height: 45,
        borderWidth: 1,
        borderColor: '#dc2626',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCartText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '700',
    },
    buyNowBtn: {
        backgroundColor: '#dc2626',
        marginHorizontal: 20,
        marginBottom: 20,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyNowText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    lowStockWarning: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 10,
    },
    outOfStockLabel: {
        color: '#999',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 10,
    },
    outOfStockFull: {
        flex: 1,
        height: 50,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    outOfStockText: {
        color: '#9ca3af',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default ProductDetails;
