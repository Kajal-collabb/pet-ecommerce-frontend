import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert, SafeAreaView,
    Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
import { Picker } from '@react-native-picker/picker';

import AsyncStorage from '@react-native-async-storage/async-storage';
// PRIMARY COLORS: BLUE & RED
const PRIMARY_BLUE = '#2563EB';
const PRIMARY_RED = '#DC2626';
const LIGHT_BLUE = '#DBEAFE';
const LIGHT_RED = '#FEE2E2';
const TEXT_DARK = '#1E293B';
const TEXT_GRAY = '#64748B';

const BookingPage = () => {
    const router = useRouter();
    const { id, serviceId, serviceName } = useLocalSearchParams();

    // State
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState<any>({});

    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        petName: '',
        petType: '',
        petBreed: '',
        petAge: '',
        date: '', // YYYY-MM-DD
        timeSlot: '',
        notes: ''
    });

    useEffect(() => {
        fetchTimeSlots();
    }, []);

    const fetchTimeSlots = async () => {
        try {

            const session = await AsyncStorage.getItem('user_session');
            const token = session ? JSON.parse(session).token : null;
            const res = await api.get('/appointments/timeslots', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                setTimeSlots(res.data || []);
            }
        } catch (error: any) {
            console.log("Timeslot error:", error.response?.status);
            if (error.response?.status === 403) {
                Alert.alert("Session Expired", "Please log in again.");
            }
        }
    };

    const validateForm = () => {
        let tempErrors: any = {};
        if (!formData.customerName || formData.customerName.length < 2) tempErrors.customerName = "Full name is required";
        if (!formData.phone || !/^\d{10}$/.test(formData.phone)) tempErrors.phone = "Valid 10-digit phone number is required";
        if (!formData.petName) tempErrors.petName = "Pet name is required";
        if (!formData.date) tempErrors.date = "Please select a date";
        if (!formData.timeSlot) tempErrors.timeSlot = "Please select a time slot";

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        // Toggle visibility: Android closes on set, iOS remains open
        setShowDatePicker(Platform.OS === 'ios');

        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}`;
            setFormData({ ...formData, date: formatted });
            if (errors.date) setErrors({ ...errors, date: null });
        }
    };

    const handleAddAppointment = async () => {
        if (!validateForm()) {
            Alert.alert("Validation Failed", "Please correct the highlighted fields.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                hospitalId: parseInt(id as string),
                serviceId: parseInt(serviceId as string)
            };

            const response = await axiosInstance.post('/appointments', payload);

            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    "Artisan Booking Confirmed",
                    "Your session has been successfully added to the vault.",
                    [{ text: "Select Address", onPress: () => router.push('/manage-addresses' as any) }]
                );
            }
        } catch (error: any) {
            console.error("Booking Error:", error);
            const errorMsg = error.response?.data?.message || "Connectivity interference occurred.";
            Alert.alert("Process Failed", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainWrapper}>

                {/* Majestic Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleArea}>
                        <Text style={styles.title}>Book Appointment</Text>
                        {serviceName && (
                            <View style={styles.serviceBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={PRIMARY_BLUE} />
                                <Text style={styles.serviceText}>{serviceName}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>

                    {/* Client Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Client Information</Text>

                        <View style={[styles.inputGroup, errors.customerName && styles.inputError]}>
                            <Ionicons name="person-outline" size={18} color={errors.customerName ? PRIMARY_RED : PRIMARY_BLUE} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#94A3B8"
                                value={formData.customerName}
                                onChangeText={(t) => setFormData({ ...formData, customerName: t })}
                            />
                        </View>
                        {errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}

                        <View style={[styles.inputGroup, errors.phone && styles.inputError, { marginTop: 12 }]}>
                            <Ionicons name="call-outline" size={18} color={errors.phone ? PRIMARY_RED : PRIMARY_BLUE} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contact Number (10 Digits)"
                                placeholderTextColor="#94A3B8"
                                value={formData.phone}
                                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                    </View>

                    {/* Pet Details Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Pet Particulars</Text>

                        <View style={[styles.inputGroup, errors.petName && styles.inputError]}>
                            <Ionicons name="paw-outline" size={18} color={errors.petName ? PRIMARY_RED : PRIMARY_BLUE} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Pet Name"
                                placeholderTextColor="#94A3B8"
                                value={formData.petName}
                                onChangeText={(t) => setFormData({ ...formData, petName: t })}
                            />
                        </View>
                        {errors.petName && <Text style={styles.errorText}>{errors.petName}</Text>}

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Breed"
                                    placeholderTextColor="#94A3B8"
                                    value={formData.petBreed}
                                    onChangeText={(t) => setFormData({ ...formData, petBreed: t })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 0.5 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Age"
                                    placeholderTextColor="#94A3B8"
                                    value={formData.petAge}
                                    onChangeText={(t) => setFormData({ ...formData, petAge: t })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.typeContainer}>
                            {['DOG', 'CAT', 'BIRD'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeBadge,
                                        formData.petType === type && { borderColor: PRIMARY_RED, backgroundColor: LIGHT_RED }
                                    ]}
                                    onPress={() => setFormData({ ...formData, petType: type as any })}
                                >
                                    <Text style={[
                                        styles.typeBadgeText,
                                        formData.petType === type && { color: PRIMARY_RED }
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Schedule Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Schedule Slot</Text>

                        <View style={[styles.inputGroup, errors.date && styles.inputError]}>
                            <Ionicons name="calendar-outline" size={18} color={errors.date ? PRIMARY_RED : PRIMARY_BLUE} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Date (YYYY-MM-DD)"
                                placeholderTextColor="#94A3B8"
                                value={formData.date}
                                onChangeText={(t) => {
                                    setFormData({ ...formData, date: t });
                                    if (errors.date) setErrors({ ...errors, date: null });
                                }}
                            />
                        </View>
                        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
                        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

                        <View style={[styles.inputGroup, errors.timeSlot && styles.inputError, { paddingHorizontal: 0, marginTop: 12 }]}>
                            <Ionicons name="time-outline" size={18} color={errors.timeSlot ? PRIMARY_RED : PRIMARY_BLUE} style={[styles.icon, { marginLeft: 15 }]} />
                            <Picker
                                selectedValue={formData.timeSlot}
                                style={styles.picker}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, timeSlot: value });
                                    if (errors.timeSlot) setErrors({ ...errors, timeSlot: null });
                                }}
                            >
                                <Picker.Item label="Select Time Slot" value="" style={{ fontSize: 15, color: '#94A3B8' }} />
                                {timeSlots.map((slot: any) => (
                                    <Picker.Item key={slot.key} label={slot.label} value={slot.key} style={{ fontSize: 15 }} />
                                ))}
                            </Picker>
                        </View>
                        {errors.timeSlot && <Text style={styles.errorText}>{errors.timeSlot}</Text>}
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Special Instructions</Text>
                        <View style={[styles.inputGroup, { alignItems: 'flex-start', paddingTop: 12, height: 120 }]}>
                            <Ionicons name="document-text-outline" size={18} color={PRIMARY_BLUE} style={styles.icon} />
                            <TextInput
                                style={[styles.input, { height: 100 }]}
                                placeholder="Any chronic conditions or requests?"
                                placeholderTextColor="#94A3B8"
                                multiline
                                textAlignVertical="top"
                                value={formData.notes}
                                onChangeText={(t) => setFormData({ ...formData, notes: t })}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.8 }]}
                        onPress={handleAddAppointment}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Confirm Appointment</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>


            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    mainWrapper: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitleArea: { flex: 1 },
    scrollPadding: { padding: 24, paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: '900', color: TEXT_DARK, letterSpacing: -0.5 },
    serviceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start', backgroundColor: LIGHT_BLUE, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    serviceText: { color: PRIMARY_BLUE, fontWeight: '700', fontSize: 13 },
    section: { marginBottom: 30 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: TEXT_GRAY, textTransform: 'uppercase', marginBottom: 14, letterSpacing: 1.5 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 18, backgroundColor: '#fff', height: 56, marginBottom: 8 },
    inputError: { borderColor: PRIMARY_RED, backgroundColor: '#FFF5F5' },
    icon: { marginRight: 12 },
    input: { flex: 1, height: '100%', color: TEXT_DARK, fontSize: 15, fontWeight: '500' },
    dateText: { flex: 1, fontSize: 15, fontWeight: '500', color: TEXT_DARK },
    picker: { flex: 1, height: 56 },
    errorText: { color: PRIMARY_RED, fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 8, marginLeft: 12 },
    row: { flexDirection: 'row', marginBottom: 15, marginTop: 8 },
    typeContainer: { flexDirection: 'row', gap: 12, marginTop: 15 },
    typeBadge: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#F1F5F9', alignItems: 'center', backgroundColor: '#fff' },
    typeBadgeText: { color: TEXT_GRAY, fontWeight: '800', fontSize: 13 },
    submitBtn: {
        backgroundColor: PRIMARY_BLUE,
        flexDirection: 'row',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        shadowColor: PRIMARY_BLUE,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }
});

export default BookingPage;