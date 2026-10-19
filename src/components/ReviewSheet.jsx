// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Button, Icon, ErrorNote } from './UI';
import { formatBytes, pendingDeletions } from '../lib/cleanup';
export default function ReviewSheet({
  visible,
  onClose,
  session,
  stats,
  todayOnly = false,
}) {
  const { theme: t, demo } = useApp();
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setConfirm(false);
  }, [visible]);
  const pending = pendingDeletions(session.ledger);
  const bytes = pending.reduce((n, x) => n + (x.size || 0), 0),
    unknown = pending.filter((x) => x.size == null).length;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !session.busy && onClose()}
    >
      <Pressable
        onPress={() => !session.busy && onClose()}
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="Close review"
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: t.surface, paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: t.line }]} />
        <View style={styles.heading}>
          <View>
            <Text style={[styles.title, { color: t.ink }]}>
              {todayOnly ? 'Look at you go.' : 'A second look.'}
            </Text>
            <Text style={{ color: t.muted, fontSize: 13, marginTop: 7 }}>
              {todayOnly
                ? 'Every little decision adds up.'
                : `${pending.length} photo${pending.length === 1 ? '' : 's'} in your review tray`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close review"
            disabled={session.busy}
            onPress={onClose}
            style={{ padding: 10 }}
          >
            <Icon name="close" color={t.muted} />
          </Pressable>
        </View>
        {todayOnly ? (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          >
            <View style={[styles.hero, { backgroundColor: t.soft }]}>
              <Icon name="sparkles-outline" color={t.purple} size={40} />
              <Text
                style={{ color: t.ink, fontSize: 48, fontWeight: '800', marginTop: 12 }}
              >
                {stats.reviewed}
              </Text>
              <Text style={{ color: t.muted, fontSize: 14 }}>photos reviewed today</Text>
            </View>
            {[
              ['Kept for the memories', stats.kept],
              ['Successfully deleted', stats.deleted],
              ['Measured photo data removed', formatBytes(stats.bytes)],
            ].map(([label, value]) => (
              <View key={label} style={[styles.statRow, { borderBottomColor: t.line }]}>
                <Text style={{ color: t.muted, fontSize: 13, flex: 1 }}>{label}</Text>
                <Text style={{ color: t.ink, fontWeight: '800', fontSize: 17 }}>
                  {value}
                </Text>
              </View>
            ))}
            <Text
              style={{ color: t.muted, fontSize: 12, lineHeight: 20, marginVertical: 18 }}
            >
              Totals use your phone’s local day and saved cleanup history on this device.
              Removed data is the measured file size, not an immediate change in available
              device storage. Recently Deleted, cloud-only photos, and Live Photos may
              affect the actual space reclaimed.
              {stats.unknown
                ? ` Size was unavailable for ${stats.unknown} deleted photo(s); those bytes are excluded.`
                : ''}
            </Text>
            {demo && (
              <Text style={{ color: t.accent, fontSize: 12 }}>
                Demo progress only. No real photos have been deleted.
              </Text>
            )}
          </ScrollView>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
            >
              {pending.length ? (
                <>
                  <View style={[styles.summary, { backgroundColor: t.accentSoft }]}>
                    <Icon name="trash-outline" color={t.accent} />
                    <View>
                      <Text style={{ color: t.ink, fontWeight: '800', fontSize: 20 }}>
                        {formatBytes(bytes)}
                      </Text>
                      <Text style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>
                        measured size
                        {unknown
                          ? ` · ${unknown} size${unknown === 1 ? '' : 's'} unavailable`
                          : ''}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: t.muted,
                      fontSize: 12,
                      lineHeight: 19,
                      marginVertical: 14,
                    }}
                  >
                    Changed your mind? Restore any photo below. Your phone will ask you to
                    approve deletion.
                  </Text>
                  {pending.map((item) => (
                    <View
                      key={item.id}
                      style={[styles.item, { borderBottomColor: t.line }]}
                    >
                      <Image
                        source={{ uri: item.uri }}
                        style={{
                          width: 54,
                          height: 64,
                          borderRadius: 11,
                          backgroundColor: t.soft,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{ color: t.ink, fontWeight: '600', fontSize: 13 }}
                        >
                          {item.filename || 'Photo'}
                        </Text>
                        <Text style={{ color: t.muted, fontSize: 11, marginTop: 6 }}>
                          {formatBytes(item.size)}
                        </Text>
                      </View>
                      <Pressable
                        disabled={session.busy}
                        accessibilityRole="button"
                        accessibilityLabel={`Restore ${item.filename || 'photo'}`}
                        onPress={() => {
                          setConfirm(false);
                          session.restore(item.id);
                        }}
                        style={{ padding: 12 }}
                      >
                        <Icon name="return-up-back-outline" size={21} color={t.purple} />
                      </Pressable>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.empty}>
                  <Icon name="heart-outline" color={t.green} size={45} />
                  <Text
                    style={{
                      color: t.ink,
                      fontSize: 22,
                      fontWeight: '800',
                      marginTop: 20,
                    }}
                  >
                    Nothing to say goodbye to.
                  </Text>
                  <Text
                    style={{
                      color: t.muted,
                      textAlign: 'center',
                      lineHeight: 22,
                      marginTop: 10,
                    }}
                  >
                    Your left swipes will land here. You always get the final say.
                  </Text>
                </View>
              )}
            </ScrollView>
            <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
              <ErrorNote text={session.error} />
              {confirm && (
                <Text
                  accessibilityRole="alert"
                  style={{
                    color: t.accent,
                    lineHeight: 20,
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  Delete these {pending.length} photos from your library? Undo in Swipr
                  will no longer be available. Your phone may retain them in Recently
                  Deleted.
                </Text>
              )}
              {pending.length > 0 && (
                <Button
                  title={
                    demo
                      ? 'Demo · no real deletion'
                      : confirm
                        ? `Confirm deletion · ${pending.length} photos`
                        : `Review deletion · ${pending.length} photos`
                  }
                  icon="trash-outline"
                  loading={session.busy}
                  disabled={demo}
                  onPress={async () => {
                    if (!confirm) return setConfirm(true);
                    const success = await session.deletePending();
                    if (success) onClose();
                  }}
                />
              )}
              <Button
                title={confirm ? 'Go back' : 'Keep swiping'}
                variant="secondary"
                onPress={() => (confirm ? setConfirm(false) : onClose())}
                disabled={session.busy}
                style={{ marginTop: 10 }}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
// STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#14122488' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '87%',
    paddingTop: 12,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    padding: 18,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  empty: { alignItems: 'center', paddingVertical: 50 },
  hero: { alignItems: 'center', padding: 28, borderRadius: 22, marginBottom: 18 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
});
