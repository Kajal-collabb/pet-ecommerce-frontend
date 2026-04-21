import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Check, Home } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const NAVY = '#1a2744';
const RED = '#dc2626';

export default function AddressScreen() {
    const router = useRouter();

    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('India');

    useEffect(() => {
        fetchAddresses();
    }, []);

    const getToken = async () => {
        const session = await AsyncStorage.getItem('user_session');
        return session ? JSON.parse(session).token : null;
    };

    const fetchAddresses = async () => {
        try {
            const token = await getToken();
            const response = await api.get('/address/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const data = Array.isArray(response.data) ? response.data : [];
                setAddresses(data);
                if (data.length === 0) setShowForm(true);
            }
        } catch (error) {
            console.error('Fetch addresses error:', error);
            setShowForm(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !pincode || !country) {
            const msg = 'Please fill in all fields';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Error', msg);
            return;
        }

        setSaving(true);
        try {
            const token = await getToken();
            const response = await api.post('/address', {
                fullName, phoneNumber, addressLine1, city, state, pincode, country,
                isDefault: addresses.length === 0,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                const msg = 'Address saved successfully!';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Success', msg);
                setFullName(''); setPhoneNumber(''); setAddressLine1('');
                setCity(''); setState(''); setPincode(''); setCountry('India');
                setShowForm(false);
                fetchAddresses();
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to save address';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Error', msg);
        } finally {
            setSaving(false);
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
                <Text style={styles.headerTitle}>Delivery Address</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Saved Addresses List */}
                {!showForm && addresses.length > 0 && (
                    <View style={styles.pageContainer}>
                        {/* Top Info Banner */}
                        <View style={styles.infoBanner}>
                            <Home size={20} color={RED} />
                            <Text style={styles.infoBannerText}>Select where you want your order delivered</Text>
                        </View>

                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Saved Addresses</Text>
                            <Text style={styles.sectionCount}>{addresses.length} saved</Text>
                        </View>

                        {/* Address Cards */}
                        {addresses.map((addr) => (
                            <TouchableOpacity
                                key={addr.id}
                                style={[styles.addressCard, selectedId === addr.id && styles.addressCardSelected]}
                                onPress={() => setSelectedId(addr.id)}
                                activeOpacity={0.85}
                            >
                                {/* Top colored strip on selected */}
                                {selectedId === addr.id && <View style={styles.selectedStrip} />}

                                <View style={styles.cardInner}>
                                    <View style={styles.iconBox}>
                                        <MapPin size={20} color={selectedId === addr.id ? RED : '#aaa'} />
                                    </View>
                                    <View style={styles.addressInfo}>
                                        <Text style={styles.addrName}>{addr.fullName}</Text>
                                        <Text style={styles.addrPhone}>{addr.phoneNumber}</Text>
                                        <Text style={styles.addrLine} numberOfLines={2}>
                                            {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                                        </Text>
                                    </View>
                                    <View style={[styles.radioCircle, selectedId === addr.id && styles.radioSelected]}>
                                        {selectedId === addr.id && <View style={styles.radioDot} />}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* Add New Address */}
                        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                            <Plus size={18} color={RED} />
                            <Text style={styles.addBtnText}>Add New Address</Text>
                        </TouchableOpacity>

                        {/* Continue Button */}
                        {selectedId && (
                            <TouchableOpacity style={styles.continueBtn} onPress={async () => {
                                await AsyncStorage.setItem('selectedAddressId', selectedId.toString());
                                router.push('/checkout');
                            }}>
                                <Check size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.continueBtnText}>Continue with this Address</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Address Form */}
                {showForm && (
                    <View style={styles.pageContainer}>
                        {/* Form Header */}
                        <View style={styles.formBanner}>
                            <MapPin size={22} color="#fff" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.formBannerTitle}>Add New Address</Text>
                                <Text style={styles.formBannerSub}>Fill in your delivery details below</Text>
                            </View>
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput style={styles.input} placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput style={styles.input} placeholder="10-digit mobile number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="numeric" maxLength={10} />

                            <Text style={styles.label}>Address Line</Text>
                            <TextInput style={styles.input} placeholder="House no., Street, Area" value={addressLine1} onChangeText={setAddressLine1} />

                            <View style={styles.row}>
                                <View style={styles.half}>
                                    <Text style={styles.label}>City</Text>
                                    <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={styles.half}>
                                    <Text style={styles.label}>Pincode</Text>
                                    <TextInput style={styles.input} placeholder="6-digit pincode" value={pincode} onChangeText={setPincode} keyboardType="numeric" maxLength={6} />
                                </View>
                            </View>

                            <Text style={styles.label}>State</Text>
                            <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} />

                            <Text style={styles.label}>Country</Text>
                            <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
                            </TouchableOpacity>

                            {addresses.length > 0 && (
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f3f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f3f5' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: { marginRight: 14 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },

    pageContainer: {
        maxWidth: 680,
        width: '100%',
        alignSelf: 'center',
        padding: 16,
    },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5f5',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    infoBannerText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#991b1b',
        fontWeight: '600',
        flex: 1,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionLabel: { fontSize: 15, fontWeight: '800', color: NAVY },
    sectionCount: { fontSize: 13, color: '#999', fontWeight: '600' },

    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    addressCardSelected: {
        borderColor: RED,
    },
    selectedStrip: {
        height: 4,
        backgroundColor: RED,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    addressInfo: { flex: 1 },
    addrName: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 3 },
    addrPhone: { fontSize: 13, color: '#888', marginBottom: 5 },
    addrLine: { fontSize: 13, color: '#555', lineHeight: 20 },

    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    radioSelected: { borderColor: RED },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: RED,
    },

    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: RED,
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    addBtnText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: RED },

    continueBtn: {
        flexDirection: 'row',
        backgroundColor: RED,
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    continueBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    formBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: NAVY,
        borderRadius: 14,
        padding: 18,
        marginBottom: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    formBannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
    formBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 22,
        marginBottom: 20,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },

    label: {
        fontSize: 11, fontWeight: '800', color: NAVY,
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
    },
    input: {
        borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
        paddingHorizontal: 14, height: 50, marginBottom: 16,
        backgroundColor: '#fafafa', fontSize: 15, color: '#333',
    },
    row: { flexDirection: 'row' },
    half: { flex: 1 },

    saveBtn: {
        backgroundColor: RED, borderRadius: 12, height: 52,
        justifyContent: 'center', alignItems: 'center', marginTop: 8,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    cancelBtn: { height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    cancelBtnText: { color: '#999', fontWeight: '600', fontSize: 15 },
});
