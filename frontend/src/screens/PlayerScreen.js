import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { BASE_URL } from '../config/api';
import { colors, radius, spacing } from '../theme';

export default function PlayerScreen() {
  const { songId } = useLocalSearchParams();
  const router = useRouter();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    fetchSong();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [songId]);

  const fetchSong = async () => {
    try {
      const res = await api.get(`/songs/${songId}`);
      setSong(res.data);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const loadAndPlay = async () => {
    if (!song) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setBuffering(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `${BASE_URL}${song.audioFile}` },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            setPlaying(status.isPlaying);
            setBuffering(status.isBuffering);
            if (status.didJustFinish) setPlaying(false);
          }
        }
      );
      setSound(newSound);
      setPlaying(true);
      setBuffering(false);
    } catch (e) {
      setBuffering(false);
    }
  };

  const togglePlay = async () => {
    if (!sound) {
      await loadAndPlay();
      return;
    }
    if (playing) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const seek = async (val) => {
    if (sound && duration > 0) {
      await sound.setPositionAsync(val * duration);
    }
  };

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  const coverUri = song?.coverImage ? `${BASE_URL}${song.coverImage}` : null;

  return (
    <LinearGradient colors={['#1A0F3A', '#0A0A0F', '#0A0A0F']} style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-down" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.nowPlaying}>Now Playing</Text>

      {/* Cover art */}
      <View style={styles.coverContainer}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={[styles.cover, playing && styles.coverPlaying]} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder, playing && styles.coverPlaying]}>
            <Ionicons name="musical-notes" size={70} color={colors.accent} />
          </View>
        )}
        {/* Glow effect */}
        <View style={[styles.coverGlow, { opacity: playing ? 0.4 : 0.1 }]} />
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song?.title}</Text>
        <Text style={styles.songArtist}>{song?.owner?.username}</Text>
        {song?.description ? (
          <Text style={styles.songDesc} numberOfLines={2}>{song.description}</Text>
        ) : null}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          style={styles.progressBar}
          onPress={(e) => {
            const { locationX, nativeEvent } = e;
            seek(e.nativeEvent.locationX / 280);
          }}
          activeOpacity={1}
        >
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${Math.max(0, progress * 100 - 1)}%` }]} />
          </View>
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={async () => { if (sound) { await sound.setPositionAsync(0); } }} style={styles.controlBtn}>
          <Ionicons name="play-skip-back" size={28} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.playBtn} disabled={buffering}>
          <LinearGradient colors={[colors.accent, '#5A3FC0']} style={styles.playBtnGradient}>
            {buffering ? (
              <ActivityIndicator color={colors.white} size="large" />
            ) : (
              <Ionicons name={playing ? 'pause' : 'play'} size={32} color={colors.white} style={playing ? {} : { marginLeft: 4 }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={async () => { if (sound && duration) { await sound.setPositionAsync(duration); } }} style={styles.controlBtn}>
          <Ionicons name="play-skip-forward" size={28} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', marginTop: spacing.xl + 4, marginBottom: spacing.md },
  nowPlaying: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: spacing.xl },
  coverContainer: { position: 'relative', marginBottom: spacing.xl },
  cover: { width: 260, height: 260, borderRadius: radius.xl },
  coverPlaying: { shadowColor: colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 20 },
  coverPlaceholder: { backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  coverGlow: { position: 'absolute', width: 260, height: 260, borderRadius: radius.xl, backgroundColor: colors.accent },
  songInfo: { alignItems: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  songTitle: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  songArtist: { fontSize: 16, color: colors.accent, marginTop: 6, fontWeight: '600' },
  songDesc: { fontSize: 13, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  progressContainer: { width: '100%', marginBottom: spacing.xl },
  progressBar: { width: '100%', paddingVertical: 10 },
  progressTrack: { height: 4, backgroundColor: colors.bgElevated, borderRadius: 2, position: 'relative' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  progressThumb: { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.white, marginLeft: -8 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeText: { fontSize: 12, color: colors.textMuted },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  controlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  playBtn: { borderRadius: 40, overflow: 'hidden' },
  playBtnGradient: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
