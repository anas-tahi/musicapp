import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { BASE_URL } from '../config/api';
import { colors, radius, spacing } from '../theme';

function SongCard({ song, onDelete }) {
  const coverUri = song.coverImage ? `${BASE_URL}${song.coverImage}` : null;
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.songCard}>
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.songCover} />
      ) : (
        <View style={[styles.songCover, styles.songCoverPlaceholder]}>
          <Ionicons name="musical-note" size={22} color={colors.accent} />
        </View>
      )}
      <View style={styles.songDetails}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.songDesc} numberOfLines={1}>{song.description || 'No description'}</Text>
        <View style={styles.songMeta}>
          <Text style={styles.songDuration}>{formatDuration(song.duration)}</Text>
          <Text style={styles.songDate}>{new Date(song.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => onDelete(song._id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function MySongsScreen() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const fetchSongs = useCallback(async () => {
    try {
      const res = await api.get('/songs');
      setSongs(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load songs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setAudioFile(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setCoverImage(result.assets[0]);
  };

  const handleUpload = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!audioFile) return Alert.alert('Error', 'Please select an MP3 file');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('audio', {
        uri: audioFile.uri,
        type: 'audio/mpeg',
        name: audioFile.name || 'song.mp3',
      });
      if (coverImage) {
        const filename = coverImage.uri.split('/').pop();
        const ext = filename.split('.').pop();
        formData.append('cover', {
          uri: coverImage.uri,
          type: `image/${ext}`,
          name: filename,
        });
      }

      const res = await api.post('/songs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSongs(prev => [res.data, ...prev]);
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Song uploaded successfully!');
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAudioFile(null);
    setCoverImage(null);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Song', 'Are you sure you want to delete this song?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/songs/${id}`);
            setSongs(prev => prev.filter(s => s._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete song');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>My Songs</Text>
          <View style={styles.titleAccent} />
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.uploadFab}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <SongCard song={item} onDelete={handleDelete} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cloud-upload-outline" size={60} color={colors.textDim} />
              <Text style={styles.emptyText}>No songs yet</Text>
              <Text style={styles.emptySubText}>Tap + to upload your first song</Text>
            </View>
          }
        />
      )}

      {/* Upload Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Song</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Cover image picker */}
              <TouchableOpacity onPress={pickCover} style={styles.coverPicker} activeOpacity={0.8}>
                {coverImage ? (
                  <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={colors.accent} />
                    <Text style={styles.coverPickerText}>Add Cover Art</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Song Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter song title"
                  placeholderTextColor={colors.textDim}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about this track..."
                  placeholderTextColor={colors.textDim}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Audio picker */}
              <TouchableOpacity onPress={pickAudio} style={styles.audioPicker} activeOpacity={0.8}>
                <Ionicons name={audioFile ? 'musical-note' : 'cloud-upload-outline'} size={24} color={colors.accent} />
                <View style={styles.audioPickerText}>
                  <Text style={styles.audioPickerTitle}>
                    {audioFile ? audioFile.name : 'Select MP3 File'}
                  </Text>
                  <Text style={styles.audioPickerSub}>
                    {audioFile ? 'Tap to change' : 'Tap to browse your files'}
                  </Text>
                </View>
                {audioFile && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleUpload} disabled={uploading} style={styles.uploadBtn}>
                <LinearGradient colors={[colors.accent, '#5A3FC0']} style={styles.uploadBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {uploading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={18} color={colors.white} />
                      <Text style={styles.uploadBtnText}>Upload Song</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xl + 4, paddingBottom: spacing.md },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  titleAccent: { width: 32, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginTop: 4 },
  uploadFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  songCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  songCover: { width: 56, height: 56, borderRadius: radius.sm },
  songCoverPlaceholder: { backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  songDetails: { flex: 1, marginLeft: spacing.sm },
  songTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  songDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  songMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  songDuration: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  songDate: { fontSize: 11, color: colors.textDim },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md },
  emptySubText: { fontSize: 14, color: colors.textDim, marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '90%', borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  coverPicker: { alignSelf: 'center', marginBottom: spacing.lg },
  coverPreview: { width: 120, height: 120, borderRadius: radius.md },
  coverPlaceholder: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  coverPickerText: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, color: colors.text, fontSize: 15 },
  textArea: { height: 90, paddingTop: 12 },
  audioPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent + '40', padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  audioPickerText: { flex: 1 },
  audioPickerTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  audioPickerSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  uploadBtn: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.lg },
  uploadBtnGradient: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  uploadBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
