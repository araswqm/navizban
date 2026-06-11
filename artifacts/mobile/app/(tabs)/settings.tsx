import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Pressable } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useNavizban } from "@/context/NavizbanContext";

export default function SettingsScreen() {
  const { mode, C, toggleTheme } = useTheme();
  const { consentGiven, setConsent, boardingStation } = useNavizban();
  const isDark = mode === "dark";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <Pressable
        style={[styles.backBtn, { borderColor: C.border }]}
        onPress={() => router.back()}
      >
        <Text style={{ fontSize: 18, color: C.text }}>← Geri</Text>
      </Pressable>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Görünüm</Text>
        <TouchableOpacity style={styles.row} onPress={toggleTheme}>
          <Text style={[styles.rowLabel, { color: C.text }]}>🌙 Karanlık Tema</Text>
          <View style={[styles.toggle, { backgroundColor: isDark ? C.accent : C.border }]}>
            <View style={[styles.toggleDot, { alignSelf: isDark ? "flex-end" : "flex-start", backgroundColor: "#FFFFFF" }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Gizlilik</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: C.text }]}>🛡️ Konum Paylaşımı</Text>
          <Text style={[styles.rowValue, { color: consentGiven ? C.accent : C.textSecondary }]}>
            {consentGiven ? "Açık" : "Kapalı"}
          </Text>
        </View>
        <TouchableOpacity style={styles.row} onPress={() => setConsent(!consentGiven)}>
          <Text style={[styles.rowLabel, { color: C.text }]}>KVKK Rızası</Text>
          <Text style={[styles.rowValue, { color: consentGiven ? C.accent : C.textSecondary }]}>
            {consentGiven ? "✅ Kabul Edildi" : "Kabul Et"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Konum</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: C.text }]}>📍 En Yakın İstasyon</Text>
          <Text style={[styles.rowValue, { color: C.textSecondary }]}>{boardingStation.name}</Text>
        </View>
      </View>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Uygulama</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: C.text }]}>Versiyon</Text>
          <Text style={[styles.rowValue, { color: C.textSecondary }]}>v1.2.0-beta</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: C.text }]}>Platform</Text>
          <Text style={[styles.rowValue, { color: C.textSecondary }]}>Expo React Native</Text>
        </View>
      </View>

      <View style={[styles.section, { borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Geliştirici</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            try {
              localStorage.clear();
              if (typeof window !== "undefined") window.location.reload();
            } catch {}
          }}
        >
          <Text style={[styles.rowLabel, { color: C.danger }]}>🗑️ Tüm Verileri Sıfırla</Text>
          <Text style={[styles.rowValue, { color: C.textMuted }]}>KVKK + localStorage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: C.textMuted }]}>🚆 Navizban v1.2 Beta</Text>
        <Text style={[styles.footerText, { color: C.textMuted }]}>Açık Kaynak — MIT License</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth, alignSelf: "flex-start",
  },
  section: { borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginTop: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 14 },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: "center" },
  toggleDot: { width: 20, height: 20, borderRadius: 10 },
  footer: { alignItems: "center", paddingVertical: 30 },
  footerText: { fontSize: 12, marginTop: 4 },
});
