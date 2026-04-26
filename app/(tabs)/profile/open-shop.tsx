import { useOpenShop } from '@/hooks/useOpenShop';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ShopOverlay from './components/ShopOverlay';

const CATEGORIES = [
  'Digital Assets',
  'Physical Rarities',
  'Trading Cards',
  'Art',
  'Electronics',
  'Collectibles',
];

// ─── Mock items for the shop dashboard ───────────────────────────────────────
type Item = { id: string; name: string; startingPrice: string; category: string; status: 'live' | 'draft' };

export default function OpenShopScreen() {
  const router = useRouter();
  const {
    theme, ringColor, blobColor, formData, setFormData, loading,
    checkingStatus, isValidatingZip, successVisible, setSuccessVisible,
    isPhoneValid, isFormValid, toggleCategory, handleSubmit,
    shopStatus, shopData,
  } = useOpenShop();

  const [items, setItems] = useState<Item[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', startingPrice: '', category: CATEGORIES[0] });

  const addItem = () => {
    if (!newItem.name.trim() || !newItem.startingPrice.trim()) return;
    const item: Item = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      startingPrice: newItem.startingPrice.trim(),
      category: newItem.category,
      status: 'live',
    };
    setItems(prev => [item, ...prev]);
    setNewItem({ name: '', startingPrice: '', category: CATEGORIES[0] });
    setShowAddModal(false);
  };

  const removeItem = (id: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems(prev => prev.filter(i => i.id !== id)) },
    ]);
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (checkingStatus) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Checking shop status...</Text>
      </View>
    );
  }

  // ─── ACTIVATED: Shop Dashboard ──────────────────────────────────────────────
  if (shopStatus === 'activated') {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.ring1, { borderColor: ringColor }]} pointerEvents="none" />
        <View style={[styles.blob, { backgroundColor: blobColor }]} pointerEvents="none" />

        {/* Header */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>MY SHOP</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.text }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Shop Info Card */}
          <View style={[styles.shopCard, { backgroundColor: theme.card }]}>
            <View style={styles.shopCardRow}>
              <View style={[styles.shopBadge, { backgroundColor: theme.text }]}>
                <Ionicons name="storefront" size={22} color={theme.background} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.shopName, { color: theme.text }]}>{shopData?.shopName}</Text>
                <Text style={[styles.shopMeta, { color: theme.secondaryText }]}>
                  {shopData?.city}  ·  {(shopData?.selectedCategories || []).length} categories
                </Text>
              </View>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>LIVE</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.background }]} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{items.length}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>LISTINGS</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.background }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {items.filter(i => i.status === 'live').length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>LIVE</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.background }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {shopData?.activatedAt
                    ? new Date(shopData.activatedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                    : '—'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>SINCE</Text>
              </View>
            </View>
          </View>

          {/* Categories */}
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>CATEGORIES</Text>
          <View style={styles.chipRow}>
            {(shopData?.selectedCategories || []).map(cat => (
              <View key={cat} style={[styles.catChip, { backgroundColor: theme.card }]}>
                <Text style={[styles.catChipText, { color: theme.text }]}>{cat.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Listings */}
          <Text style={[styles.sectionLabel, { color: theme.secondaryText, marginTop: 24 }]}>LISTINGS</Text>

          {items.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.card }]}>
              <Ionicons name="cube-outline" size={40} color={theme.secondaryText} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No listings yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
                Tap the + button to add your first item
              </Text>
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: theme.text }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={[styles.emptyAddBtnText, { color: theme.background }]}>ADD ITEM</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map(item => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.card }]}>
                <View style={styles.itemCardLeft}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.itemCategory, { color: theme.secondaryText }]}>{item.category}</Text>
                </View>
                <View style={styles.itemCardRight}>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>₱{item.startingPrice}</Text>
                  <View style={styles.livePill}>
                    <Text style={styles.livePillText}>LIVE</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={theme.secondaryText} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Item Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>ADD LISTING</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: theme.secondaryText }]}>ITEM NAME</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.card }]}
                placeholder="e.g. Rare Pokémon Card"
                placeholderTextColor={theme.secondaryText + '70'}
                value={newItem.name}
                onChangeText={t => setNewItem(prev => ({ ...prev, name: t }))}
              />

              <Text style={[styles.label, { color: theme.secondaryText, marginTop: 16 }]}>STARTING PRICE (₱)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.card }]}
                placeholder="e.g. 500"
                placeholderTextColor={theme.secondaryText + '70'}
                keyboardType="numeric"
                value={newItem.startingPrice}
                onChangeText={t => setNewItem(prev => ({ ...prev, startingPrice: t }))}
              />

              <Text style={[styles.label, { color: theme.secondaryText, marginTop: 16 }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewItem(prev => ({ ...prev, category: cat }))}
                      style={[
                        styles.modalCatChip,
                        { backgroundColor: newItem.category === cat ? theme.text : theme.card },
                      ]}
                    >
                      <Text style={[
                        styles.modalCatChipText,
                        { color: newItem.category === cat ? theme.background : theme.text },
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: newItem.name && newItem.startingPrice ? theme.text : theme.card, marginTop: 24 },
                ]}
                onPress={addItem}
                disabled={!newItem.name.trim() || !newItem.startingPrice.trim()}
              >
                <Text style={[
                  styles.submitBtnText,
                  { color: newItem.name && newItem.startingPrice ? theme.background : theme.secondaryText },
                ]}>
                  ADD TO SHOP
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ─── PENDING: Waiting for approval ─────────────────────────────────────────
  if (shopStatus === 'pending') {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.ring1, { borderColor: ringColor }]} pointerEvents="none" />
        <View style={[styles.blob, { backgroundColor: blobColor }]} pointerEvents="none" />

        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>OPEN SHOP</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.pendingContainer}>
          <View style={[styles.pendingIconWrap, { backgroundColor: theme.card }]}>
            <Ionicons name="time-outline" size={52} color={theme.text} />
          </View>
          <Text style={[styles.pendingTitle, { color: theme.text }]}>Application Pending</Text>
          <Text style={[styles.pendingSubtitle, { color: theme.secondaryText }]}>
            Your application{shopData?.shopName ? ` for "${shopData.shopName}"` : ''} is currently under review.
          </Text>
          {shopData?.submittedAt && (
            <View style={[styles.pendingCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.pendingCardLabel, { color: theme.secondaryText }]}>SUBMITTED</Text>
              <Text style={[styles.pendingCardValue, { color: theme.text }]}>
                {new Date(shopData.submittedAt).toLocaleDateString('en-PH', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          <View style={[styles.pendingInfoBox, { backgroundColor: theme.card }]}>
            <Ionicons name="mail-outline" size={18} color={theme.secondaryText} style={{ marginBottom: 6 }} />
            <Text style={[styles.pendingInfoText, { color: theme.secondaryText }]}>
              Our team will review your application and send you a confirmation email once your shop is activated.
            </Text>
          </View>
          <TouchableOpacity style={[styles.backBtn, { borderColor: theme.text }]} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: theme.text }]}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── IDLE: Application Form ─────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.ring1, { borderColor: ringColor }]} pointerEvents="none" />
      <View style={[styles.blob, { backgroundColor: blobColor }]} pointerEvents="none" />

      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>OPEN SHOP</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>

          <Text style={[styles.label, { color: theme.secondaryText }]}>BUSINESS NAME</Text>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Vintage Vault"
            placeholderTextColor={theme.secondaryText + '70'}
            value={formData.shopName}
            onChangeText={(t) => setFormData({ ...formData, shopName: t })}
          />

          <Text style={[styles.label, { color: theme.secondaryText, marginTop: 20 }]}>PH PHONE NUMBER</Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.card },
              formData.phone && !isPhoneValid && { borderColor: 'red', borderWidth: 1 },
            ]}
            placeholder="09171234567"
            placeholderTextColor={theme.secondaryText + '70'}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(t) => setFormData({ ...formData, phone: t })}
          />
          {formData.phone.length > 0 && !isPhoneValid && (
            <Text style={styles.errorText}>Enter a valid PH number (09xxxxxxxxx or +639xxxxxxxxx)</Text>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>ZIP CODE</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.card }]}
                maxLength={4}
                keyboardType="number-pad"
                placeholder="e.g. 8000"
                placeholderTextColor={theme.secondaryText + '70'}
                value={formData.zipCode}
                onChangeText={(t) => setFormData({ ...formData, zipCode: t })}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>CITY (AUTO)</Text>
              <View style={[styles.input, { backgroundColor: theme.card, justifyContent: 'center' }]}>
                {isValidatingZip ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Text style={{
                    color: formData.city === 'Not found' || formData.city === 'Error' ? 'red' : theme.text,
                    fontWeight: '700',
                  }}>
                    {formData.city || '---'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: theme.secondaryText, marginTop: 25, marginBottom: 10 }]}>
            CATEGORIES (UP TO 3)
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const selected = formData.selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={[styles.squareChip, { backgroundColor: selected ? theme.text : theme.card }]}
                >
                  <Text style={[styles.chipText, { color: selected ? theme.background : theme.text }]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.categoryCount, { color: theme.secondaryText }]}>
            {formData.selectedCategories.length}/3 selected
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text, flex: 1 }]}>Accept Seller Agreement</Text>
            <Switch
              value={formData.termsAccepted}
              onValueChange={(v) => setFormData({ ...formData, termsAccepted: v })}
              trackColor={{ false: theme.card, true: theme.text }}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: isFormValid ? theme.text : theme.card }]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text style={[styles.submitBtnText, { color: isFormValid ? theme.background : theme.secondaryText }]}>
                ACTIVATE MY SHOP
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ShopOverlay
        visible={successVisible}
        theme={theme}
        onClose={() => setSuccessVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ring1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, borderWidth: 1, top: -80, left: -80, opacity: 0.2 },
  blob: { position: 'absolute', width: 140, height: 140, borderRadius: 70, top: 260, left: -30, opacity: 0.1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, textAlign: 'center', flex: 1 },
  scrollContent: { padding: 20 },
  formContainer: { marginTop: 10 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  input: { height: 55, borderRadius: 12, paddingHorizontal: 15, marginTop: 8, fontWeight: '600' },
  errorText: { color: 'red', fontSize: 11, marginTop: 4, marginLeft: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  squareChip: { padding: 12, minWidth: '31%', alignItems: 'center', borderRadius: 8 },
  chipText: { fontSize: 9, fontWeight: '900' },
  categoryCount: { fontSize: 10, marginBottom: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, padding: 15, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.03)' },
  switchLabel: { fontWeight: '700', textDecorationLine: 'underline' },
  submitBtn: { height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { fontWeight: '900', fontSize: 15 },
  loadingText: { marginTop: 12, fontSize: 13 },

  // Pending
  pendingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 40 },
  pendingIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pendingTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  pendingSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  pendingCard: { width: '100%', borderRadius: 12, padding: 16, marginBottom: 16 },
  pendingCardLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  pendingCardValue: { fontSize: 14, fontWeight: '600' },
  pendingInfoBox: { width: '100%', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 32 },
  pendingInfoText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  backBtn: { height: 52, width: '100%', borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },

  // Shop dashboard
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  shopCard: { borderRadius: 16, padding: 18, marginBottom: 20 },
  shopCardRow: { flexDirection: 'row', alignItems: 'center' },
  shopBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  shopMeta: { fontSize: 12, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  activeText: { fontSize: 10, fontWeight: '900', color: '#16a34a' },
  divider: { height: 1, marginVertical: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  catChipText: { fontSize: 9, fontWeight: '900' },
  emptyBox: { borderRadius: 16, padding: 32, alignItems: 'center', marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyAddBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  emptyAddBtnText: { fontWeight: '900', fontSize: 13 },
  itemCard: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  itemCardLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemCategory: { fontSize: 11, marginTop: 2 },
  itemCardRight: { alignItems: 'flex-end', gap: 6, marginRight: 12 },
  itemPrice: { fontSize: 15, fontWeight: '900' },
  livePill: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  livePillText: { fontSize: 9, fontWeight: '900', color: '#16a34a' },
  removeBtn: { padding: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  modalCatChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modalCatChipText: { fontSize: 12, fontWeight: '700' },
});