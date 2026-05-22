import { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const { height } = Dimensions.get("window");
const { width } = Dimensions.get("window");

const SWIPE_THRESHOLD = width * 0.25;
const SWIPE_OUT_DURATION = 250;

const MOCK_PHOTOS = [
  { id: 1, uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600" },
  { id: 2, uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600" },
  { id: 3, uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600" },
  { id: 4, uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600" },
  { id: 5, uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600" },
];

const getStoragePercent = (used, total) => `${((used / total) * 100).toFixed(1)}%`;

export default function Home() {
  const [photos, setPhotos] = useState(MOCK_PHOTOS);
  const [storageFreed, setStorageFreed] = useState(243);
  const [reviewed, setReviewed] = useState(53);
  const [username] = useState("LaMont");
  const [profileImage, setProfileImage] = useState(null);

  const usedStorage = 0.2;
  const totalStorage = 12.4;

  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp",
  });

  const deleteOpacity = position.x.interpolate({
    inputRange: [-width / 3, 0],
    outputRange: [0.85, 0],
    extrapolate: "clamp",
  });

  const keepOpacity = position.x.interpolate({
    inputRange: [0, width / 3],
    outputRange: [0, 0.85],
    extrapolate: "clamp",
  });

  const cardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1.02, 1, 1.02],
    extrapolate: "clamp",
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 6,
    }).start();
  };

  const onSwipeComplete = useCallback(
    (direction) => {
      setPhotos((prev) => prev.slice(1));
      position.setValue({ x: 0, y: 0 });
      setReviewed((r) => r + 1);
      if (direction === "left") {
        setStorageFreed((s) => s + Math.floor(Math.random() * 8 + 2));
      }
    },
    [position]
  );

  const forceSwipe = useCallback(
    (direction) => {
      const x = direction === "right" ? width * 1.5 : -width * 1.5;
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => onSwipeComplete(direction));
    },
    [position, onSwipeComplete]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const handleDelete = () => forceSwipe("left");
  const handleKeep = () => forceSwipe("right");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access your photo library is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
      { scale: cardScale },
    ],
  };

  const currentPhoto = photos[0];
  const nextPhoto = photos[1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{username}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={pickImage} activeOpacity={0.8}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarIcon}>👤</Text>
          )}
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>+</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>STORAGE FREED</Text>
            <Text style={styles.statsValue}>{storageFreed} MB</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRight}>
            <Text style={styles.statsLabel}>REVIEWED</Text>
            <Text style={styles.statsValue}>{reviewed}</Text>
          </View>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: getStoragePercent(usedStorage, totalStorage) }]} />
        </View>
        <Text style={styles.storageText}>12.2 GB remaining of 12.4 GB</Text>
      </View>

      <View style={styles.swipeHints}>
        <Text style={styles.swipeHint}>swipe left to delete </Text>
        <Text style={styles.swipeHint}>swipe right to keep</Text>
      </View>

      <View style={styles.cardContainer}>
        {nextPhoto && (
          <View style={[styles.card, styles.cardBack]}>
            <Image source={{ uri: nextPhoto.uri }} style={styles.cardImage} />
          </View>
        )}

        {currentPhoto ? (
          <Animated.View
            style={[styles.card, cardStyle]}
            {...panResponder.panHandlers}
          >
            <Image source={{ uri: currentPhoto.uri }} style={styles.cardImage} />
            <Animated.View style={[styles.overlay, styles.deleteOverlay, { opacity: deleteOpacity }]} />
            <Animated.View style={[styles.overlay, styles.keepOverlay, { opacity: keepOpacity }]} />
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>All cleaned up!</Text>
            <Text style={styles.emptySubtitle}>You've reviewed all your photos.</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keepBtn} onPress={handleKeep} activeOpacity={0.85}>
          <Text style={styles.actionBtnText}>Keep</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <View style={[styles.navIcon, styles.navIconActive]}>
            <Text style={styles.navIconText}>⌂</Text>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F3F7",
    paddingTop: 44,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E61A5F",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3D3A8C",
    marginTop: -4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E0EE",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarIcon: {
    fontSize: 22,
    color: "#9090B0",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#4B48C8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F2F3F7",
  },
  avatarBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  statsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAAAC0",
    letterSpacing: 0.8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A3A",
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#EEEEF5",
    marginHorizontal: 20,
  },
  statsRight: {
    alignItems: "flex-end",
    flex: 1,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#F0F0F8",
    borderRadius: 2,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#4B48C8",
    borderRadius: 2,
  },
  storageText: {
    fontSize: 11,
    color: "#AAAAC0",
  },
  swipeHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 12,
    color: "#AAAAC0",
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  card: {
    position: "absolute",
    width: width - 32,
    height: (width - 32) * 0.95,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    backgroundColor: "#fff",
  },
  cardBack: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  deleteOverlay: {
    backgroundColor: "#FF6B35",
  },
  keepOverlay: {
    backgroundColor: "#2ECC71",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3D3A8C",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#AAAAC0",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#E61A5F",
    paddingVertical: 13,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#E61A5F",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  keepBtn: {
    flex: 1,
    backgroundColor: "#F5A623",
    paddingVertical: 13,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#F5A623",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingBottom: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F8",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  navIconActive: {
    backgroundColor: "#FFF3E0",
  },
  navIconText: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#AAAAC0",
  },
  navLabelActive: {
    color: "#F5A623",
  },
});
