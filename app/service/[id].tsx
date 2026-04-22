import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, ActivityIndicator, SafeAreaView,
    Dimensions, Platform, Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft, Clock, ShieldCheck,
    CheckCircle2, Info, Calendar
} from 'lucide-react-native';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

const ServiceDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServiceData();
    }, [id]);

    const fetchServiceData = async () => {
        try {
            const res = await api.get(`/services/${id}`);
            setService(res.data);
        } catch (error) {
            console.error("Error fetching service:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a2744" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainWrapper}>
                {/* Header Overlay */}
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={22} color="#1a2744" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Hero Image */}
                    <Image source={{ uri: service?.imageUrl }} style={styles.heroImage} />

                    <View style={styles.contentCard}>
                        {/* Title & Type */}
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeText}>{service?.type}</Text>
                        </View>
                        <Text style={styles.serviceTitle}>{service?.name}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Clock size={16} color="#666" />
                                <Text style={styles.metaText}>{service?.durationInMinutes} Mins</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <ShieldCheck size={16} color="#1a2744" />
                                <Text style={styles.metaText}>Verified Professional</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About Service</Text>
                            <Text style={styles.descriptionText}>{service?.description}</Text>
                        </View>

                        {/* Features List */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>What's Included</Text>
                            {service?.features?.map((feature, index) => (
                                <View key={index} style={styles.featureItem}>
                                    <CheckCircle2 size={18} color="#25D366" />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Pricing Info */}
                        <View style={styles.priceContainer}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Service Charge</Text>
                                <Text style={styles.priceValue}>₹{service?.basePrice}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Booking Advance</Text>
                                <Text style={[styles.priceValue, { color: '#cf1313' }]}>₹{service?.bookingAdvance}</Text>
                            </View>
                            <View style={styles.infoBox}>
                                <Info size={14} color="#666" />
                                <Text style={styles.infoText}>Pay the balance amount at the clinic.</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Sticky Bottom Bar */}
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomPriceLabel}>Starting from</Text>
                        <Text style={styles.bottomPriceValue}>₹{service?.basePrice}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => router.push({
                            pathname: `/hospital/booking/${service?.hospitalId}`,
                            params: { serviceId: service?.id, serviceName: service?.name }
                        })}
                    >
                        <Calendar size={18} color="#fff" />
                        <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    mainWrapper: {
        flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center', backgroundColor: '#fff',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerNav: {
        position: 'absolute', top: 15, left: 15, zIndex: 10,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center', justifyContent: 'center', elevation: 5
    },
    heroImage: { width: '100%', height: 300, resizeMode: 'cover' },
    contentCard: {
        marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30,
        backgroundColor: '#fff', padding: 25, flex: 1
    },
    typeBadge: {
        backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10
    },
    typeText: { color: '#1a2744', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
    serviceTitle: { fontSize: 26, fontWeight: '800', color: '#1a2744', marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 20, marginBottom: 25 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { color: '#666', fontSize: 14, fontWeight: '500' },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a2744', marginBottom: 12 },
    descriptionText: { fontSize: 15, color: '#555', lineHeight: 22 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    featureText: { fontSize: 15, color: '#333' },
    priceContainer: {
        backgroundColor: '#f8f9fa', padding: 20, borderRadius: 16, marginTop: 10
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceLabel: { fontSize: 15, color: '#666', fontWeight: '500' },
    priceValue: { fontSize: 16, fontWeight: '700', color: '#1a2744' },
    infoBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12
    },
    infoText: { fontSize: 12, color: '#777', fontStyle: 'italic' },
    bottomBar: {
        position: 'absolute', bottom: 0, width: '100%', maxWidth: 900,
        backgroundColor: '#fff', padding: 20, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#f0f0f0',
        elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
    },
    bottomPriceLabel: { fontSize: 12, color: '#666' },
    bottomPriceValue: { fontSize: 20, fontWeight: '800', color: '#1a2744' },
    bookButton: {
        backgroundColor: '#1a2744', paddingHorizontal: 30, paddingVertical: 14,
        borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8
    },
    bookButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});

export default ServiceDetails;