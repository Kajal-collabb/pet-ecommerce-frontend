import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform } from 'react-native';
import { X, ChevronRight, User, LogOut, Tag, ShieldPlus, Scissors } from 'lucide-react-native';

export default function MobileSidebar({ visible, onClose, onLogout, router }) {

    const menuItems = [
        { title: 'Sale', route: '/sale', color: '#cf1313', icon: <Tag size={20} color="#cf1313" /> },
        { title: 'Vetcare', route: '/HospitalLocator', color: '#1a2744', icon: <ShieldPlus size={20} color="#1a2744" /> },
        { title: 'Grooming', route: '/grooming', color: '#1a2744', icon: <Scissors size={20} color="#1a2744" /> },
    ];

    return (
        <Modal
            animationType="fade" // Backdrop ke liye fade transition
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* 1. Sidebar Content (Left Side) */}
                <View style={styles.sidebarContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>care<Text style={{ color: '#E63946' }}>Tail</Text></Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={26} color="#1a2744" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listContainer}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => { router.push(item.route); onClose(); }}
                            >
                                <View style={styles.menuLeftSection}>
                                    {item.icon}
                                    <Text style={[styles.menuText, { color: item.color }]}>{item.title}</Text>
                                </View>
                                <ChevronRight size={18} color="#ccc" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.footerItem} onPress={() => { router.push('/profile'); onClose(); }}>
                            <User size={20} color="#666" />
                            <Text style={styles.footerText}>My Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.footerItem, styles.logoutBtn]} onPress={onLogout}>
                            <LogOut size={20} color="#cf1313" />
                            <Text style={[styles.footerText, { color: '#cf1313' }]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. Right Backdrop (Click here to close) */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row', // Isse Sidebar Left mein aur Backdrop Right mein aayega
        backgroundColor: 'rgba(0,0,0,0.5)', // Pure background ko thoda dark karega
    },
    sidebarContainer: {
        flex: 0.75, // Screen ka 75% hissa lega
        backgroundColor: '#fff',
        height: '100%',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    backdrop: {
        flex: 0.25, // Bacha hua 25% hissa clickable area
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1a2744',
    },
    listContainer: {
        marginTop: 15,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    menuLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    menuText: {
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        paddingTop: 20,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        gap: 12,
    },
    logoutBtn: {
        marginTop: 5,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#444',
    }
});