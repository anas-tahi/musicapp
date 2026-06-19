import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const profilePicUri = user?.profilePic ? `${BASE_URL}${user.profilePic}` : null;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return Alert.alert('Error', 'Please write your feedback');
    setSubmitting(true);
    try {
      await api.post('/feedback', { message: feedback.trim(), rating: rating || null });
      setSubmitted(true);
      setFeedback('');
      setRating(0);
      Alert.alert('Thank you!', 'Your feedback has been sent to the admin.');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <LinearGradient colors={['#1A0F3A', colors.bg]} style={styles.headerGradient}>
        <View style={styles.profileSection}>
          {profilePicUri ? (
            <Image source={{ uri: profilePicUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color={colors.accent} />
            </View>
          )}
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.white} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Admin Panel Link */}
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={() => router.push('/admin')} style={styles.adminCard} activeOpacity={0.85}>
            <LinearGradient colors={[colors.accentDim, '#1A0F3A']} style={styles.adminCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.adminCardIcon}>
                <Ionicons name="shield-checkmark" size={22} color={colors.accent} />
              </View>
              <View style={styles.adminCardText}>
                <Text style={styles.adminCardTitle}>Admin Dashboard</Text>
                <Text style={styles.adminCardSub}>Manage users, songs & feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Account Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Info</Text>
          {[
            { icon: 'person-outline', label: 'Username', value: user?.username },
            { icon: 'mail-outline', label: 'Email', value: user?.email },
            { icon: 'shield-outline', label: 'Role', value: user?.role === 'admin' ? 'Administrator' : 'User' },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Ionicons name={icon} size={18} color={colors.textMuted} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Feedback Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send Feedback</Text>
          <Text style={styles.cardSubTitle}>Help us improve the app</Text>

          {/* Star Rating */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={28}
                  color={rating >= star ? colors.warning : colors.textDim}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.feedbackInput}
            placeholder="Share your thoughts, suggestions or issues..."
            placeholderTextColor={colors.textDim}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={handleFeedback} disabled={submitting} style={styles.feedbackBtn}>
            <LinearGradient colors={[colors.accent, '#5A3FC0']} style={styles.feedbackBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={colors.white} />
                  <Text style={styles.feedbackBtnText}>Send Feedback</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGradient: { paddingTop: spacing.xl + 20, paddingBottom: spacing.xl },
  profileSection: { alignItems: 'center' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.accent },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.accent + '60' },
  username: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: spacing.sm, gap: 4 },
  adminBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  content: { padding: spacing.lg },
  adminCard: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.accent + '40' },
  adminCardInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  adminCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  adminCardText: { flex: 1 },
  adminCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  adminCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSubTitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.textMuted },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  feedbackInput: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, color: colors.text, fontSize: 14, height: 110, marginBottom: spacing.md },
  feedbackBtn: { borderRadius: radius.md, overflow: 'hidden' },
  feedbackBtnGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  feedbackBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.error + '40', marginTop: spacing.sm },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.error },
});
