import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    TouchableOpacity, ActivityIndicator, SafeAreaView,
    Dimensions, Platform, useWindowDimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';
import NavBar from './nav';

const { width } = Dimensions.get('window');

const CategoryView = ({ initialCategoryId, initialCategoryName }) => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Use params if available, otherwise use initial props
    const categoryId = params.categoryId || initialCategoryId;
    const categoryName = params.categoryName || initialCategoryName;

    const [subcategories, setSubcategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedSubId, setSelectedSubId] = useState(null); // null means "All Items"
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);

    const { width: windowWidth } = useWindowDimensions();
    const isMobile = windowWidth < 768;

    const numColumns = isMobile ? 2 : 5;
    const sidebarWidth = isMobile ? 0 : 170;
    const gap = 12;
    const availableWidth = windowWidth - sidebarWidth - (isMobile ? 30 : 20);
    const cardWidth = (availableWidth - (numColumns - 1) * gap) / numColumns;

    useEffect(() => {
        fetchSubcategories();
        fetchProducts(null); // Fetch "All Items" initially
    }, [categoryId]);

    const fetchSubcategories = async () => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            // Use the general subcategories endpoint as requested
            const response = await api.get(`/subcategories/all?page=0&size=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                // Handle both array response and paginated response (content field)
                const data = response.data.content || response.data || [];
                setSubcategories(data);
            }
        } catch (error) {
            console.error("Fetch Subcategories Error:", error);
        }
    };

    const fetchProducts = async (subId) => {
        setProductsLoading(true);
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            let url = `/products/category/${categoryId}?page=0&size=20`;
            if (subId) {
                url = `/products/filter?categoryId=${categoryId}&subCategoryId=${subId}&page=0&size=20`;
            }

            const response = await api.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                setProducts(response.data.content || []);
            }
        } catch (error) {
            console.error("Fetch Products Error:", error);
        } finally {
            setProductsLoading(false);
            setLoading(false);
        }
    };

    const handleSubCategoryPress = (subId) => {
        setSelectedSubId(subId);
        fetchProducts(subId);
    };

    const renderSidebarItem = ({ item }) => {
        const isActive = selectedSubId === item.id;
        return (
            <TouchableOpacity
                style={[styles.sidebarItem, isMobile && styles.sidebarItemMobile, isActive && styles.sidebarItemActive]}
                onPress={() => handleSubCategoryPress(item.id)}
            >
                {isActive && !isMobile && <View style={styles.activeIndicator} />}
                {isActive && isMobile && <View style={styles.activeIndicatorMobile} />}
                <View style={[styles.sidebarIconContainer, isMobile && styles.sidebarIconContainerMobile]}>
                    <Image
                        source={{ uri: item.photoUrl || 'https://via.placeholder.com/50' }}
                        style={styles.sidebarIcon}
                    />
                </View>
                <Text style={[styles.sidebarText, isActive && styles.sidebarTextActive]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderProductItem = ({ item, index }) => (
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/product/${item.id}`)}
            style={[
                styles.productCard, 
                { 
                    width: cardWidth,
                    marginRight: (index + 1) % numColumns === 0 ? 0 : gap 
                }
            ]}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.photoUrl }} style={styles.productImage} />
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productWeight}>1 unit</Text>

                <View style={styles.priceRow}>
                    <View>
                        {item.discount > 0 && (
                            <Text style={styles.discountText}>{item.discount}% OFF</Text>
                        )}
                        <View style={styles.priceContainer}>
                            <Text style={styles.currentPrice}>₹{item.price}</Text>
                            {item.actualPrice > item.price && (
                                <Text style={styles.oldPrice}>₹{item.actualPrice}</Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.addButton}>
                        <Plus size={20} color="#2563eb" strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff724c" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1a2744" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{categoryName}</Text>
                </View>
            </View>

            <View style={[styles.content, isMobile && { flexDirection: 'column' }]}>
                {/* Sidebar */}
                <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
                    <FlatList
                        data={[
                            {
                                id: null,
                                name: 'All Items',
                                photoUrl: params.categoryImage || 'https://via.placeholder.com/100'
                            },
                            ...subcategories
                        ]}
                        renderItem={renderSidebarItem}
                        keyExtractor={(item) => (item.id === null ? 'all' : item.id.toString())}
                        showsVerticalScrollIndicator={!isMobile}
                        showsHorizontalScrollIndicator={false}
                        horizontal={isMobile}
                    />
                </View>

                {/* Main Content */}
                <View style={styles.mainArea}>
                    {productsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#ff724c" />
                        </View>
                    ) : (
                        <FlatList
                            key={numColumns}
                            data={products}
                            renderItem={renderProductItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={numColumns}
                            columnWrapperStyle={styles.columnWrapper}
                            contentContainerStyle={styles.productList}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No products found in this category.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a2744',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 170,
        backgroundColor: '#f8f9fa',
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
    },
    sidebarMobile: {
        width: '100%',
        borderRightWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    sidebarItem: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    sidebarItemMobile: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 0,
    },
    sidebarItemActive: {
        backgroundColor: '#fff',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: 15,
        bottom: 15,
        width: 4,
        backgroundColor: '#cf1313',
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    activeIndicatorMobile: {
        position: 'absolute',
        bottom: 0,
        left: 15,
        right: 15,
        height: 3,
        backgroundColor: '#cf1313',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    sidebarIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 15,
        backgroundColor: '#fff',
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    sidebarIconContainerMobile: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginBottom: 4,
    },
    sidebarIcon: {
        width: 70,
        height: 70,
        borderRadius: 10,
    },
    sidebarText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 5,
        fontWeight: '500',
    },
    sidebarTextActive: {
        color: '#cf1313',
        fontWeight: '700',
    },
    mainArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    productList: {
        padding: 10,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
    },
    productCard: {
        marginBottom: 20,
        backgroundColor: '#fff',
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
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a2744',
        lineHeight: 18,
        height: 36,
    },
    productWeight: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    discountText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16a34a',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currentPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a2744',
    },
    oldPrice: {
        fontSize: 11,
        color: '#888',
        textDecorationLine: 'line-through',
        marginLeft: 4,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
    },
});

export default CategoryView;
