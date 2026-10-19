// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
export const Icon = ({ name, size = 22, color, ...props }) => (
  <Ionicons name={name} size={size} color={color || '#25233F'} {...props} />
);
export function Brand({ small = false }) {
  const { theme: t } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View
        style={{
          width: small ? 28 : 38,
          height: small ? 28 : 38,
          backgroundColor: t.accent,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-8deg' }],
        }}
      >
        <Icon name="albums-outline" size={small ? 17 : 24} color="#fff" />
      </View>
      <Text
        style={{
          color: t.ink,
          fontSize: small ? 22 : 28,
          fontWeight: '800',
          letterSpacing: -1,
        }}
      >
        swipr<Text style={{ color: t.accent }}>.</Text>
      </Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}) {
  const { theme: t } = useApp();
  const color = variant === 'primary' ? '#fff' : variant === 'danger' ? t.accent : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            variant === 'primary'
              ? t.accent
              : variant === 'danger'
                ? t.accentSoft
                : t.soft,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Icon name={icon} color={color} size={20} />}
          <Text style={{ color, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
export function Avatar({ profile, size = 44, onPress }) {
  const { theme: t } = useApp();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel="Open profile and settings"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.soft,
        borderWidth: 2,
        borderColor: t.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {profile?.photoData ? (
        <Image
          source={{ uri: profile.photoData }}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Text style={{ color: t.purple, fontSize: size / 2.5, fontWeight: '800' }}>
          {(profile?.username || 'S')[0].toUpperCase()}
        </Text>
      )}
    </Pressable>
  );
}
export function ErrorNote({ text }) {
  const { theme: t } = useApp();
  return text ? (
    <Text
      accessibilityRole="alert"
      style={{ color: t.accent, fontSize: 13, lineHeight: 20, marginVertical: 8 }}
    >
      {text}
    </Text>
  ) : null;
}
export // STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
});
