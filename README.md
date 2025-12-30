![Navİzban](logo.png)

# 🚆 Navizban

Navizban, İzmir’in İZBAN banliyö hattı için hazırlanmış; kullanıcının konumuna göre tahmini yolculuk süresini hesaplayan ve tren hareketini harita üzerinde simüle eden bir Android uygulamasıdır.

Karanlık tema destekli, modern arayüzlü ve günlük kullanım için sade olacak şekilde tasarlanmıştır.


---

# ✨ Özellikler

📍 Kullanıcının konumuna göre otomatik biniş durağı tespiti  
⏱️ Dakikada bir güncellenen tahmini kalan süre  
🗺️ Harita üzerinde animasyonlu tren imleci  
▶️ Tek tuşla simülasyon başlatma / durdurma  
👁️ Alt bilgi panelini gizleme / gösterme  
🧭 Konum verileriyle çalışan simülasyon


---

# 🌐 İnternet Kullanımı

Uygulama genel olarak offline çalışır.

Sadece harita arka planının (map tiles) yüklenmesi için internet bağlantısı gerekir.

Süre hesaplama, GPS takibi ve simülasyon mantığı internet bağlantısı olmadan da çalışır.


---

# 🎯 Amaç

Navİzban;

* İZBAN hattını daha görsel ve anlaşılır hâle getirmek
* Kullanıcının bulunduğu konuma göre yolculuk süresini hızlıca hesaplamak
* Gerçek konum verisiyle desteklenen sade bir tren simülasyonu sunmak

amacıyla geliştirilmiştir.


---

# 📱 Arayüz

Uygulama açıldığında kullanıcının mevcut konumu GPS üzerinden alınır. Bu konum bilgisi kullanılarak seçilen istasyona kalan süre otomatik olarak belirlenir.

Varış durağı, ekranın üst bölümünde yer alan spinner üzerinden seçilir. Seçim yapıldıktan sonra yolculuğa ait tahmini süre otomatik olarak hesaplanır ve alt bilgi panelinde görüntülenir.

Ekranın orta bölümünde yer alan harita, trenin konum ve hareketini animasyonlu bir imleç ile gösterir. Harita yalnızca görsel detayların doğru şekilde yüklenmesi için internet bağlantısı kullanır.

Alt bölümde bulunan kontrol barı kullanıcı tarafından gizlenip tekrar gösterilebilir. Bu bar üzerinden:

- Tahmini kalan süre dakika dakika takip edilir  
- Tren simülasyonu tek bir butonla başlatılıp sonlandırılır  

Simülasyon sırasında:

- GPS verisi sadece her dakika güncellenir. Bu dakikalar arası uygulama tahmini konum kullanır.
- Kalan süre bu verilere göre yeniden hesaplanır  
- Tren imleci harita üzerinde eşzamanlı olarak hareket eder  

Ayrıca Navizban, pil optimizasyonu kapatıldığı takdirde arkaplanda çalışabilir ve bildirim kutucuğunda hedef istasyona kalan yolu gösterebilir.

GPS verisi yalnızca referans amaçlı kullanılır. Tren imlecinin konumu birebir gerçek tren konumunu temsil etmeyebilir; ancak seçilen varış durağına, hesaplanan tahmini süre sonunda ulaşacak şekilde her dakika güncellenir.



---

# 🤝 Katkı

Geri bildirimlere ve önerilere açıktır.  
Issue açabilir veya pull request gönderebilirsin.


---

# 📜 Lisans

Açık kaynak.  
Kullanmak, incelemek ve geliştirmek serbesttir.

---

![Screenshots](v1.1beta_screenshots.jpg)
