# 🌩 Cloudflare Yapılandırma Rehberi

## Mevcut DNS Yapısı (zone.navizban.xyz)

```
navizban.xyz      → CNAME  araswqm.github.io       (GitHub Pages, DNS only ☁️)
www.navizban.xyz  → CNAME  araswqm.github.io       (GitHub Pages)
web.navizban.xyz  → CNAME  navizban-web.pages.dev  (Cloudflare Pages, Proxied 🟠)
```

---

## 1. Ana Site — navizban.xyz (GitHub Pages)

**Cloudflare DNS:**
- Type: `CNAME`
- Name: `@` (ve `www`)
- Target: `araswqm.github.io`
- Proxy: **DNS only** (gri bulut) — GitHub Pages kendi SSL'i ile gelir

**GitHub Pages ayarları:**
- Settings → Pages → Source: `Deploy from a branch`
- Branch: `main`, Folder: `/docs`
- Custom domain: `navizban.xyz`

> `docs/index.html` dosyası ana sitenin kaynağıdır. `docs/CNAME` dosyasında `navizban.xyz` yazılı olmalı.

---

## 2. Web Uygulaması — web.navizban.xyz (Cloudflare Pages)

**Cloudflare DNS:**
- Type: `CNAME`
- Name: `web`
- Target: `navizban-web.pages.dev`
- Proxy: **Proxied** (turuncu bulut) ☁️ — Cloudflare SSL + CDN

**Cloudflare Pages ayarları:**
- **Framework preset:** None (Expo custom)
- **Build command:** `cd artifacts/mobile && npx expo export --platform web`
- **Build output directory:** `artifacts/mobile/dist`
- **Root directory:** `/`
- **Environment variables:**
  - `NODE_VERSION`: `20`

> ⚠️ **ÖNEMLİ:** Build komutuna `npm install` EKLEMEYİN! Proje bir **pnpm workspace**'tir ve `workspace:*` protokolü kullanır. Cloudflare Pages zaten root'ta `pnpm install --frozen-lockfile` çalıştırır. `npm install` komutu `workspace:*` protokolünü anlamaz ve `EUNSUPPORTEDPROTOCOL` hatası verir.

**Cloudflare Pages → Custom domains:**
1. Pages projene git → Custom domains
2. `web.navizban.xyz` ekle
3. DNS kaydı otomatik oluşacak (veya manuel CNAME ekle)

---

## 3. API Sunucusu — api.navizban.xyz

### 🌟 Seçenek A: Cloudflare Workers (Önerilen — ücretsiz, sunucusuz)

API kodu `artifacts/api-worker/` altında hazır. Express API ile birebir aynı endpoint'ler, Workers KV ile durum yönetimi.

#### 1. KV Namespace oluştur

```bash
cd artifacts/api-worker
npx wrangler kv:namespace create "NAVIZBAN_KV"
```

Çıkan `id` değerini `wrangler.toml`'daki `kv_namespaces` kısmına yapıştır:

```toml
kv_namespaces = [
  { binding = "NAVIZBAN_KV", id = "<buraya-id>" }
]
```

#### 2. Worker'ı dağıt

```bash
cd artifacts/api-worker
npm install
npx wrangler deploy
```

#### 3. Route ekle (Cloudflare Dashboard)

Workers → navizban-api → Triggers → Routes:
- Route: `api.navizban.xyz/*`
- Zone: `navizban.xyz`

#### 4. DNS kaydı (Dashboard otomatik ekler)

- Type: `CNAME`
- Name: `api`
- Target: `@` (veya Workers route'tan otomatik)
- Proxy: **Proxied** (turuncu bulut)

#### API Endpoint'leri

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/health` | Sağlık kontrolü |
| `GET` | `/api/trains` | Tüm aktif trenler |
| `GET` | `/api/trains?station=alsancak` | İstasyona yaklaşan trenler |
| `GET` | `/api/trains/:id` | Tek tren detayı |
| `POST` | `/api/trains/:id/heartbeat` | Tren telemetrisi gönder |

#### Yerel geliştirme

```bash
cd artifacts/api-worker
npm install
npx wrangler dev
# → http://localhost:8787
```

> **Not:** KV namespace olmadan da çalışır (geliştirme modunda boş dizi döner). Production için KV şart.

---

### Seçenek B: Cloudflare Tunnel (VPS gerektirir)

API sunucunu kendi VPS'inde veya Railway/Render/Fly.io gibi bir platformda çalıştır, Cloudflare Tunnel ile yayınla:

```bash
# Sunucuda cloudflared kur
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Tunnel oluştur
cloudflared tunnel login
cloudflared tunnel create navizban-api

# DNS yapılandırması (otomatik)
cloudflared tunnel route dns navizban-api api.navizban.xyz

# Tunnel'ı başlat
cloudflared tunnel run --url http://localhost:3001 navizban-api
```

**Cloudflare DNS:**
- Type: `CNAME`
- Name: `api`
- Target: `<tunnel-id>.cfargotunnel.com` (cloudflared otomatik oluşturur)
- Proxy: **Proxied** (turuncu bulut)

### Seçenek B: Cloudflare Workers (API'yi Workers'a taşı)

Küçük API'ler için Workers daha hızlı ve ücretsiz:

```bash
# wrangler ile workers projesi oluştur
npx wrangler init navizban-api
```

```js
// wrangler.toml
name = "navizban-api"
main = "src/index.ts"
routes = [{ pattern = "api.navizban.xyz/*", zone_name = "navizban.xyz" }]
```

**Cloudflare DNS:**
- Type: `CNAME`
- Name: `api`
- Target: `@` (veya Workers route olarak ekle)
- Proxy: **Proxied**

### Seçenek C: Direkt Sunucu IP'si

Eğer sabit IP'li bir sunucun varsa:

**Cloudflare DNS:**
- Type: `A`
- Name: `api`
- Target: `<sunucu-ip>`
- Proxy: **Proxied** (turuncu bulut) — IP'ni gizler, DDoS koruması sağlar

> Sunucuda API `PORT=3001 node build.mjs` şeklinde çalıştır. Cloudflare → Origin Rules ile port yönlendirmesi yapabilirsin.

---

## 4. _headers ve _redirects (web/ klasörü)

Cloudflare Pages, `_headers` ve `_redirects` dosyalarını build çıktısında arar. 
Bu dosyaları `artifacts/mobile/dist/` içine build sonrası kopyalamak için:

```bash
# build.mjs veya build script'ine ekle
cp web/_headers artifacts/mobile/dist/
cp web/_redirects artifacts/mobile/dist/
```

Ya da `web/` klasörünü build output'u olarak değil, Pages'in statik assetleri olarak ayarla.

---

## 5. SSL/TLS Ayarları

- **Mode:** Full (strict) — origin'de de geçerli SSL olmalı
- GitHub Pages için: Full
- Cloudflare Pages için: Full (strict) — Pages kendi SSL'ini sağlar

---

## 6. Özet Kontrol Listesi

| Subdomain | Servis | DNS Type | Proxy |
|-----------|--------|----------|-------|
| `@` (navizban.xyz) | GitHub Pages | CNAME → araswqm.github.io | DNS only |
| `www` | GitHub Pages | CNAME → araswqm.github.io | DNS only |
| `web` | Cloudflare Pages | CNAME → navizban-web.pages.dev | Proxied |
| `api` | VPS/Workers | CNAME/A | Proxied |

> Zone dosyası: `web/zone.navizban.xyz` — Cloudflare'ye manuel import için BIND formatında.
