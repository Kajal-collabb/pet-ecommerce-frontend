import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    TouchableOpacity, ActivityIndicator, SafeAreaView,
    Platform, useWindowDimensions, Alert, Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Navigation, Phone, MessageCircle, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api from '../utils/api'; // Using your existing api utility
import NavBar from './components/nav';

const HospitalLocator = () => {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const isMobile = windowWidth < 768;
    const { type } = useLocalSearchParams();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingNearby, setFetchingNearby] = useState(false);

    // Responsive Grid Logic like your CategoryView
    const numColumns = isMobile ? 1 : 2;
    const gap = 15;
    const cardWidth = isMobile ? windowWidth - 30 : (windowWidth - 45) / 2;

    useEffect(() => {
        initLocationAndFetch();
    }, []);

    const initLocationAndFetch = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                await fetchAllHospitals();
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            await fetchNearbyHospitals(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error("Location/Init Error:", error);
            await fetchAllHospitals();
        } finally {
            setLoading(false);
        }
    };

    const fetchNearbyHospitals = async (lat, lng) => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            // Using your api utility structure
            const response = await api.get(`/hospitals/nearby?lat=${lat}&lng=${lng}&radius=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                setHospitals(response.data || []);
            }
        } catch (error) {
            console.error("Nearby API Error:", error);
            fetchAllHospitals();
        }
    };

    const fetchAllHospitals = async () => {
        try {
            const session = await AsyncStorage.getItem("user_session");
            const token = session ? JSON.parse(session).token : null;

            const response = await api.get(`/hospitals/all?page=0&size=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                setHospitals(response.data.content || []);
            }
        } catch (error) {
            console.error("All Hospitals API Error:", error);
        }
    };

    const handleGetDirection = (lat, lng) => {
        const url = Platform.select({
            ios: `maps:0,0?q=${lat},${lng}`,
            android: `geo:0,0?q=${lat},${lng}`,
            web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        });
        Linking.openURL(url);
    };

    const renderHospitalItem = ({ item, index }) => (
        <View style={[
            styles.hospitalCard,
            {
                width: cardWidth,
                marginRight: !isMobile && (index % 2 === 0) ? gap : 0
            }
        ]}>
            <Image source={{ uri: item.imageUrl }} style={styles.hospitalImage} />

            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.hospitalName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.actionIcons}>
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                            <Phone size={18} color="#0a3083" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginLeft: 12 }}
                            onPress={() => Linking.openURL(`https://wa.me/${item.whatsapp}`)}
                        >
                            <MessageCircle size={18} color="#25D366" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.addressText} numberOfLines={2}>{item.address}, {item.city}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.ratingBox}>
                        <Star size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating || "4.8"}</Text>
                    </View>
                    {item.distance && (
                        <Text style={styles.distanceText}>• {item.distance.toFixed(1)} km away</Text>
                    )}
                </View>

                <Text style={styles.statusText}>Open: {item.openingTime} - {item.closingTime}</Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.directionBtn}
                        onPress={() => handleGetDirection(item.latitude, item.longitude)}
                    >
                        <Navigation size={16} color="#0a3083" />
                        <Text style={styles.directionBtnText}>DIRECTIONS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.bookBtn, { backgroundColor: "#0a3083" }]}
                        onPress={() => router.push(`/hospital/${item.id}`)}
                    >
                        <Text style={styles.bookBtnText}>Hospital Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.bookBtn}

                    >
                        <Text style={styles.bookBtnText}>BOOK NOW</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#cf1313" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1a2744" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {type === 'grooming' ? 'Grooming' : 'Vetcare'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={hospitals}
                renderItem={renderHospitalItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={numColumns}
                key={numColumns}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hospitals found nearby.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a2744' },

    listContainer: { padding: 15 },
    hospitalCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',


        borderWidth: 1,
        borderColor: '#eee',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 }
        })
    },
    hospitalImage: { width: '100%', height: 250, resizeMode: 'cover' },
    cardInfo: { padding: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hospitalName: { fontSize: 16, fontWeight: '700', color: '#1a2744', flex: 1 },
    actionIcons: { flexDirection: 'row' },
    addressText: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    ratingText: { fontSize: 12, fontWeight: '700', marginLeft: 4, color: '#b8860b' },
    distanceText: { fontSize: 12, color: '#0a3083', marginLeft: 8, fontWeight: '600' },

    statusText: { fontSize: 11, color: '#cf1313', fontWeight: '600', marginTop: 8 },

    buttonRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
    directionBtn: {
        flex: 1,
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#0a3083',
        borderRadius: 8,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },
    directionBtnText: { color: '#0a3083', fontWeight: '700', fontSize: 12 },
    bookBtn: {
        flex: 1,
        backgroundColor: '#cf1313',
        borderRadius: 8,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    emptyContainer: { padding: 50, alignItems: 'center' },
    emptyText: { color: '#888', fontSize: 15 }
});

export default HospitalLocator;