import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, SafeAreaView, Image,
    ScrollView, Dimensions, Text,
    FlatList, ActivityIndicator, Alert, TouchableOpacity, useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from './components/nav';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import api from "../utils/api";

const { width } = Dimensions.get('window');

export default function DashboardPage() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topSelling, setTopSelling] = useState([]);
    const [topSellingLoading, setTopSellingLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
        fetchTopSelling();
    }, []);

    const fetchCategories = async () => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            if (!token) {
                console.error("No token found");
                return;
            }

            const response = await api.get("/categories/all?page=0&size=10", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setCategories(response.data.content || []);
            } else {
                console.error("Failed to fetch categories:", response.data);
            }
        } catch (error) {
            console.error("Category Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopSelling = async () => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            if (!token) return;

            const response = await api.get("/orders/top/selling?limit=10", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setTopSelling(response.data || []);
            }
        } catch (error) {
            console.error("Top Selling Fetch Error:", error);
        } finally {
            setTopSellingLoading(false);
        }
    };

    const handleCategoryPress = (item) => {
        const route = item.name.toLowerCase().replace(/\s+/g, '');
        // Map routes to existing files if they don't match exactly
        const routeMap = {
            'smallpets': 'small',
            'dog': 'dog',
            'cat': 'cat',
            'birds': 'birds',
            'aqua': 'aqua'
        };
        const targetRoute = routeMap[route] || route;

        router.push({
            pathname: `/${targetRoute}`,
            params: {
                categoryId: item.id,
                categoryName: item.name,
                categoryImage: item.photoUrl
            }
        });
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.categoryCircle}>
                <Image
                    source={{ uri: item.photoUrl }}
                    style={styles.categoryImage}
                />
            </View>
            <Text style={styles.categoryLabel}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderTopSellingItem = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/product/${item.id}`)}
            style={[
                styles.productCard,
                { marginLeft: index === 0 ? 15 : 0, marginRight: 15 }
            ]}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.photoUrl }} style={styles.productImage} />
            </View>

            <View style={styles.productInfo}>
                <View>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.productWeight}>1 unit</Text>

                    <View style={styles.priceRow}>
                        {item.discount > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{item.discount}% OFF</Text>
                            </View>
                        )}
                        <View style={styles.priceContainer}>
                            <Text style={styles.currentPrice}>₹{item.price}</Text>
                            {item.actualPrice > item.price && (
                                <Text style={styles.oldPrice}>₹{item.actualPrice}</Text>
                            )}
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.addCartBtn}>
                    <Text style={styles.addCartText}>Add to Bag</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Banner Area */}
                <View style={[styles.bannerContainer, isMobile && { marginHorizontal: 15 }]}>
                    <Image
                        source={require('../assets/pug2.png')}
                        style={[styles.heroImage, isMobile && { height: 180 }]}
                        resizeMode="cover"
                    />
                </View>

                {/* Categories Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Shop by Category</Text>
                    {loading ? (
                        <ActivityIndicator color="#ff724c" style={{ marginVertical: 20 }} />
                    ) : (
                        <FlatList
                            data={categories}
                            renderItem={renderCategoryItem}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryList}
                        />
                    )}
                </View>

                {/* Top Selling Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Top Selling Products</Text>
                    {topSellingLoading ? (
                        <ActivityIndicator color="#ff724c" style={{ marginVertical: 20 }} />
                    ) : (
                        <FlatList
                            data={topSelling}
                            renderItem={renderTopSellingItem}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.topSellingList}
                        />
                    )}
                </View>

                {/* Placeholder for more content */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    bannerContainer: {
        marginTop: 20,
        marginHorizontal: 50,
        backgroundColor: '#fff',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        height: Math.min(width * 0.35, 450), // Cap the max height for large screens
        borderRadius: 30,
    },
    sectionContainer: {
        marginTop: 25,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#1a2744',
        marginBottom: 20,
    },
    categoryList: {
        paddingVertical: 15,
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 10,
    },
    categoryItem: {
        alignItems: 'center',
        marginHorizontal: 15,
    },
    categoryCircle: {
        width: 120,
        height: 120,
        borderRadius: 70,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff724c',
        // Premium floating shadow
        shadowColor: '#ff724c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    categoryImage: {
        width: '140%',
        height: '140%',
        resizeMode: 'cover',
    },
    categoryLabel: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '700',
        color: '#1a2744',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    topSellingList: {
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    productCard: {
        width: 230,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 10,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 15,
        backgroundColor: '#f5f7f9',
        overflow: 'hidden',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    productInfo: {
        paddingTop: 8,
        flex: 1,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a2744',
        lineHeight: 20,
        height: 40,
    },
    productWeight: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    priceRow: {
        marginTop: 8,
    },
    discountBadge: {
        backgroundColor: '#e6f4ea',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    discountText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#16a34a',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currentPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a2744',
    },
    oldPrice: {
        fontSize: 12,
        color: '#888',
        textDecorationLine: 'line-through',
        marginLeft: 4,
    },
    addCartBtn: {
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    addCartText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
