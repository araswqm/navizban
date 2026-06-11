import React, { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/context/ThemeContext";
import { IZBAN_STATIONS, Station } from "@/constants/izban";
import { useNavizban } from "@/context/NavizbanContext";

interface StationPickerProps {
  visible: boolean;
  onClose: () => void;
  mode: "boarding" | "destination";
}

interface StationRowProps {
  station: Station;
  isSelected: boolean;
  isOpposite: boolean;
  mode: "boarding" | "destination";
  onSelect: (s: Station) => void;
}

function StationRow({ station, isSelected, isOpposite, mode, onSelect }: StationRowProps) {
  const { C } = useTheme();
  const selectedColor = mode === "boarding" ? C.success : C.accent;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.stationRow,
        { borderBottomColor: C.border },
        isSelected && { backgroundColor: mode === "boarding" ? C.successMuted : C.surfaceTint, borderRadius: 10, borderBottomColor: "transparent", paddingHorizontal: 10 },
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => onSelect(station)}
    >
      <View style={[
        styles.stationDot,
        { backgroundColor: isSelected ? selectedColor : C.stationInactive },
        isSelected && { shadowColor: selectedColor, shadowRadius: 5, shadowOpacity: 0.7 },
      ]} />
      <Text style={[styles.stationName, { color: isSelected ? C.text : C.textSecondary }, isSelected && { fontFamily: "Inter_600SemiBold" }]}>
        {station.name}
      </Text>
      {isOpposite && (
        <View style={[styles.badge, { backgroundColor: mode === "boarding" ? C.accentGlow : C.successMuted }]}>
          <Text style={[styles.badgeText, { color: mode === "boarding" ? C.accent : C.success }]}>
            {mode === "boarding" ? "varış" : "biniş"}
          </Text>
        </View>
      )}
      {isSelected && (
        <Ionicons name="checkmark-circle" size={18} color={selectedColor} />
      )}
    </Pressable>
  );
}

export function StationPicker({ visible, onClose, mode }: StationPickerProps) {
  const insets = useSafeAreaInsets();
  const { C } = useTheme();
  const { destinationStation, boardingStation, boardingMode, setDestination, setBoardingManual, setBoardingGps } = useNavizban();
  const [search, setSearch] = useState("");

  const filtered = IZBAN_STATIONS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDestSelect = useCallback((station: Station) => {
    if (station.id === boardingStation.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDestination(station);
    onClose();
    setSearch("");
  }, [boardingStation, setDestination, onClose]);

  const handleBoardingSelect = useCallback((station: Station) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBoardingManual(station);
    onClose();
    setSearch("");
  }, [setBoardingManual, onClose]);

  const handleGpsSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBoardingGps();
    onClose();
    setSearch("");
  }, [setBoardingGps, onClose]);

  const title = mode === "boarding" ? "Biniş İstasyonu" : "Varış İstasyonu";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <BlurView intensity={85} tint={C.blurTint} style={StyleSheet.absoluteFill} />
        <View style={[styles.handle, { backgroundColor: C.border }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: C.backgroundElevated }]} hitSlop={12}>
            <Feather name="x" size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        {mode === "boarding" && (
          <Pressable
            style={({ pressed }) => [
              styles.gpsRow,
              {
                backgroundColor: boardingMode === "gps" ? C.successMuted : C.surfaceTint,
                borderColor: boardingMode === "gps" ? C.success : C.border,
              },
              pressed && { opacity: 0.75 },
            ]}
            onPress={handleGpsSelect}
          >
            <Ionicons name="locate" size={16} color={boardingMode === "gps" ? C.success : C.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.gpsTitle, { color: boardingMode === "gps" ? C.success : C.text }]}>
                GPS Konumu (Otomatik)
              </Text>
              <Text style={[styles.gpsSub, { color: C.textMuted }]}>
                En yakın istasyon otomatik belirlenir
              </Text>
            </View>
            {boardingMode === "gps" && (
              <Ionicons name="checkmark-circle" size={18} color={C.success} />
            )}
          </Pressable>
        )}

        <View style={[styles.searchContainer, { backgroundColor: C.backgroundElevated }]}>
          <Feather name="search" size={16} color={C.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="İstasyon ara..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x-circle" size={16} color={C.textMuted} />
            </Pressable>
          )}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            mode === "boarding" ? (
              <StationRow
                station={item}
                isSelected={boardingStation.id === item.id && boardingMode === "manual"}
                isOpposite={destinationStation.id === item.id}
                mode="boarding"
                onSelect={handleBoardingSelect}
              />
            ) : (
              <StationRow
                station={item}
                isSelected={destinationStation.id === item.id}
                isOpposite={boardingStation.id === item.id}
                mode="destination"
                onSelect={handleDestSelect}
              />
            )
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "76%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gpsTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  gpsSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  list: {
    flex: 1,
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  stationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
