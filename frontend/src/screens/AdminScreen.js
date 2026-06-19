import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../config/api';
import { colors, radius, spacing } from '../theme';

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [publications, setPublications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, songsRes, pubsRes, fbRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/songs'),
        api.get('/admin/publications'),
        api.get('/feedback'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSongs(songsRes.data);
      setPublications(pubsRes.data);
      setFeedbacks(fbRes.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteUser = (id, name) => {
    Alert.alert('Delete User', `Delete "${name}" and all their content?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/users/${id}`);
            setUsers(prev => prev.filter(u => u._id !== id));
            Alert.alert('Done', 'User deleted');
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to delete user');
          }
        }
      }
    ]);
  };

  const deleteSong = (id) => {
    Alert.alert('Delete Song', 'Permanently delete this song?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/songs/${id}`);
            setSongs(prev => prev.filter(s => s._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete song');
          }
        }
      }
    ]);
  };

  const deletePub = (id) => {
    Alert.alert('Delete Publication', 'Remove this publication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/publications/${id}`);
            setPublications(prev => prev.filter(p => p._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/feedback/${id}/read`);
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, read: true } : f));
    } catch (e) {}
  };

  const deleteFeedback = (id) => {
    Alert.alert('Delete', 'Delete this feedback?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/feedback/${id}`);
            setFeedbacks(prev => prev.filter(f => f._id !== id));
          } catch (e) {}
        }
      }
    ]);
  };

  const TABS = [
    { key: 'users', icon: 'people', label: 'Users' },
    { key: 'songs', icon: 'musical-note', label: 'Songs' },
    { key: 'pubs', icon: 'megaphone', label: 'Posts' },
    { key: 'feedback', icon: 'chatbox', label: 'Feedback' },
  ];

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  const renderContent = () => {
    if (tab === 'users') {
      return (
        <FlatList
          data={users}
          keyExtractor={i => i._id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <Ionicons name="person" size={18} color={colors.accent} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{item.username}</Text>
                <Text style={styles.listItemSub}>{item.email} · {item.role}</Text>
              </View>
              {item.role !== 'admin' && (
                <TouchableOpacity onPress={() => deleteUser(item._id, item.username)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.accent} />}
          ListEmptyComponent={<Text style={styles.emptyList}>No users found</Text>}
        />
      );
    }

    if (tab === 'songs') {
      return (
        <FlatList
          data={songs}
          keyExtractor={i => i._id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <Ionicons name="musical-note" size={18} color={colors.accent} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{item.title}</Text>
                <Text style={styles.listItemSub}>by {item.owner?.username}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteSong(item._id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyList}>No songs found</Text>}
        />
      );
    }

    if (tab === 'pubs') {
      return (
        <FlatList
          data={publications}
          keyExtractor={i => i._id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <Ionicons name="megaphone" size={18} color={colors.accent} />
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.listItemSub}>by {item.author?.username} · {item.song?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => deletePub(item._id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyList}>No publications found</Text>}
        />
      );
    }

    if (tab === 'feedback') {
      return (
        <FlatList
          data={feedbacks}
          keyExtractor={i => i._id}
          renderItem={({ item }) => (
            <View style={[styles.feedbackCard, item.read && styles.feedbackRead]}>
              <View style={styles.fbHeader}>
                <View style={styles.fbUser}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
                  <View>
                    <Text style={styles.fbUsername}>{item.user?.username}</Text>
                    <Text style={styles.fbEmail}>{item.email}</Text>
                  </View>
                </View>
                <View style={styles.fbActions}>
                  {!item.read && (
                    <TouchableOpacity onPress={() => markRead(item._id)} style={styles.readBtn}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => deleteFeedback(item._id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              {item.rating && (
                <View style={styles.fbRating}>
                  {[1,2,3,4,5].map(s => (
                    <Ionicons key={s} name={item.rating >= s ? 'star' : 'star-outline'} size={14} color={colors.warning} />
                  ))}
                </View>
              )}
              <Text style={styles.fbMessage}>{item.message}</Text>
              <View style={styles.fbFooter}>
                <Text style={styles.fbDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyList}>No feedback yet</Text>}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1A0F3A', colors.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Stats */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <StatCard icon="people" value={stats.users} label="Users" color={colors.accent} />
          <StatCard icon="musical-note" value={stats.songs} label="Songs" color={colors.success} />
          <StatCard icon="megaphone" value={stats.publications} label="Posts" color={colors.warning} />
          <StatCard icon="chatbox" value={stats.feedbacks} label="Feedback" color="#FF6B9D" />
          {stats.unreadFeedback > 0 && (
            <StatCard icon="notifications" value={stats.unreadFeedback} label="Unread" color={colors.error} />
          )}
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tabItem, tab === t.key && styles.tabItemActive]}>
            <Ionicons name={t.icon} size={16} color={tab === t.key ? colors.accent : colors.textMuted} />
            <Text style={[styles.tabItemText, tab === t.key && { color: colors.accent }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xl + 4, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  statsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  statCard: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, width: 90, alignItems: 'center', borderWidth: 1 },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.accent },
  tabItemText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  listContent: { padding: spacing.md, paddingBottom: 60 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  listItemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  listItemInfo: { flex: 1 },
  listItemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  listItemSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 6 },
  emptyList: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  feedbackCard: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  feedbackRead: { opacity: 0.6 },
  fbHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  fbUser: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  fbUsername: { fontSize: 14, fontWeight: '700', color: colors.text },
  fbEmail: { fontSize: 12, color: colors.textMuted },
  fbActions: { flexDirection: 'row', gap: 4 },
  readBtn: { padding: 4 },
  fbRating: { flexDirection: 'row', gap: 2, marginBottom: spacing.xs },
  fbMessage: { fontSize: 14, color: colors.text, lineHeight: 20 },
  fbFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  fbDate: { fontSize: 11, color: colors.textDim },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
