import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShopOverlayProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

// Changed to default export to satisfy Expo Router requirements
const ShopOverlay = ({ visible, onClose, theme }: ShopOverlayProps) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={[styles.content, { backgroundColor: theme.card }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-unread" size={50} color={theme.text} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Activation Sent</Text>
        <Text style={[styles.sub, { color: theme.secondaryText }]}>
          Please check your email to verify your shop details and activate your merchant account.
        </Text>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: theme.text }]} 
          onPress={onClose}
        >
          <Text style={[styles.btnText, { color: theme.background }]}>GOT IT</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default ShopOverlay;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  content: { width: '100%', borderRadius: 28, padding: 30, alignItems: 'center' },
  iconContainer: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  btn: { width: '100%', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontWeight: '800', letterSpacing: 1 }
});