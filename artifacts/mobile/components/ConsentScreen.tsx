import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTheme, Colors } from "../context/ThemeContext";

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentScreen({ onAccept, onDecline }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logo]}>🚆 Navizban</Text>
        <Text style={[styles.version, { color: c.textSecondary }]}>v1.2 Beta</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: c.text }]}>
          Kullanım Şartları ve Gizlilik
        </Text>

        <Text style={[styles.paragraph, { color: c.textSecondary }]}>
          Navizban, İZBAN (İzmir Banliyö A.Ş.) tren hattında seyahat eden
          kullanıcıların GPS verilerini kullanarak gerçek zamanlı tren
          navigasyonu ve takibi sağlayan bir uygulamadır.
        </Text>

        <View style={[styles.section, { borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            🔒 KVKK Aydınlatma Metni
          </Text>
          <Text style={[styles.paragraph, { color: c.textSecondary }]}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında:
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Konum veriniz yalnızca tren konumunuzu haritada göstermek için
            kullanılır
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • İzin vermeniz durumunda, anonimleştirilmiş tren konumu veriniz
            diğer kullanıcıların bekledikleri trenin varış süresini görmesi için
            paylaşılır
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Paylaşılan veri yalnızca "hangi duraktan hangi duvara giden trende
            kaçıncı dakikadasınız" bilgisidir, ham GPS veriniz paylaşılmaz
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Hiçbir kişisel bilginiz (isim, e-posta, telefon) toplanmaz veya
            paylaşılmaz
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Verileriniz yalnızca yolculuk süresince geçici olarak tutulur,
            yolculuk sonunda silinir
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Dilediğiniz zaman ayarlardan konum paylaşımını kapatabilirsiniz
          </Text>
        </View>

        <View style={[styles.section, { borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            📋 Kullanım Koşulları
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Bu uygulama resmi bir İZBAN uygulaması değildir, üçüncü taraf
            uygulamasıdır
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Tahmini süreler gerçek tren saatlerinden farklılık gösterebilir
          </Text>
          <Text style={[styles.listItem, { color: c.textSecondary }]}>
            • Uygulama açık kaynaklıdır, kullanımı tamamen ücretsizdir
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.error }]}
          onPress={onDecline}
        >
          <Text style={styles.buttonText}>Reddet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.accent }]}
          onPress={onAccept}
        >
          <Text style={styles.buttonText}>Kabul Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
