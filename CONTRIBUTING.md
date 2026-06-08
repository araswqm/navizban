# 🤝 Navizban'a Katkı

Navizban açık kaynak bir projedir. Katkılarınızı memnuniyetle karşılıyoruz!

## Geliştirme Ortamı

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/araswqm/navizban.git
   cd navizban
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   pnpm install
   ```

3. Mobil uygulamayı başlatın:
   ```bash
   pnpm --filter @workspace/mobile expo start
   ```

4. API sunucusunu başlatın:
   ```bash
   pnpm --filter @workspace/api-server dev
   ```

## Proje Yapısı

```
navizban/
├── lib/
│   ├── navizban-core/        # Paylaşılan çekirdek kütüphane
│   └── api-spec/             # OpenAPI spesifikasyonu
├── artifacts/
│   ├── mobile/               # Expo/React Native mobil uygulama
│   │   ├── app/              # Expo Router sayfaları
│   │   ├── components/       # UI bileşenleri
│   │   ├── context/          # React context (tema, navizban state)
│   │   ├── constants/        # Sabitler
│   │   ├── services/         # API servisleri
│   │   └── server/           # Web sunucusu
│   └── api-server/           # Express.js API sunucusu
├── docs/                     # GitHub Pages (navizban.xyz)
└── scripts/                  # Build ve yardımcı scriptler
```

## Katkı Adımları

1. **Fork** edin ve branch oluşturun (`git checkout -b feature/yeni-ozellik`)
2. Değişikliklerinizi yapın
3. **Commit** edin (`git commit -m 'feat: yeni özellik eklendi'`)
4. **Push** yapın (`git push origin feature/yeni-ozellik`)
5. **Pull Request** açın

## Kod Standartları

- TypeScript kullanın
- ESLint ve Prettier ile formatlayın
- Bileşenleri küçük ve odaklı tutun
- Anlamlı değişken ve fonksiyon isimleri kullanın
- KVKK/gizlilik kurallarına uyun

## Lisans

MIT License ile lisanslanmıştır.
