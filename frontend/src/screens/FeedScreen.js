import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { colors, radius, spacing } from '../theme';

function PublicationCard({ item, currentUserId, onDelete, onLike }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(item.comments || []);
  const [posting, setPosting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLiked(item.likes?.includes(currentUserId) || false);
  }, [currentUserId, item.likes]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/publications/${item._id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (e) {}
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/publications/${item._id}/comment`, { text: comment.trim() });
      setComments(prev => [...prev, res.data]);
      setComment('');
    } catch (e) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const coverUri = item.song?.coverImage ? `${BASE_URL}${item.song.coverImage}` : null;
  const authorPic = item.author?.profilePic ? `${BASE_URL}${item.author.profilePic}` : null;
  const isOwner = item.author?._id === currentUserId;

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          {authorPic ? (
            <Image source={{ uri: authorPic }} style={styles.authorPic} />
          ) : (
            <View style={[styles.authorPic, styles.authorPicPlaceholder]}>
              <Ionicons name="person" size={14} color={colors.textMuted} />
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{item.author?.username}</Text>
            <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={() => onDelete(item._id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={17} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Song card */}
      <View style={styles.songRow}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.songCover} />
        ) : (
          <View style={[styles.songCover, styles.songCoverPlaceholder]}>
            <Ionicons name="musical-note" size={20} color={colors.accent} />
          </View>
        )}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.song?.title}</Text>
          <Text style={styles.songOwner} numberOfLines={1}>{item.song?.owner?.username}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/player', params: { songId: item.song?._id, pubId: item._id } })}
          style={styles.playBtn}
        >
          <Ionicons name="play" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Title & description */}
      <Text style={styles.pubTitle}>{item.title}</Text>
      {item.description ? <Text style={styles.pubDesc} numberOfLines={2}>{item.description}</Text> : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.error : colors.textMuted} />
          <Text style={[styles.actionCount, liked && { color: colors.error }]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={19} color={colors.textMuted} />
          <Text style={styles.actionCount}>{comments.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentsSection}>
          {comments.map((c, i) => (
            <View key={i} style={styles.commentRow}>
              <Text style={styles.commentUser}>{c.user?.username || 'User'}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textDim}
              value={comment}
              onChangeText={setComment}
              onSubmitEditing={handleComment}
            />
            <TouchableOpacity onPress={handleComment} disabled={posting} style={styles.sendBtn}>
              {posting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="send" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const socket = useSocket();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.get('/publications');
      setPublications(res.data.publications || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new-publication', (newPublication) => {
      setPublications(prev => [newPublication, ...prev]);
    });

    socket.on('publication-liked', ({ publicationId, likesCount, likedBy }) => {
      setPublications(prev => prev.map(pub => 
        pub._id === publicationId 
          ? { ...pub, likes: pub.likes || [], likesCount }
          : pub
      ));
    });

    socket.on('publication-commented', ({ publicationId, comment }) => {
      setPublications(prev => prev.map(pub => 
        pub._id === publicationId 
          ? { ...pub, comments: [...(pub.comments || []), comment] }
          : pub
      ));
    });

    return () => {
      socket.off('new-publication');
      socket.off('publication-liked');
      socket.off('publication-commented');
    };
  }, [socket]);

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Remove this publication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/publications/${id}`);
            setPublications(prev => prev.filter(p => p._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Feed</Text>
        <View style={styles.titleAccent} />
      </View>
      <FlatList
        data={publications}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <PublicationCard
            item={item}
            currentUserId={user?.id}
            onDelete={handleDelete}
            onLike={() => {}}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeed(); }} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="musical-notes-outline" size={60} color={colors.textDim} />
            <Text style={styles.emptyText}>No publications yet</Text>
            <Text style={styles.emptySubText}>Be the first to share your music!</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl + 4, paddingBottom: spacing.md },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  titleAccent: { width: 32, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginTop: 4 },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, marginBottom: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorPic: { width: 36, height: 36, borderRadius: 18 },
  authorPicPlaceholder: { backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  deleteBtn: { padding: 6 },
  songRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.sm, gap: spacing.sm,
  },
  songCover: { width: 48, height: 48, borderRadius: radius.sm },
  songCoverPlaceholder: { backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  songOwner: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  pubTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  pubDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13, color: colors.textMuted },
  commentsSection: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  commentRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  commentUser: { fontSize: 13, fontWeight: '700', color: colors.accent },
  commentText: { fontSize: 13, color: colors.text, flex: 1 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  commentInput: { flex: 1, height: 38, backgroundColor: colors.bgElevated, borderRadius: radius.sm, paddingHorizontal: spacing.sm, color: colors.text, fontSize: 13, borderWidth: 1, borderColor: colors.border },
  sendBtn: { padding: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md },
  emptySubText: { fontSize: 14, color: colors.textDim, marginTop: 4 },
});
