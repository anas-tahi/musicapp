import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { BASE_URL } from '../config/api';
import { colors, radius, spacing } from '../theme';

export default function PublishScreen() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [myPubs, setMyPubs] = useState([]);
  const [tab, setTab] = useState('publish'); // 'publish' | 'mypubs'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [songsRes, pubsRes] = await Promise.all([
        api.get('/songs'),
        api.get('/publications/my'),
      ]);
      setSongs(songsRes.data);
      setMyPubs(pubsRes.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!selectedSong) return Alert.alert('Error', 'Please select a song');
    setPublishing(true);
    try {
      const res = await api.post('/publications', {
        title: title.trim(),
        description: description.trim(),
        songId: selectedSong._id,
      });
      setMyPubs(prev => [res.data, ...prev]);
      setTitle('');
      setDescription('');
      setSelectedSong(null);
      setTab('mypubs');
      Alert.alert('Published!', 'Your music is now live on the feed.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePub = (id) => {
    Alert.alert('Delete', 'Remove this publication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/publications/${id}`);
            setMyPubs(prev => prev.filter(p => p._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Publish</Text>
        <View style={styles.titleAccent} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['publish', 'mypubs'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'publish' ? 'New Post' : 'My Posts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'publish' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Select a Song</Text>
          {songs.length === 0 ? (
            <View style={styles.noSongs}>
              <Ionicons name="musical-note-outline" size={32} color={colors.textDim} />
              <Text style={styles.noSongsText}>Upload songs first to publish them</Text>
            </View>
          ) : (
            songs.map(song => {
              const isSelected = selectedSong?._id === song._id;
              const coverUri = song.coverImage ? `${BASE_URL}${song.coverImage}` : null;
              return (
                <TouchableOpacity
                  key={song._id}
                  onPress={() => setSelectedSong(isSelected ? null : song)}
                  style={[styles.songOption, isSelected && styles.songOptionSelected]}
                  activeOpacity={0.8}
                >
                  {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.optionCover} />
                  ) : (
                    <View style={[styles.optionCover, styles.optionCoverPlaceholder]}>
                      <Ionicons name="musical-note" size={18} color={colors.accent} />
                    </View>
                  )}
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{song.title}</Text>
                    <Text style={styles.optionDesc} numberOfLines={1}>{song.description || 'No description'}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
                </TouchableOpacity>
              );
            })
          )}

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Publication Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Give your post a title..."
              placeholderTextColor={colors.textDim}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share something about this track..."
              placeholderTextColor={colors.textDim}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity onPress={handlePublish} disabled={publishing} style={styles.publishBtn}>
            <LinearGradient colors={[colors.accent, '#5A3FC0']} style={styles.publishGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {publishing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="megaphone" size={18} color={colors.white} />
                  <Text style={styles.publishBtnText}>Publish Now</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={myPubs}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.pubCard}>
              <View style={styles.pubCardHeader}>
                <Text style={styles.pubCardTitle} numberOfLines={1}>{item.title}</Text>
                <TouchableOpacity onPress={() => handleDeletePub(item._id)}>
                  <Ionicons name="trash-outline" size={17} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.pubCardSong}>🎵 {item.song?.title}</Text>
              {item.description ? <Text style={styles.pubCardDesc} numberOfLines={2}>{item.description}</Text> : null}
              <View style={styles.pubCardFooter}>
                <Text style={styles.pubCardMeta}>{item.likes?.length || 0} likes · {item.comments?.length || 0} comments</Text>
                <Text style={styles.pubCardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={60} color={colors.textDim} />
              <Text style={styles.emptyText}>No publications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl + 4, paddingBottom: spacing.md },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  titleAccent: { width: 32, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 3, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm - 2 },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  noSongs: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  noSongsText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
  songOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  songOptionSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  optionCover: { width: 48, height: 48, borderRadius: radius.sm },
  optionCoverPlaceholder: { backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  optionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, color: colors.text, fontSize: 15 },
  textArea: { height: 100, paddingTop: 12 },
  publishBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  publishGradient: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  publishBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  pubCard: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  pubCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  pubCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  pubCardSong: { fontSize: 13, color: colors.accent, marginBottom: 4 },
  pubCardDesc: { fontSize: 13, color: colors.textMuted },
  pubCardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  pubCardMeta: { fontSize: 12, color: colors.textMuted },
  pubCardDate: { fontSize: 12, color: colors.textDim },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: colors.textMuted, marginTop: spacing.md },
});
