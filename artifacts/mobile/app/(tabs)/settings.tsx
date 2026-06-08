import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from "react-native";
import { useTheme, Colors } from "../../context/ThemeContext";
import { useNavizban } from "../../context/NavizbanContext";

export default function SettingsScreen() {
  const { isDark, mode, setMode } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const { consentGiven, setConsent } = useNavizban();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.section, { borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Görünüm</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setMode(isDark ? "light" : "dark")}
        >
          <Text style={[styles.rowLabel, { color: c.text }]}>🌙 Karanlık Tema</Text>
          <View style={[styles.toggle, { backgroundColor: isDark ? c.accent : c.border }]}>
            <View style={[styles.toggleDot, { alignSelf: isDark ? "flex-end" : "flex-start", backgroundColor: "#FFFFFF" }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Gizlilik</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: c.text }]}>🛡️ Konum Paylaşımı</Text>
          <Text style={[styles.rowValue, { color: consentGiven ? c.accent : c.textSecondary }]}>
            {consentGiven ? "Açık" : "Kapalı"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setConsent(!consentGiven)}
        >
          <Text style={[styles.rowLabel, { color: c.text }]}>KVKK Rızası</Text>
          <Text style={[styles.rowValue, { color: consentGiven ? c.accent : c.textSecondary }]}>
            {consentGiven ? "✅ Kabul Edildi" : "Kabul Et"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Uygulama</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: c.text }]}>Versiyon</Text>
          <Text style={[styles.rowValue, { color: c.textSecondary }]}>v1.2.0-beta</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: c.text }]}>Platform</Text>
          <Text style={[styles.rowValue, { color: c.textSecondary }]}>Expo React Native</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.textSecondary }]}>
          🚆 Navizban v1.2 Beta
        </Text>
        <Text style={[styles.footerText, { color: c.textSecondary }]}>
          Açık Kaynak — MIT License
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 14,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
  },
});
