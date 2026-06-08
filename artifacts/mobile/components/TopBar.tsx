import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useTheme, Colors } from "../context/ThemeContext";
import { NORTHBOUND_STATIONS } from "@workspace/navizban-core";

interface Props {
  fromIndex: number;
  toIndex: number;
  onFromChange: (idx: number) => void;
  onToChange: (idx: number) => void;
}

export function TopBar({ fromIndex, toIndex, onFromChange, onToChange }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);

  const stations = NORTHBOUND_STATIONS;

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
      {/* Biniş */}
      <TouchableOpacity
        style={styles.stationBox}
        onPress={() => setShowPicker("from")}
      >
        <Text style={[styles.label, { color: c.textSecondary }]}>Biniş</Text>
        <Text style={[styles.stationName, { color: c.text }]} numberOfLines={1}>
          {stations[fromIndex]?.name ?? "Seçin"}
        </Text>
        <Text style={[styles.time, { color: c.primary }]}>
          {stations[fromIndex]?.arrivalMinutes ?? 0}dk
        </Text>
      </TouchableOpacity>

      {/* Ok */}
      <View style={styles.arrowContainer}>
        <Text style={[styles.arrow, { color: c.textSecondary }]}>→</Text>
      </View>

      {/* Varış */}
      <TouchableOpacity
        style={styles.stationBox}
        onPress={() => setShowPicker("to")}
      >
        <Text style={[styles.label, { color: c.textSecondary }]}>Varış</Text>
        <Text style={[styles.stationName, { color: c.text }]} numberOfLines={1}>
          {stations[toIndex]?.name ?? "Seçin"}
        </Text>
        <Text style={[styles.time, { color: c.primary }]}>
          {stations[toIndex]?.arrivalMinutes ?? 0}dk
        </Text>
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal
        visible={showPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(null)}
      >
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {showPicker === "from" ? "Biniş İstasyonu" : "Varış İstasyonu"}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: c.border }]}
              onPress={() => setShowPicker(null)}
            >
              <Text style={[styles.closeButtonText, { color: c.textSecondary }]}>Kapat</Text>
            </TouchableOpacity>
            {stations.map((st, idx) => {
              const isSelected = showPicker === "from" ? idx === fromIndex : idx === toIndex;
              const isDisabled = showPicker === "from"
                ? idx === toIndex
                : idx === fromIndex;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.pickerItem,
                    isSelected && { backgroundColor: c.primary + "30" },
                    isDisabled && { opacity: 0.4 },
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    if (showPicker === "from") onFromChange(idx);
                    else onToChange(idx);
                    setShowPicker(null);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: isSelected ? c.primary : c.text },
                    ]}
                  >
                    {st.name}
                  </Text>
                  <Text style={[styles.pickerItemTime, { color: c.textSecondary }]}>
                    {st.arrivalMinutes}dk
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stationBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  arrow: {
    fontSize: 24,
    fontWeight: "300",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  closeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  pickerItemTime: {
    fontSize: 14,
  },
});
