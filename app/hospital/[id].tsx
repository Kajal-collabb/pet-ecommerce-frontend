import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    TouchableOpacity, ActivityIndicator, ScrollView,
    SafeAreaView, Dimensions, Platform, Linking, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft, Phone, MessageCircle, MapPin,
    Clock, Star, ShieldCheck, Scissors, ChevronRight, CalendarCheck
} from 'lucide-react-native';
import api from '../../utils/api';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const HospitalDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [hospital, setHospital] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('VET');

    useEffect(() => {
        fetchData();
    }, [id, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const hospRes = await api.get(`/hospitals/${id}`);
            setHospital(hospRes.data);

            const serviceRes = await api.get(`/services/hospital/${id}?type=${activeTab}&page=0&size=10`);
            setServices(serviceRes.data.content || []);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderServiceCard = ({ item }) => (
        <View style={styles.serviceCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />
            <View style={styles.serviceInfo}>
                <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>₹{item.basePrice}</Text>
                    </View>
                </View>
                <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.featureRow}>
                    {item.features?.slice(0, 2).map((feat, i) => (
                        <View key={i} style={styles.featureBadge}>
                            <Text style={styles.featureText}>• {feat}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.bookingRow}>
                    <Text style={styles.advanceText}>Advance: ₹{item.bookingAdvance}</Text>

                    <View style={styles.buttonGroup}>
                        {/* Book Now Button - Navigation added here */}
                        <TouchableOpacity
                            style={[styles.bookSmallBtn, { backgroundColor: "red" }]}
                            onPress={() => router.push({
                                pathname: `/hospital/booking/${item.hospitalId}`, // Hospital ID dynamic yahan se aayegi
                                params: {
                                    serviceId: item.id,
                                    serviceName: item.name
                                }
                            })}
                        >
                            <Text style={styles.bookSmallText}>Book Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.bookSmallBtn, { marginLeft: 8 }]}
                            onPress={() => router.push(`/service/${item.id}`)}
                        >
                            <Text style={styles.bookSmallText}>Details</Text>
                            <ChevronRight size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading && !hospital) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a2744" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainWrapper}>
                {/* Custom Header */}
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
                        <ArrowLeft size={20} color="#1a2744" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle} numberOfLines={1}>{hospital?.name}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* Banner Section */}
                    <View style={styles.bannerContainer}>
                        <Image source={{ uri: hospital?.imageUrl }} style={styles.bannerImage} />
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.ratingText}>{hospital?.rating || "4.8"}</Text>
                        </View>
                    </View>

                    {/* Hospital Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.hospName}>{hospital?.name}</Text>
                        <View style={styles.row}>
                            <MapPin size={16} color="#666" />
                            <Text style={styles.addressText}>{hospital?.address}, {hospital?.city}</Text>
                        </View>

                        {/* Modified Action Row with 3 Buttons */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#25D366', borderColor: '#25D366' }]}
                                onPress={() => Linking.openURL(`https://wa.me/${hospital?.whatsapp}`)}
                            >
                                <MessageCircle size={18} color="#fff" />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: '#1a2744' }]}
                                onPress={() => Linking.openURL(`tel:${hospital?.phone}`)}
                            >
                                <Phone size={18} color="#1a2744" />
                                <Text style={[styles.actionBtnText, { color: '#1a2744' }]}>Call</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#1a2744', borderColor: '#1a2744', flex: 1.5 }]}
                                onPress={() => router.push(`/hospital/booking/${id}`)}
                            >
                                <CalendarCheck size={18} color="#fff" />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Book Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tabs Section */}
                    <View style={styles.tabWrapper}>
                        {['VET', 'GROOMING'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.tab, activeTab === type && styles.activeTab]}
                                onPress={() => setActiveTab(type)}
                            >
                                {type === 'VET' ?
                                    <ShieldCheck size={18} color={activeTab === 'VET' ? '#fff' : '#666'} /> :
                                    <Scissors size={18} color={activeTab === 'GROOMING' ? '#fff' : '#666'} />
                                }
                                <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>
                                    {type === 'VET' ? 'Medical' : 'Grooming'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Services List */}
                    <View style={styles.listSection}>
                        {loading ? (
                            <ActivityIndicator color="#1a2744" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={services}
                                renderItem={renderServiceCard}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                                ListEmptyComponent={
                                    <Text style={styles.emptyMsg}>No services found.</Text>
                                }
                            />
                        )}
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    mainWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: 1000, // Web ke liye center container
        alignSelf: 'center',
        backgroundColor: '#fff',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    navHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff'
    },
    navTitle: { fontSize: 16, fontWeight: '700', color: '#1a2744', flex: 1, textAlign: 'center' },
    iconCircle: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#f5f7f9', alignItems: 'center', justifyContent: 'center'
    },
    bannerContainer: { width: '100%', height: 250 },
    bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    ratingBadge: {
        position: 'absolute', bottom: 15, right: 15,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, ...Platform.select({ ios: { shadowOpacity: 0.1 }, android: { elevation: 5 } })
    },
    ratingText: { marginLeft: 4, fontWeight: '700', color: '#1a2744' },
    infoSection: { padding: 20 },
    hospName: { fontSize: 24, fontWeight: '800', color: '#1a2744', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    addressText: { fontSize: 14, color: '#666', flex: 1 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, gap: 6
    },
    actionBtnText: { fontWeight: '700', fontSize: 13 },
    tabWrapper: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 15 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 12, backgroundColor: '#f5f7f9', gap: 8
    },
    activeTab: { backgroundColor: '#1a2744' },
    tabText: { fontWeight: '700', color: '#666' },
    activeTabText: { color: '#fff' },
    listSection: { paddingHorizontal: 20 },
    serviceCard: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 15,
        flexDirection: 'row', padding: 12, borderWidth: 1, borderColor: '#f0f0f0',
        ...Platform.select({ ios: { shadowOpacity: 0.05 }, android: { elevation: 2 } })
    },
    serviceImage: { width: 85, height: 85, borderRadius: 12 },
    serviceInfo: { flex: 1, marginLeft: 12 },
    serviceHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    serviceName: { fontSize: 16, fontWeight: '700', color: '#1a2744', flex: 1 },
    priceTag: { backgroundColor: '#eef2ff', paddingHorizontal: 8, borderRadius: 6 },
    priceText: { color: '#0a3083', fontWeight: '800', fontSize: 14 },
    serviceDesc: { fontSize: 12, color: '#888', marginVertical: 4 },
    featureRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
    featureBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 6, py: 2, borderRadius: 4 },
    featureText: { fontSize: 10, color: '#777' },
    bookingRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f8f8f8'
    },
    advanceText: { fontSize: 11, fontWeight: '600', color: '#cf1313' },
    bookSmallBtn: {
        backgroundColor: '#1a2744', flexDirection: 'row',
        alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8
    },
    bookSmallText: { color: '#fff', fontSize: 11, fontWeight: '700', marginRight: 2 },
    emptyMsg: { textAlign: 'center', color: '#999', marginTop: 30 }
});

export default HospitalDetails;