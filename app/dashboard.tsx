import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, SafeAreaView, Image,
    ScrollView, Dimensions, Text,
    FlatList, ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from './components/nav';
import { useRouter } from 'expo-router';
import api from "../utils/api";

const { width } = Dimensions.get('window');

export default function DashboardPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
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

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Banner Area */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={require('../assets/pug2.png')}
                        style={styles.heroImage}
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
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        height: width * 0.35,
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
});
