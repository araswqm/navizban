import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { NavizbanLogo } from "./NavizbanLogo";

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentScreen({ onAccept, onDecline }: Props) {
  const { C } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <NavizbanLogo height={32} />
        <Text style={[styles.version, { color: C.textSecondary }]}>v1.2 Beta</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: C.text }]}>
          Hoş Geldiniz
        </Text>

        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Navizban, İZBAN hattında seyahatinizi kolaylaştıran gerçek zamanlı tren takip uygulamasıdır.
        </Text>

        <View style={[styles.section, { borderColor: C.border, backgroundColor: C.surfaceTint }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            📱 Uygulama Kullanım Rehberi
          </Text>

          <View style={styles.guideItem}>
            <Text style={[styles.guideNumber, { color: C.accent }]}>1</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: C.text }]}>Biniş İstasyonu Seçimi</Text>
              <Text style={[styles.guideDesc, { color: C.textSecondary }]}>
                Üst çubuktaki "Biniş" alanına dokunun. GPS konumunuzu kullanarak en yakın istasyonu otomatik belirleyebilir veya listeden manuel seçim yapabilirsiniz.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideNumber, { color: C.accent }]}>2</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: C.text }]}>Varış İstasyonu Seçimi</Text>
              <Text style={[styles.guideDesc, { color: C.textSecondary }]}>
                "Varış" alanına dokunarak gitmek istediğiniz istasyonu listeden seçin. İstasyonları isme göre arayabilirsiniz.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideNumber, { color: C.accent }]}>3</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: C.text }]}>Yolculuğu Başlatma</Text>
              <Text style={[styles.guideDesc, { color: C.textSecondary }]}>
                Biniş ve varış istasyonlarını seçtikten sonra, alttaki panelde bulunan "Yolculuğu Başlat" butonuna dokunun. GPS konumunuz raylara yakınsa yolculuk başlayacaktır.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideNumber, { color: C.accent }]}>4</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: C.text }]}>Canlı Tren Takibi</Text>
              <Text style={[styles.guideDesc, { color: C.textSecondary }]}>
                Üst çubuktaki göz simgesine dokunarak seçili istasyona yaklaşan trenleri görebilirsiniz. Trenlerin tahmini varış süreleri ve yönleri anlık olarak görüntülenir.
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideNumber, { color: C.accent }]}>5</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: C.text }]}>Harita ve Konum</Text>
              <Text style={[styles.guideDesc, { color: C.textSecondary }]}>
                Harita üzerinde tren konumunuzu ve İZBAN hattını görebilirsiniz. GPS göstergesi yeşil ise konumunuz alınıyor demektir.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            🔒 KVKK Aydınlatma Metni
          </Text>
          <Text style={[styles.paragraph, { color: C.textSecondary }]}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında:
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Konum veriniz yalnızca tren konumunuzu haritada göstermek için
            kullanılır
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • İzin vermeniz durumunda, anonimleştirilmiş tren konumu veriniz
            diğer kullanıcıların bekledikleri trenin varış süresini görmesi için
            paylaşılır
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Paylaşılan veri yalnızca "hangi duraktan hangi duvara giden trende
            kaçıncı dakikadasınız" bilgisidir, ham GPS veriniz paylaşılmaz
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Hiçbir kişisel bilginiz (isim, e-posta, telefon) toplanmaz veya
            paylaşılmaz
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Verileriniz yalnızca yolculuk süresince geçici olarak tutulur,
            yolculuk sonunda silinir
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Dilediğiniz zaman ayarlardan konum paylaşımını kapatabilirsiniz
          </Text>
        </View>

        <View style={[styles.section, { borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            📋 Kullanım Koşulları
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Bu uygulama resmi bir İZBAN uygulaması değildir, üçüncü taraf
            uygulamasıdır
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Tahmini süreler gerçek tren saatlerinden farklılık gösterebilir
          </Text>
          <Text style={[styles.listItem, { color: C.textSecondary }]}>
            • Uygulama açık kaynaklıdır, kullanımı tamamen ücretsizdir
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: C.danger }]}
          onPress={onDecline}
        >
          <Text style={styles.buttonText}>Reddet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: C.accent }]}
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
  version: {
    fontSize: 14,
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    textAlign: "center",
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  listItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 8,
  },
  guideItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  guideNumber: {
    fontSize: 16,
    fontWeight: "700",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "currentColor",
    textAlign: "center",
    lineHeight: 21,
    overflow: "hidden",
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  guideDesc: {
    fontSize: 13,
    lineHeight: 19,
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
    fontWeight: "700",
  },
});
