// React screen/component. Behavior lives above the layout; styles are at the bottom.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Brand, Avatar, Button, Icon, ErrorNote } from '../src/components/UI';
import SettingsPanel from '../src/components/SettingsPanel';
import ReviewSheet from '../src/components/ReviewSheet';
import { usePhotoSession } from '../src/hooks/usePhotoSession';
import { dailyStats, localDay, formatBytes, pendingDeletions } from '../src/lib/cleanup';

export default function Home() {
  const { user, ready, demo, theme: t } = useApp();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.bg,
        }}
      >
        <ActivityIndicator color={t.accent} />
      </View>
    );
  if (!user && !demo) return <Redirect href="/login" />;
  return <PhotoHome key={demo ? 'demo' : user.uid} uid={user?.uid} />;
}
// JAVASCRIPT BEHAVIOR — photo session, cleanup totals, gestures, and modal state.
function PhotoHome({ uid }) {
  const { user, profile, theme: t, demo, setDemo, syncError } = useApp();
  const session = usePhotoSession(uid, demo),
    router = useRouter();
  const [settings, setSettings] = useState(false),
    [sheet, setSheet] = useState(null),
    [day, setDay] = useState(localDay());
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false),
    [imageFailed, setImageFailed] = useState(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth = Math.min(width, 480) - 48,
    cardHeight = Math.min(
      440,
      Math.max(
        session.current ? 220 : 320,
        height - insets.top - insets.bottom - 505 - (demo ? 40 : 0),
      ),
    );
  const position = useRef(new Animated.ValueXY()).current,
    animationLock = useRef(false),
    actionRef = useRef(null);
  const stats = dailyStats(session.ledger, day),
    pending = pendingDeletions(session.ledger);
  const swipedCount = Object.keys(session.ledger.decisions).length;
  const current = session.current,
    next = session.queue[1];
  const accessible =
    session.permission?.granted || session.permission?.accessPrivileges === 'limited';
  const webUnsupported = Platform.OS === 'web' && !demo;
  const disabled = !current || session.busy || animating || (!demo && !current.resolved);
  useEffect(() => {
    const timer = setInterval(() => setDay(localDay()), 30000);
    return () => clearInterval(timer);
  }, []);
  // Reset before painting the next photo, so the outgoing photo cannot flash back.
  useLayoutEffect(() => {
    position.setValue({ x: 0, y: 0 });
  }, [current?.id, position]);
  function reset() {
    if (animationLock.current) return;
    position.stopAnimation();
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: Platform.OS !== 'web',
      stiffness: 220,
      damping: 26,
      mass: 1,
      overshootClamping: true,
    }).start();
  }
  async function forceSwipe(direction) {
    if (animationLock.current) return;
    if (disabled) return reset();
    const photo = current;
    animationLock.current = true;
    setAnimating(true);
    position.stopAnimation();
    Animated.timing(position, {
      toValue: { x: (direction === 'right' ? 1 : -1) * (cardWidth + 120), y: 12 },
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start(async (result) => {
      let saved = false;
      try {
        if (result.finished) {
          saved = await session.swipe(photo, direction);
          if (saved && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        }
      } finally {
        // A successful swipe resets when the next photo is rendered above.
        if (!saved) position.setValue({ x: 0, y: 0 });
        animationLock.current = false;
        setAnimating(false);
      }
    });
  }
  // The responder reads the latest callbacks instead of capturing the first photo.
  actionRef.current = { forceSwipe, disabled, reset };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          !animationLock.current &&
          !actionRef.current.disabled &&
          Math.abs(g.dx) > 8 &&
          Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          setDragging(true);
          position.stopAnimation();
        },
        onPanResponderMove: (_, g) => {
          if (!animationLock.current) position.setValue({ x: g.dx, y: g.dy * 0.15 });
        },
        onPanResponderRelease: (_, g) => {
          setDragging(false);
          if (animationLock.current) return;
          const draggedFarEnough = Math.abs(g.dx) > cardWidth * 0.18;

          const quickFlick =
            Math.abs(g.dx) > 15 &&
            Math.abs(g.vx) > 0.5 &&
            Math.sign(g.dx) === Math.sign(g.vx);

          if (draggedFarEnough || quickFlick) {
            actionRef.current.forceSwipe(g.dx > 0 ? 'right' : 'left');
          } else {
            actionRef.current.reset();
          }
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          setDragging(false);
          actionRef.current.reset();
        },
      }),
    [cardWidth],
  );
  const rotate = position.x.interpolate({
    inputRange: [-cardWidth, 0, cardWidth],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });
  const leftOpacity = position.x.interpolate({
    inputRange: [-cardWidth * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const rightOpacity = position.x.interpolate({
    inputRange: [0, cardWidth * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const canUndo = Object.values(session.ledger.decisions).some(
    (x) => x.direction !== 'deleted',
  );
  // REACT LAYOUT — header, progress card, photo deck, actions, and navigation.
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.bg }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.frame}>
        <ScrollView
          scrollEnabled={!dragging && !animating}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Brand small />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <Text style={{ color: t.muted, fontSize: 12 }}>
                Hey, {demo ? 'explorer' : profile?.username || user?.displayName || 'you'}
              </Text>
              <Avatar
                profile={demo ? { username: 'Explorer' } : profile}
                onPress={() => setSettings(true)}
              />
            </View>
          </View>
          {demo && (
            <View style={[styles.demo, { backgroundColor: t.soft }]}>
              <Icon name="flask-outline" size={14} color={t.purple} />
              <Text style={{ color: t.purple, fontSize: 11, flex: 1 }}>
                Demo mode · sample photos · no real deletion
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDemo(false);
                  router.replace('/');
                }}
              >
                <Text
                  style={{ color: t.purple, fontSize: 11, fontWeight: '800', padding: 5 }}
                >
                  Exit
                </Text>
              </Pressable>
            </View>
          )}
          <View style={styles.intro}>
            <View>
              <Text style={[styles.eyebrow, { color: t.accent }]}>
                A LITTLE LESS, A LITTLE BETTER
              </Text>
              <Text style={[styles.title, { color: t.ink }]}>Keep the good stuff.</Text>
            </View>
            <View style={[styles.flower, { backgroundColor: t.accentSoft }]}>
              <Icon name="flower-outline" color={t.accent} size={24} />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View today's cleanup progress"
            onPress={() => setSheet('today')}
            style={[
              styles.statsCard,
              { backgroundColor: t.surface, borderColor: t.line },
            ]}
          >
            <View style={styles.statsRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.statLabel}>
                  <Icon name="leaf-outline" color={t.green} size={14} />
                  <Text
                    style={{
                      color: t.muted,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1,
                    }}
                  >
                    CLEANED TODAY
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: t.ink }]}>
                  {formatBytes(stats.bytes)}
                </Text>
                <Text style={{ color: t.muted, fontSize: 10 }}>
                  measured photo data removed
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.line }]} />
              <View>
                <View style={styles.statLabel}>
                  <Icon name="checkmark-done-outline" color={t.purple} size={15} />
                  <Text
                    style={{
                      color: t.muted,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1,
                    }}
                  >
                    REVIEWED
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: t.ink }]}>
                  {swipedCount}
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '400',
                      color: t.muted,
                      padding: 5
                    }}
                  >
                    {' '}
                    photos swiped
                  </Text>
                </Text>
              </View>
            </View>
          </Pressable>
          <View style={styles.libraryHeading}>
            <Text style={{ color: t.ink, fontWeight: '800', fontSize: 15 }}>
              Your camera roll
            </Text>
            <View style={[styles.count, { backgroundColor: t.soft }]}>
              <Text style={{ color: t.purple, fontSize: 10, fontWeight: '700' }}>
                {demo
                  ? '5 sample photos'
                  : accessible
                    ? `${session.total} photos available`
                    : 'Your photos, your call'}
              </Text>
            </View>
          </View>
          {session.permission?.accessPrivileges === 'limited' && !demo && (
            <Text style={{ color: t.muted, fontSize: 11, marginBottom: 10 }}>
              Showing your selected photos. Add more in photo permissions.
            </Text>
          )}
          <View
            style={{
              height: cardHeight + 10,
              width: cardWidth,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          >
            {current && !webUnsupported ? (
              <>
                {next && (
                  <View
                    style={[
                      styles.photoCard,
                      {
                        backgroundColor: t.card,
                        height: cardHeight,
                        transform: [{ scale: 0.955 }, { translateY: 10 }],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: next.uri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="contain"
                    />
                  </View>
                )}
                <Animated.View
                  {...responder.panHandlers}
                  style={[
                    styles.photoCard,
                    {
                      height: cardHeight,
                      backgroundColor: t.card,
                      transform: [
                        { translateX: position.x },
                        { translateY: position.y },
                        { rotate },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: current.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="contain"
                    onError={() => setImageFailed(current.id)}
                  />
                  {imageFailed === current.id && (
                    <View style={styles.imageError}>
                      <Icon name="cloud-outline" color={t.purple} size={44} />
                      <Text style={{ color: t.ink, fontWeight: '700', marginTop: 12 }}>
                        Photo preview unavailable
                      </Text>
                      <Text
                        style={{
                          color: t.muted,
                          fontSize: 12,
                          textAlign: 'center',
                          lineHeight: 19,
                          padding: 20,
                        }}
                      >
                        This may be an iCloud photo. You can keep it or refresh after
                        downloading it in Photos.
                      </Text>
                    </View>
                  )}
                  <LinearGradient
                    pointerEvents="none"
                    colors={['transparent', '#171525CC']}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 140,
                    }}
                  />
                  <View pointerEvents="none" style={styles.cardTop}>
                    <View style={styles.photoTag}>
                      <Icon name="image-outline" color="white" size={13} />
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 10 }}>
                        {current.live
                          ? 'LIVE PHOTO'
                          : current.cloud
                            ? 'ICLOUD PHOTO'
                            : demo
                              ? 'SAMPLE PHOTO'
                              : 'PHOTO'}
                      </Text>
                    </View>
                    <View style={styles.photoTag}>
                      <Text style={{ color: 'white', fontSize: 10 }}>
                        {formatBytes(current.size)}
                      </Text>
                    </View>
                  </View>
                  <View pointerEvents="none" style={styles.cardBottom}>
                    <Text
                      numberOfLines={1}
                      style={{ color: 'white', fontSize: 16, fontWeight: '700' }}
                    >
                      {current.filename || 'A moment worth a look'}
                    </Text>
                    <Text style={{ color: '#FFFFFFBB', fontSize: 11, marginTop: 5 }}>
                      {current.creationTime
                        ? new Date(current.creationTime).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'From your photo library'}
                    </Text>
                  </View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.swipeStamp,
                      {
                        left: 24,
                        backgroundColor: '#DA4167',
                        opacity: leftOpacity,
                        transform: [{ rotate: '-10deg' }],
                      },
                    ]}
                  >
                    <Icon name="close" color="white" />
                    <Text style={styles.stampText}>REVIEW</Text>
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.swipeStamp,
                      {
                        right: 24,
                        backgroundColor: '#3A806B',
                        opacity: rightOpacity,
                        transform: [{ rotate: '10deg' }],
                      },
                    ]}
                  >
                    <Icon name="heart" color="white" />
                    <Text style={styles.stampText}>KEEP</Text>
                  </Animated.View>
                </Animated.View>
              </>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { height: cardHeight, backgroundColor: t.surface, borderColor: t.line },
                ]}
              >
                {session.loading || !session.ready ? (
                  <>
                    <ActivityIndicator size="large" color={t.purple} />
                    <Text style={{ color: t.muted, marginTop: 16 }}>
                      Finding your moments…
                    </Text>
                  </>
                ) : webUnsupported ? (
                  <>
                    <Icon name="phone-portrait-outline" size={50} color={t.purple} />
                    <Text style={[styles.emptyTitle, { color: t.ink }]}>
                      Made for your phone.
                    </Text>
                    <Text style={[styles.emptyBody, { color: t.muted }]}>
                      Use the iPhone or Android app to clean your real photo library. You
                      can explore the design here.
                    </Text>
                    <Button title="Try the demo" onPress={() => setDemo(true)} />
                  </>
                ) : !accessible && !demo ? (
                  <>
                    <Icon name="images-outline" size={46} color={t.purple} />
                    <Text style={[styles.emptyTitle, { color: t.ink }]}>
                      Let your photos in.
                    </Text>
                    <Text style={[styles.emptyBody, { color: t.muted }]}>
                      Give Swipr access to all or a few photos. They stay on your device,
                      and you approve every deletion.
                    </Text>
                    <Button
                      title={
                        session.permission?.canAskAgain === false
                          ? 'Open phone settings'
                          : 'Connect my photos'
                      }
                      icon="lock-open-outline"
                      onPress={
                        session.permission?.canAskAgain === false
                          ? () => Linking.openSettings()
                          : session.requestAccess
                      }
                    />
                  </>
                ) : (
                  <>
                    <Icon name="sparkles-outline" size={46} color={t.green} />
                    <Text style={[styles.emptyTitle, { color: t.ink }]}>
                      Room to breathe.
                    </Text>
                    <Text style={[styles.emptyBody, { color: t.muted }]}>
                      {pending.length
                        ? 'You’ve reviewed these photos. Take a final look at your tray to finish cleaning.'
                        : 'You’ve reviewed all accessible photos. Come back for your next little cleanup.'}
                    </Text>
                    <Button
                      title={
                        pending.length
                          ? 'Open review tray'
                          : demo
                            ? 'Explore settings'
                            : 'Refresh photos'
                      }
                      variant="secondary"
                      onPress={() =>
                        pending.length
                          ? setSheet('review')
                          : demo
                            ? setSettings(true)
                            : session.refresh()
                      }
                    />
                  </>
                )}
              </View>
            )}
          </View>
          <View style={styles.hints}>
            <Text style={{ color: t.muted, fontSize: 10 }}>← swipe left to delete</Text>
            <Text style={{ color: t.muted, fontSize: 10 }}>swipe right to keep →</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swipe left to queue photo for deletion"
              disabled={disabled}
              onPress={() => forceSwipe('left')}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: t.accentSoft,
                  opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Icon name="close" color={t.accent} size={27} />
              <Text style={{ color: t.accent, fontWeight: '800', fontSize: 14 }}>
                Delete
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo last swipe"
              disabled={!canUndo || session.busy || animating}
              onPress={session.undo}
              style={[
                styles.undo,
                {
                  backgroundColor: t.surface,
                  borderColor: t.line,
                  opacity: !canUndo || session.busy || animating ? 0.35 : 1,
                },
              ]}
            >
              <Icon name="arrow-undo-outline" color={t.purple} size={22} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swipe right to keep photo"
              disabled={disabled}
              onPress={() => forceSwipe('right')}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: t.greenSoft,
                  opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Icon name="heart-outline" color={t.green} size={25} />
              <Text style={{ color: t.green, fontWeight: '800', fontSize: 14 }}>
                Keep
              </Text>
            </Pressable>
          </View>
          <Text
            style={{ color: t.muted, textAlign: 'center', fontSize: 10, marginTop: 12 }}
          >
            Nothing is deleted until you confirm in Review.
          </Text>
          <ErrorNote text={session.error} />
          {syncError && !demo && (
            <Pressable onPress={() => setSettings(true)} accessibilityRole="button">
              <Text style={{ color: t.muted, fontSize: 11, paddingTop: 12 }}>
                Profile sync needs attention · open settings
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <View
          style={[styles.nav, { backgroundColor: t.surface, borderTopColor: t.line }]}
        >
          {[
            ['albums-outline', 'Clean', null],
            ['file-tray-outline', 'Review', 'review'],
            ['pie-chart-outline', 'Today', 'today'],
          ].map(([icon, label, tab]) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={
                label === 'Review' ? `Review ${pending.length} pending photos` : label
              }
              onPress={() => (tab ? setSheet(tab) : session.refresh())}
              style={styles.navItem}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={icon} color={tab ? t.muted : t.accent} size={21} />
                {tab === 'review' && pending.length > 0 && (
                  <View
                    style={{
                      backgroundColor: t.accent,
                      borderRadius: 8,
                      minWidth: 16,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '800' }}>
                      {pending.length}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  color: tab ? t.muted : t.accent,
                  fontSize: 10,
                  fontWeight: '700',
                  marginTop: 5,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <SettingsPanel
        visible={settings}
        onClose={() => setSettings(false)}
        onRefresh={session.refresh}
        limited={session.permission?.accessPrivileges === 'limited'}
      />
      <ReviewSheet
        visible={!!sheet}
        onClose={() => setSheet(null)}
        session={session}
        stats={stats}
        todayOnly={sheet === 'today'}
      />
    </SafeAreaView>
  );
}
// STYLES — React Native’s CSS-like layout, colors, spacing, and typography.
const styles = StyleSheet.create({
  frame: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    padding: 8,
    marginBottom: 15,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: { fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginBottom: 7 },
  title: { fontSize: 25, fontWeight: '800', lineHeight: 30, letterSpacing: -0.9 },
  flower: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  statsCard: { borderRadius: 21, padding: 12, borderWidth: 1, marginBottom: 12 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  statValue: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.9,
    marginTop: 7,
    marginBottom: 4,
  },
  statDivider: { width: 1, height: 54, marginHorizontal: 16 },
  libraryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  count: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  photoCard: {
    width: '100%',
    position: 'absolute',
    borderRadius: 25,
    overflow: 'hidden',
    boxShadow: '0 8px 18px #25233F13',
  },
  cardTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
    borderRadius: 9,
    backgroundColor: '#17152566',
  },
  cardBottom: { position: 'absolute', bottom: 22, left: 20, right: 20 },
  swipeStamp: {
    position: 'absolute',
    top: 65,
    borderRadius: 12,
    padding: 12,
    gap: 5,
    alignItems: 'center',
    flexDirection: 'row',
  },
  stampText: { color: 'white', fontWeight: '900', fontSize: 21 },
  imageError: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  action: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  undo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  navItem: { alignItems: 'center', minWidth: 80, paddingVertical: 2 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 17,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
});
