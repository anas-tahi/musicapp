import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      if (profileImage) {
        const filename = profileImage.uri.split('/').pop();
        const ext = filename.split('.').pop();
        formData.append('image', {
          uri: profileImage.uri,
          type: `image/${ext}`,
          name: filename,
        });
      }
      await register(formData);
      router.replace('/(tabs)/feed');
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#0D0B1A', '#0A0A0F']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Profile Pic */}
          <TouchableOpacity onPress={pickImage} style={styles.avatarArea} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage.uri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={28} color={colors.accent} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="add" size={14} color={colors.white} />
            </View>
            <Text style={styles.avatarLabel}>Add Profile Photo</Text>
          </TouchableOpacity>

          <View style={styles.formCard}>
            {[
              { label: 'Username', value: username, setter: setUsername, icon: 'person-outline', placeholder: 'your_username', autoCapitalize: 'none' },
              { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'you@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
            ].map(({ label, value, setter, icon, placeholder, ...rest }) => (
              <View key={label} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.inputRow}>
                  <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textDim}
                    value={value}
                    onChangeText={setter}
                    autoCorrect={false}
                    {...rest}
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[colors.accent, '#5A3FC0']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.loginLink} activeOpacity={0.7}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl, marginTop: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  avatarArea: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.accent },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.accent + '60', borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute', bottom: 24, right: '33%',
    backgroundColor: colors.accent, borderRadius: 12,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  avatarLabel: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  formCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, height: 48, color: colors.text, fontSize: 15 },
  eyeBtn: { padding: 4 },
  registerBtn: { marginTop: spacing.sm, borderRadius: radius.md, overflow: 'hidden' },
  btnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: spacing.lg },
  loginText: { color: colors.textMuted, fontSize: 14 },
});
