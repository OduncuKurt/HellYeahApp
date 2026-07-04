# HellYeahApp — `buglar` Branch Derinlemesine Kod İncelemesi

**İnceleme tarihi:** 5 Temmuz 2026  
**Kapsam:** `OduncuKurt/HellYeahApp` deposunun GitHub’daki `buglar` branch’i; React Native/Expo istemcisi, Firebase Realtime Database ve Storage kuralları, servis katmanı, ekranlar, yapılandırma ve dokümantasyon.  
**İnceleme tipi:** Statik kod ve yapılandırma incelemesi. Yerelde bağımlılık kurulumu, `tsc`, Expo build, Firebase Emulator testi, EAS build, gerçek Firebase deploy durumu ve bağımlılık/CVE taraması çalıştırılmadı.

> Bu rapordaki Firebase bulguları, repoda bulunan `database.rules.json` ve `storage.rules` dosyalarının üretimde gerçekten deploy edildiği varsayımıyla değerlendirilmiştir. Deploy edilmiş kurallar farklıysa, önce Firebase Console/CLI ile karşılaştırılmalıdır.

---

## Yönetici özeti

Uygulamanın temel ürün fikri ve ekran akışı iyi bir başlangıç seviyesinde: kimlik doğrulama, arkadaşlık, paylaşım, Guinness istatistiği, yorum/reaksiyon, profil ve liderlik tablosu aynı model etrafında toplanmış. Kodda TypeScript, context yapısı, servis ayrımı ve environment variable kullanımı gibi doğru yönler de var.

Ancak şu anki hâliyle üretime çıkışı engelleyebilecek birkaç **kritik fonksiyonel ve güvenlik riski** bulunuyor:

1. **Firebase Storage yolları ile Storage kuralları uyuşmuyor.** Bira ve profil görseli yüklemeleri, kuralların beklediği kullanıcı-ID klasör yapısına uymuyor. Kurallar deploy edildiyse görsel yükleme `permission-denied` ile kırılır.
2. **Yorum ve reaksiyon akışı mevcut Realtime Database kurallarıyla normal kullanıcılar için yazılamaz.** `beers/$beerId` altındaki yazma izni yalnızca paylaşım sahibine veriliyor.
3. **Arkadaş kabulü ve arkadaş silme işlemleri karşı tarafın profiline yazmaya çalışıyor.** Mevcut kural karşı tarafın `friends` düğümünü yazmayı engellediği için iki taraflı arkadaşlık kaydı tutarsızlaşabilir.
4. **Sayaçlar istemci tarafından güncelleniyor ve profilin tamamı kullanıcı tarafından yazılabiliyor.** Kullanıcı kendi toplam bira/Guinness/yıllık sayılarını değiştirebilir; liderlik tablosu güvenilir değildir.
5. **E-posta doğrulama yalnızca arayüzde korunuyor.** Realtime Database kuralları yalnızca `auth != null` kontrol ediyor. Doğrulanmamış kullanıcı, mobil arayüzü atlayıp Firebase SDK üzerinden veri erişimine sahip olabilir.
6. **Çoklu yazma işlemleri atomik değil.** Paylaşım–istatistik, Guinness toggle–istatistik, arkadaş kabulü ve silme işlemlerinde yarım kalma halinde veri drift’i oluşabilir.

Önerilen sıra: önce P0 güvenlik/izin/path blokajlarını çöz, sonra veri modelini atomik backend işlemlerine taşı, ardından test–CI–gözlemlenebilirlik ve ürün iyileştirmelerini ekle.

---

## Risk seviyesi özeti

| ID | Seviye | Alan | Kısa açıklama |
|---|---|---|---|
| C-01 | Kritik | Storage | Bira görseli upload path’i kural ile uyuşmuyor. |
| C-02 | Kritik | Storage | Profil fotoğrafı upload path’i kural ile uyuşmuyor. |
| C-03 | Kritik | RTDB | Yorum/reaksiyon yazıları paylaşım sahibi dışındaki kullanıcılar için engelli. |
| C-04 | Kritik | RTDB | Arkadaş kabulü/silme karşı tarafın verisini yazdığı için kural tarafından engellenir. |
| C-05 | Kritik | Veri bütünlüğü | Kullanıcı kendi sayacını ve profile ait kritik alanları manipüle edebilir. |
| C-06 | Yüksek | Kimlik doğrulama | E-posta doğrulama arayüz kontrolü; backend kuralında zorunlu değil. |
| H-01 | Yüksek | Veri bütünlüğü | Çok-adımlı yazmalar atomik değil; sayaçlar drift eder. |
| H-02 | Yüksek | Gizlilik | Tüm avatar/bira görselleri public; kullanıcı profilleri auth olan herkese okunabilir. |
| H-03 | Yüksek | Sosyal güvenlik | Alıcı taraf sahte arkadaşlık isteği oluşturabilir; istek şeması doğrulanmıyor. |
| H-04 | Yüksek | Ölçek | Feed ve arkadaş araması N+1 sorgu ve istemci tarafı sıralama/pagination kullanıyor. |
| H-05 | Orta | Operasyon | Test/lint/typecheck script’i ve görünür CI kapısı yok. |
| H-06 | Orta | Veri yaşam döngüsü | Paylaşım silinince Storage görseli silinmiyor; eski avatarlar temizlenmiyor. |
| H-07 | Orta | UX/Doğrulama | E-posta doğrulaması sonrası state güncellemesi güvenilir değil; kullanıcı ekranda kalabilir. |
| H-08 | Orta | Ürün güvenliği | Rate limit, raporlama, engelleme, moderasyon ve hesap silme akışı görünmüyor. |
| M-01 | Orta | Bakım | README mevcut mimariyi yansıtmıyor; iki lockfile var. |
| M-02 | Orta | Mobil izinler | Android’de gerekçesi görünmeyen `RECORD_AUDIO` ve eski storage izinleri var. |
| M-03 | Orta | Gizli anahtar tasarımı | Mobil bundle’a `MASTER_PASSWORD` koyma fikri güvenli değil. |
| M-04 | Düşük | UI/kalite | Tema kullanımında, dilde ve ekran sorumluluklarında tutarsızlıklar var. |

---

# 1. Kritik bulgular

## C-01 — Bira görseli Storage path’i kuralla çakışıyor

**Kanıt**

- `src/services/beerService.ts` içinde bira görseli `beers/${year}/${filename}` yoluna yükleniyor.
- `storage.rules` yalnızca `avatars/{userId}/{fileName}` ve `beers/{userId}/{fileName}` yollarına yazma izni veriyor.
- `beers/{userId}/{fileName}` kuralında ikinci segmentin giriş yapmış kullanıcının UID’si olması isteniyor.

**Etkisi**

Yıl klasörü UID olmadığı için bu upload isteği kurala uymuyor. Kurallar deploy edilmişse kullanıcı bira eklerken görsel upload aşamasında `storage/unauthorized` veya `permission-denied` alır. Bira kaydı oluşturulmadan kalabilir ya da uygulama hata yönetimine göre başarısız görünür.

**Önerilen çözüm**

Tek format seçin ve kod + kuralı aynı anda güncelleyin. En basit seçenek:

```text
beers/{uid}/{beerId-or-timestamp}.jpg
```

Örnek istemci yolu:

```ts
const imageRef = storageRef(storage, `beers/${user.uid}/${filename}`);
```

Yıl bilgisi Storage klasöründen değil, Realtime Database’deki `year` alanından okunmalıdır. Eski kayıtlar varsa migration/backfill planı yapın.

**Kabul kriteri**

- Kullanıcı kendi fotoğrafını yükleyebiliyor.
- Başka kullanıcının UID klasörüne upload yapamıyor.
- 10 MB üstü ve image olmayan dosya reddediliyor.
- Emulator testinde izin reddi senaryoları doğrulanıyor.

---

## C-02 — Profil fotoğrafı Storage path’i kuralla çakışıyor

**Kanıt**

- `src/screens/profile/ProfileScreen.tsx` içinde upload yolu `avatars/${filename}`.
- `storage.rules` yolu `avatars/{userId}/{fileName}` olarak tanımlı.

**Etkisi**

Profil fotoğrafı da mevcut kural altında upload edilemez. Ayrıca eski profil görselleri silinmediğinden path düzeltilse bile zamanla orphan dosyalar birikir.

**Önerilen çözüm**

```ts
const imageRef = storageRef(storage, `avatars/${currentUser.uid}/${filename}`);
```

Bir önceki `avatar` URL’sini profilden alıp başarılı yeni upload ve DB update sonrasında silin. Silme hatasını ana akışı bozmayacak şekilde loglayın; gecikmiş cleanup işi de ekleyin.

---

## C-03 — Reaksiyon ve yorum kuralları gerçek iş akışıyla uyumsuz

**Kanıt**

- `src/screens/beer/BeerDetailScreen.tsx`, `addReaction`, `removeReaction`, `addComment` ve `deleteComment` servislerini her giriş yapmış kullanıcı adına çağırıyor.
- `database.rules.json` içindeki `beers/$beerId/.write`, mevcut bir bira için yalnızca `data.child('userId').val() === auth.uid` koşulunu kabul ediyor.
- Paylaşım sahibi olmayan kullanıcı, `beers/{beerId}/reactions/...` veya `comments/...` altına yazmaya çalıştığında üst kuraldaki sahiplik kontrolü onu reddeder.

**Etkisi**

Arkadaşın paylaşımına yorum atma ve tepki verme fonksiyonları normal kullanıcı için çalışmaz. UI butonu görünür, fakat Firebase izin hatası oluşur. Bu, kullanıcı tarafında “uygulama bozuk” algısı yaratır.

**Önerilen çözüm**

Veri modelini alt koleksiyon izinleriyle ayırın:

- Paylaşım ana alanları: yalnız paylaşım sahibi güncelleyebilsin.
- `reactions/{reactorUid}`: giriş yapan kullanıcı yalnız kendi UID düğümünü yazıp silebilsin.
- `comments/{commentId}`: oluşturma sırasında `newData.userId === auth.uid`; güncelleme/silme yalnız yorum sahibi için.
- Metin uzunluğu, emoji kümesi, timestamp, zorunlu alanlar için `.validate` ekleyin.

Önemli: Üst düzey `.write` kuralı alt yolların işini engellemeyecek şekilde tasarlanmalıdır. Firebase Emulator ile üç ayrı kimlik altında test edin: paylaşım sahibi, arkadaş, ilgisiz kullanıcı.

---

## C-04 — Arkadaş kabul/silme akışı iki taraflı yazma yaptığı için kırılıyor

**Kanıt**

- `src/services/friendService.ts` içindeki `acceptFriendRequest` iki profile de `friends` kaydı yazıyor.
- `removeFriend` iki kullanıcının da arkadaş kaydını siliyor.
- `database.rules.json` içinde `users/$uid/.write` ve `users/$uid/friends/.write`, yalnızca `$uid === auth.uid` olduğunda izin veriyor.

**Etkisi**

Kullanıcı kendi `friends` düğümünü değiştirebilir, fakat karşı tarafın düğümünü değiştiremez. İşlem sıralı çalışıyorsa ilk yazma başarılı, ikinci yazma başarısız olur. Sonuç: asimetrik arkadaşlık, kalan istek kaydı ve farklı ekranlarda farklı durum görülebilir.

**Önerilen çözüm**

Bu işlem istemcide iki ayrı `set` ile yapılmamalı.

Tercih sırası:

1. **Cloud Function / Callable Function**: Kimliği doğrular, isteği kontrol eder, iki tarafı tek server-side işlemle günceller.
2. Alternatif olarak güvenli bir RTDB fan-out endpoint’i: sadece hedef kullanıcı kabul edebilir, backend iki `friends` kaydını ve request silme işlemini atomik `update()` ile yapar.
3. Sadece client rule düzeltmek istenirse, karşı taraf profiline genel yazma izni vermeyin. Bu ciddi güvenlik açığı oluşturur.

**Kabul kriteri**

- Kabul sonrası iki kullanıcı da birbirini listeler.
- Reddetme ve silme iki tarafta da tutarlı görünür.
- Ağ kesintisi/yinelenen istek çift kayıt yaratmaz.
- Sadece gerçek alıcı isteği kabul edebilir.

---

## C-05 — Liderlik ve istatistikler istemci tarafından manipüle edilebilir

**Kanıt**

- Kullanıcı kendi `users/{uid}` kaydı üzerinde genel yazma yetkisine sahip.
- Kullanıcı şeması içinde `totalBeers`, `totalGuinnessBeers`, `beersByYear`, `guinnessByYear` ve `friends` alanları tutuluyor.
- `LeaderboardScreen` sıralamayı doğrudan kullanıcı profilindeki `beersByYear` değerinden üretiyor.

**Etkisi**

Bir kullanıcı Firebase SDK veya REST istekleriyle kendi sayacını çok yüksek bir değere çekebilir. Liderlik tablosu, Guinness istatistikleri ve profil istatistikleri güvenilir değildir. Ayrıca profil içindeki beklenmeyen alanlar/yanlış tipler uygulama ekranlarını bozabilir.

**Önerilen çözüm**

- Kullanıcının yazabileceği profil alanlarını ayırın: ör. `displayName`, `avatar`, tema tercihi gibi güvenli alanlar.
- Sayaçlar yalnız backend tarafından türetilsin veya server-side transaction ile güncellensin.
- En sağlam yaklaşım: bira yaratma/silme/toggle operasyonlarını Callable Function’a taşıyın; function sayacı transaction ile güncellesin.
- `users/{uid}` için alan-bazlı `.validate` kuralları ekleyin.
- Liderlik için denormalize `leaderboards/{year}/{uid}` düğümünü backend üretmeli; istemci sadece okumalı.

---

# 2. Yüksek öncelikli riskler

## C-06 / H-01 — E-posta doğrulaması backend’de zorunlu değil

**Kanıt**

- `AppNavigator` doğrulanmamış kullanıcıyı e-posta doğrulama ekranında tutuyor.
- Realtime Database kuralları pek çok yerde yalnız `auth != null` kontrol ediyor.
- Mobil arayüz koruması, Firebase SDK’yı doğrudan kullanan istemciyi engellemez.

**Risk**

Yeni kayıt olan doğrulanmamış bir kullanıcı, UI akışını bypass ederek Firebase verilerine erişebilir, kullanıcı arayabilir, paylaşım oluşturabilir veya friend request atabilir. E-posta doğrulaması ürün politikasıysa bunu backend kuralıyla zorunlu tutmalısınız.

**Çözüm**

- Uygun yollar için `auth.token.email_verified === true` benzeri kontrolü değerlendirin.
- Doğrulama tamamlandığında ID token yenilenmeli; istemci state’i açık biçimde güncellenmeli.
- `EmailVerificationScreen` içindeki `reload()` çağrısından sonra sadece observer’a güvenmeyin; `setEmailVerified(currentUser.emailVerified)` veya token/oturum refresh mantığı ekleyin.
- Giriş, paylaşım, yorum, reaction, friend request ve Storage upload için ayrı test matrisi yazın.

> E-posta doğrulamasını yalnızca onboarding tercihi olarak görmek istiyorsanız bu risk kabul edilebilir; fakat “doğrulanmadan uygulamaya girilemez” kuralı ise sunucuda uygulanmalıdır.

---

## H-02 — Gizlilik sınırları belirsiz ve varsayılan erişim geniş

**Kanıt**

- `storage.rules` avatar ve bira görselleri için `allow read: if true` kullanıyor.
- `database.rules.json` kullanıcı profillerini auth olan herkese okunabilir yapıyor.
- `FeedScreen` konum bilgisini reverse-geocode ederek paylaşımın `location` alanına ekliyor.

**Risk**

- Bir kez elde edilen Storage URL’si, kullanıcı hesabı olmayan kişiler tarafından da erişilebilir olabilir.
- Kullanıcı adı, avatar, bira istatistiği ve konum bilgisi uygulamadaki tüm giriş yapmış kullanıcılara açılır.
- Konum bilgisi, fotoğraf arka planı ile birleştiğinde hassas davranışsal veri haline gelebilir.

**Çözüm**

- Ürün kararını yazılı hale getirin: içerik public mi, yalnız arkadaşlara mı, yoksa grup bazlı mı?
- Konum varsayılan olarak kapalı olmalı; paylaşım öncesi açık rıza/toggle gösterilmeli.
- Konum hassasiyetini il/ilçe yerine “yaklaşık konum” seviyesine düşürün veya kullanıcıdan manuel yer etiketi alın.
- Public URL kullanımını bilinçli tercih etmiyorsanız Storage read kuralını auth/friendship tabanlı hale getirin.
- Gizlilik politikası, veri saklama süresi, kullanıcı verisi dışa aktarma/silme akışı ekleyin.

---

## H-03 — Arkadaşlık isteği sahteciliğine ve spam’e açık

**Kanıt**

`friendRequests/{toUserId}/{fromUserId}` için yazma kuralı, isteği gönderen UID’ye **veya** alıcı UID’ye yazma izni veriyor. Alıcı teorik olarak başka bir kişinin `fromUserId` değeriyle istek kaydı oluşturabilir. Ayrıca alanların gerçek gönderen profilinden türetildiğini doğrulayan şema kuralı yok.

**Risk**

- Sahte arkadaş isteği.
- Sahte kullanıcı adı/avatar bilgisi.
- Spam request üretimi.
- Request state/metadata değişimi.

**Çözüm**

- İstek oluşturma: yalnız `fromUserId === auth.uid`.
- İstek kabul/red: yalnız `toUserId === auth.uid` ve yalnız izin verilen status geçişleri.
- İdeal çözüm: request oluşturma, kabul, silme işlemlerini Callable Function’a taşıyın.
- Kullanıcı başına günlük istek limiti, block listesi, abuse report ve App Check ekleyin.

---

## H-04 — Feed/arama mimarisi küçük veri için çalışır, büyümede pahalılaşır

**Kanıt**

- `getFriendsFeed` her arkadaş için ayrı bira sorgusu yapıyor, sonuçları istemcide birleştirip sıralıyor.
- `getFriends` ve kullanıcı adı araması birden fazla ardışık kullanıcı okuması yapıyor.
- Pagination cursor’u timestamp tabanlı ve istemci tarafında çalışıyor.
- Her feed öğesinde yorum/reaction objeleri de taşınabiliyor.

**Risk**

Arkadaş sayısı ve geçmiş paylaşım arttıkça:

- Açılış süresi uzar.
- Firebase read ve egress maliyeti artar.
- Gerçek pagination yerine her seferinde fazla veri çekilir.
- Aynı timestamp’e sahip kayıtlar cursor sınırında atlanabilir veya tekrar görünebilir.
- Çok yorumlu gönderiler feed yükünü gereksiz büyütür.

**Çözüm**

- Feed’i denormalize edin: `feeds/{userId}/{beerId}` veya friend graph değiştiğinde oluşturulan feed index.
- Feed kaydında yalnız kart için gereken alanları tutun; yorumların tamamını BeerDetail ekranında yükleyin.
- Cursor olarak sadece timestamp yerine `(timestamp, beerId)` sıralama anahtarı veya push ID tabanlı sıralama kullanın.
- Kullanıcı adı aramasını normalleştirilmiş arama indeksiyle, debounce + limit + caching ile yapın.
- Birden fazla bağımsız okuma için sıralı `await` yerine kontrollü paralellik kullanın; ancak önce veri modelini iyileştirin.

---

## H-05 — Çok adımlı yazmalar atomik değil; sayaç drift’i oluşur

**Etkilenen akışlar**

- `addBeer`: Storage upload → bira kaydı → toplam sayaç → yıllık sayaç → Guinness sayaçları.
- `deleteBeer`: bira silme → toplam/yıllık sayaç güncelleme.
- `toggleGuinness`: biranın flag’i → kullanıcı Guinness sayaçları.
- `acceptFriendRequest`: iki profile friend yazma → request silme.
- `removeFriend`: iki profilden friend silme.

**Risk**

İkinci veya üçüncü yazma başarısız olursa sistem yarım durumla kalır. Ağ retry’si çift sayım yapabilir. Aynı kullanıcı iki cihazdan işlem yaparsa “read-modify-write” yarışları oluşur.

**Somut bug**

`deleteBeer` akışında Guinness bira silindiğinde `totalGuinnessBeers` ve `guinnessByYear` değerlerinin de azaltılması gerekir. Bu yapılmıyorsa Guinness istatistiği kalıcı şekilde şişer.

**Çözüm**

- Çoklu RTDB değişiklikleri için tek `update()` fan-out çağrısı kullanın.
- Sayaçlar için transaction veya daha iyi olarak server-side function kullanın.
- Operasyonlara idempotency key ekleyin: aynı “bira ekleme” retry edildiğinde ikinci bira/sayaç oluşmasın.
- Başarısız upload sonrası orphan Storage dosyalarını cleanup kuyruğuna alın.

---

## H-06 — E-posta mapping/migration tasarımı PII ve erişim riski taşıyor

**Kanıt**

- `src/services/userService.ts` e-posta → UID mapping arıyor.
- `src/services/emailMigration.ts`, tüm kullanıcıları okuyup `emails/{encodedEmail}` alanına mapping yazmak için istemci kodu içeriyor.
- Mevcut RTDB rules dosyasında `emails` dalı için açık izin kuralı görünmüyor.
- Kayıt akışında bu mapping’in her kullanıcı için yazıldığı net görünmüyor.

**Risk**

- Feature zaten erişim hatası nedeniyle çalışmıyor olabilir.
- İzin açılırsa e-posta enumeration ve kişisel veri sızıntısı oluşabilir.
- Migration’ın mobil uygulamadan çalıştırılması, tüm user dataset’ini istemciye çekmeye çalıştığı için güvenli ve ölçeklenebilir değildir.

**Çözüm**

- E-posta ile hesap bulma ihtiyacını yeniden değerlendirin; Firebase Auth zaten e-posta tabanlı password reset sağlıyor.
- Gerçekten gerekiyorsa mapping’i Cloud Function/Admin SDK ile yönetin; plaintext e-postayı RTDB anahtarında tutmayın.
- Migration’ı güvenli tek seferlik yönetici script’i olarak çalıştırın, mobil bundle’da tutmayın.

---

# 3. Güvenlik ve veri modeli eksikleri

## 3.1 Realtime Database doğrulama kuralları eksik

Mevcut rules çoğunlukla “kim yazabilir?” sorusuna sınırlı cevap veriyor; “ne yazabilir?” sorusunu cevaplamıyor.

Eklenmesi gereken validation örnekleri:

- `displayName`, `username`, comment text için minimum/maksimum uzunluk.
- Beklenen string/number/boolean tipleri.
- `timestamp` için mantıklı aralık.
- Kullanıcının yazamayacağı alanlar: sayaclar, role/admin, başka kullanıcı bilgisi, ownership alanları.
- Bira oluştururken `newData.child('userId').val() === auth.uid`.
- Mevcut bira güncellenirken `userId` immutable.
- Reaction yalnız izinli emoji setinden biri olsun.
- Comment userId immutable olsun; değiştirme yerine silme + yeniden oluşturma modeli kullanın.

## 3.2 Username index güvenilir değil

`usernames/{username}` düğümünde sadece “henüz yoksa yazılabilir” kontrolü yeterli değil.

Eksikler:

- `newData.val() === auth.uid` doğrulaması yok.
- Username formatı/lowercase normalizasyonu yok.
- Eski username’i boşaltma, rename ve rezervasyon süreci tanımlı değil.
- Rate limit ve enumeration koruması yok.

**Öneri:** Username’i normalize edin (`trim`, lowercase, izinli karakterler). Yazma işlemini backend üzerinden yapın veya kuralda UID eşitliği + format doğrulaması yapın.

## 3.3 Client-side “master password” hiçbir zaman üretim sırrı olmamalı

`.env.example` içinde `MASTER_PASSWORD` tanımlanmış. React Native/Expo uygulamasındaki environment değişkenleri derleme sırasında istemci bundle’ına dahil olabilir; bu yüzden burada saklanan değer gerçek sır değildir.

**Yapılacaklar**

- Production’dan tamamen kaldırın.
- Yönetici işlemleri için Firebase Custom Claims + backend/Admin SDK kullanın.
- Geliştirme için bile gerçek kullanıcı hesabı veya local Emulator kullanmak daha güvenlidir.

## 3.4 Firebase App Check ve abuse kontrolleri görünmüyor

Öneriler:

- Firebase App Check etkinleştirin.
- Firebase Auth, RTDB ve Storage için abuse/traffic izleme alarmı kurun.
- Friend request, comment, upload için oran sınırlama uygulayın.
- Blokla, raporla ve moderasyon iş akışı ekleyin.

---

# 4. Fonksiyonel kalite sorunları ve iyileştirmeler

## 4.1 E-posta doğrulama sonrası kullanıcı ekranda takılabilir

`EmailVerificationScreen` `reload(currentUser)` çağrısından sonra auth state listener’ın otomatik yönlendirme yapacağını varsayıyor. Bu varsayım güvenilir bir state güncelleme stratejisi değildir.

**İyileştirme**

- `reload()` sonrası doğrulama sonucunu context state’ine açıkça yazın.
- ID token değişimini izlemek için uygun auth observer kullanın.
- Doğrulanmadı/başarılı/error testlerini gerçek cihaz ve web üzerinde çalıştırın.

## 4.2 Profil ekranında kamera görseli iOS’ta koşulsuz flip ediliyor

`ProfileScreen` iOS’ta çekilen her kamera fotoğrafını yatay çeviriyor. Ön kamera için amaçlanan davranış arka kamera fotoğrafını da etkileyebilir.

**İyileştirme**

- Kamera yönünü metadata ile doğrulayın.
- Çevirme kararını sadece gerçekten front camera için uygulayın.
- iOS ve Android görsel regression testi ekleyin.

## 4.3 Sabit yıl listesi liderlik tablosunu hızla eskitecek

`LeaderboardScreen` yıl seçicisini `[2024, 2025, 2026, 2027]` olarak sabitliyor.

**İyileştirme**

- Yılları veri setinden türetin veya current year etrafında dinamik oluşturun.
- Yeni yıl geçişi için otomatik test ekleyin.
- Aynı puanda rank kuralını tanımlayın: eşit puan 2., 2. mi; yoksa 2., 3. mü?

## 4.4 Yorum/reaksiyon bileşenlerinde çift kaynak ve stil tutarsızlığı

`CommentSection` ve `ReactionBar` mevcut, fakat BeerDetail kendi yorum/reaksiyon arayüzünü ayrıca oluşturuyor. Bu zamanla iki farklı davranış ve stilin bakım maliyetini artırır.

**İyileştirme**

- Tek bileşen seti seçin.
- Data transform, formatTime, reaction count, error handling ve loading davranışlarını merkezi hale getirin.

## 4.5 Hata ve loading davranışı ekranlar arasında standart değil

Bazı servisler `{ success, error }` döndürüyor, bazı ekranlar doğrudan `console.error` yapıyor, bazıları modal gösteriyor. İstek iptali/ekran unmount sonrası state update koruması da görünmüyor.

**İyileştirme**

- Tek bir `Result<T>` tipi ve error-code map’i kullanın.
- Her async ekranda `loading`, `refreshing`, `empty`, `error`, `retry` durumlarını açıkça tasarlayın.
- İzlenebilir hata kayıtları ekleyin; production’da yalnız `console.log` kullanmayın.

---

# 5. Ölçeklenebilirlik, maliyet ve performans

## 5.1 Feed veri modelini yeniden tasarlayın

Mevcut yaklaşım arkadaş başına ayrı query ile çalışıyor. Bu, 5 arkadaşta tolere edilebilir; 100 arkadaş ve uzun geçmişte kötüleşir.

**Hedef model**

```text
beers/{beerId}                 -> kanonik paylaşım
userBeers/{uid}/{beerId}       -> profil sayfalama indeksi
feeds/{viewerUid}/{beerId}     -> feed kartı için denormalize indeks
comments/{beerId}/{commentId}  -> ayrı yorum koleksiyonu
reactions/{beerId}/{uid}       -> ayrı reaction koleksiyonu
leaderboards/{year}/{uid}      -> yalnız backend yazar
```

Bu yapı, daha az veri indiren gerçek pagination, feed index güncellemesi ve daha net authorization sağlar.

## 5.2 Görsel optimizasyon eksik

- Feed ve profil grid’i için thumbnail üretimi yok.
- Orijinal görseller büyük olabilir.
- Eski Storage dosyaları silinmiyor.

**Öneri**

- Upload öncesi resize/compress için hedef boyut belirleyin.
- Thumbnail/original ayrımı yapın.
- CDN cache, placeholder, error fallback ve progressive image yükleme ekleyin.
- Storage lifecycle/cleanup politikası kurun.

## 5.3 Yorumlar biranın ana objesine gömülü olmamalı

Yorum sayısı büyüdükçe birayı her getirişte tüm yorumların indirilmesi pahalılaşır. Yorumlar ayrı düğümde cursor ile yüklenmeli; bira objesinde yalnız `commentCount` tutulabilir.

## 5.4 Gerçek zamanlı güncelleme tercihi net değil

Servisler çoğunlukla tek seferlik `get()` kullanıyor. Bu bilinçli bir seçimse sorun değil; ancak sosyal feed’de reaction/comment/friend state’i stale kalabilir.

**Öneri:** Kritik ekranlarda `onValue` / child event + düzgün unsubscribe, diğer ekranlarda cache + manual refresh yaklaşımını bilinçli olarak seçin.

---

# 6. Test, CI ve release eksikleri

## 6.1 Görünür test otomasyonu yok

`package.json` içinde start/android/ios/web/eject script’leri var; görünür `test`, `lint`, `typecheck` veya CI gate script’i yok. ESLint ve TypeScript ayarları var ama çalışma hattına bağlanmamış görünüyor.

**Önerilen minimum script seti**

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand",
    "test:rules": "firebase emulators:exec --only database,storage \"npm run test:rules:unit\"",
    "check": "npm run lint && npm run typecheck && npm run test"
  }
}
```

> Komutlar proje için örnektir; kullanılacak test framework ve Expo uyumluluğuna göre uyarlayın.

## 6.2 Firebase Rules testleri zorunlu olmalı

Özellikle şu senaryolar otomatik test edilmeden rules deploy edilmemeli:

- Kullanıcı A, kullanıcı B’nin profil sayacını değiştiremez.
- Kullanıcı A, kendi beer kaydını oluşturabilir; B oluşturamaz/değiştiremez.
- Kullanıcı B, A’nın paylaşımına yalnız kendi reaction’ını yazabilir.
- Kullanıcı B, yalnız kendi comment’ini değiştirebilir/silebilir.
- Request yalnız gerçek sender tarafından oluşturulur; yalnız recipient kabul/reddeder.
- Storage’da A yalnız `avatars/A/*` ve `beers/A/*` yazabilir.
- Doğrulanmamış kullanıcı için beklenen erişim politikası test edilir.

## 6.3 CI/CD önerisi

Her pull request’te:

1. `npm ci` veya tek lockfile’a göre deterministik kurulum.
2. `lint`.
3. `typecheck`.
4. Unit/component testleri.
5. Firebase Rules Emulator testleri.
6. Secret scan ve dependency audit.
7. Expo smoke build veya en az `expo export` doğrulaması.

Main/production branch için ayrıca EAS preview build ve release notes süreci ekleyin.

## 6.4 İki lockfile riski

Repoda hem `package-lock.json` hem `yarn.lock` bulunuyor. Aynı bağımlılık ağacının iki farklı resolver ile drift etmesi mümkündür.

**Öneri:** npm veya Yarn’dan birini seçin, diğer lockfile’ı kaldırın, README ve CI’ı aynı paket yöneticisine sabitleyin.

---

# 7. Dokümantasyon ve bakım borcu

## 7.1 README güncel mimariyi anlatmıyor

README eski bir kamera/counter uygulaması ve JavaScript dosya yapısı anlatıyor. Güncel branch ise TypeScript, Firebase Auth, social feed, friends, leaderboard, profile ve Storage tabanlı farklı bir ürün yapısına sahip.

**Güncellenmesi gerekenler**

- Proje amacı ve ana özellikler.
- Güncel klasör ağacı.
- Gereksinimler ve tek paket yöneticisi.
- `.env` kurulum adımları.
- Firebase Authentication/RTDB/Storage kurulum ve rule deploy adımları.
- Emulator geliştirme akışı.
- Test, lint, typecheck komutları.
- EAS build/release adımları.
- Gizlilik ve içerik moderasyon yaklaşımı.

## 7.2 Mimari sorumluluklar ekranlarda toplanmış

`FeedScreen`, `ProfileScreen` ve `BeerDetailScreen` hem UI, hem kamera/konum, hem veri yükleme, hem mutation, hem error handling sorumluluğu taşıyor.

**Öneri**

- `features/auth`, `features/feed`, `features/profile`, `features/friends` yapılandırmasına geçin.
- Her feature için API/service, hook, components, types ayrımı yapın.
- `useFeed`, `useBeerDetail`, `useProfileMedia`, `useFriendRequests` gibi test edilebilir hook’lar üretin.
- Firebase SDK çağrılarını UI’dan kaldırıp repository/service katmanına taşıyın.

## 7.3 Tema ve dil tutarlılığı

Theme context olmasına rağmen birçok ekranda hard-coded beyaz/siyah/gri renk kullanılıyor. Metinler İngilizce ve Türkçe karışık.

**Öneri**

- Tüm renkleri theme token’ları üzerinden verin.
- i18n kütüphanesi ve locale dosyaları ekleyin.
- Dark mode, long-text, küçük ekran ve accessibility font scale testleri yapın.

## 7.4 Accessibility eksikleri

Kodda etkileşimli ikonlar ve görseller için erişilebilir label/hint kullanımı sınırlı görünüyor.

**Öneri**

- `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` ekleyin.
- Renk dışında durum göstergesi kullanın.
- Kontrast ve minimum dokunma alanı testleri yapın.

---

# 8. İzinler, gizlilik ve ürün güvenliği

## 8.1 Fazla Android izinleri

`app.json` içinde kamera ve konum yanında `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` izinleri bulunuyor. İncelenen kodda ses kaydı özelliği görülmüyor.

**Risk**

- Kullanıcı güvenini ve mağaza incelemesini olumsuz etkileyebilir.
- Fazla izin, gereksiz saldırı yüzeyi ve “neden bu izin isteniyor?” sorusu doğurur.

**Öneri**

- Sadece gerçekten kullanılan izinleri bırakın.
- Android sürümüne göre modern media permission yaklaşımını doğrulayın.
- Her izin için uygulama içi açıklama ve kullanıcı değeri gösterin.

## 8.2 Alkol odaklı sosyal ürün için politika eksikleri

Uygulama bira paylaşımı ve sosyal etkileşim içeriyor. Hedef pazara göre yaş doğrulama, sorumlu tüketim metni, içerik raporlama, kullanıcı engelleme, gizlilik politikası ve hesap silme gereksinimleri gündeme gelebilir.

Bu bölüm hukuki görüş değildir; yayınlanacak ülke/mağaza politikalarına göre hukuk ve ürün tarafıyla kontrol edilmelidir.

---

# 9. Önceliklendirilmiş aksiyon planı

## P0 — Üretime çıkmadan önce

1. Storage path’lerini ve Storage rules’ı aynı modele getir.
2. Yorum/reaction için alt-path authorization ve validation ekle.
3. Arkadaş kabul/silme işlemlerini backend/Callable Function + atomik fan-out’a taşı.
4. Kullanıcının yazabileceği profil alanlarını daralt; counters ve leaderboard server-owned olsun.
5. E-posta doğrulama politikasını backend rules ile netleştir.
6. Firebase Emulator üzerinde rules test suite’i yaz.
7. Mevcut production data varsa rule değişiklikleri öncesinde backup al ve migration planı hazırla.

## P1 — İlk güvenilir sürüm

1. Add/delete/toggle işlemlerini idempotent ve atomik hale getir.
2. Orphan photo cleanup ve hesap/veri silme akışı ekle.
3. Feed indeksini ve gerçek pagination’ı tasarla.
4. App Check, request rate limiting, block/report/moderation ekle.
5. `lint`, `typecheck`, test ve CI pipeline kur.
6. README’yi güncel mimariye göre yeniden yaz.

## P2 — Kalite ve ölçek

1. Thumbnail, image optimization ve Storage lifecycle ekle.
2. i18n, accessibility, tutarlı dark mode.
3. Error monitoring, analytics, crash reporting ve dashboard.
4. Notification, offline cache ve realtime stratejisini ürün ihtiyacına göre netleştir.
5. Kullanıcı arama, leaderboard ve feed için performans ölçümleri ekle.

---

# 10. Uygulanabilir hedef mimari

## İstemci

- Expo/React Native: UI, local state, güvenli Firebase Auth session.
- UI mutation’ları doğrudan global sayaçlara yazmaz.
- Kullanıcı görselini yalnız kendi UID klasörüne upload eder.

## Firebase Realtime Database

- Public profile / private profile ayrımı.
- Bira, yorum, reaction, friend request için ayrı ve doğrulanabilir düğümler.
- İstemcinin doğrudan değiştiremeyeceği derived data: counts, leaderboard, feed index.

## Backend (Cloud Functions veya eşdeğer)

- `createBeer`, `deleteBeer`, `toggleGuinness`.
- `sendFriendRequest`, `acceptFriendRequest`, `removeFriend`.
- Feed/leaderboard denormalizasyonu.
- Rate limit, App Check doğrulaması, audit log.
- Storage cleanup ve kullanıcı silme işleri.

## Gözlemlenebilirlik

- Structured error tracking.
- Firebase permission-denied oranı alarmı.
- Upload başarısızlığı, function retry, orphan file, feed latency metrikleri.

---

# 11. Önerilen test matrisi

| Alan | Örnek test |
|---|---|
| Auth | Kayıt, login, yanlış şifre, reset password, verify/resend, logout. |
| Rules | Sahip olmayan beer düzenleyemez; arkadaş yorum atabilir; ilgisiz kullanıcı politika gereği erişemez. |
| Storage | UID dışı klasöre upload reddi; izinli image upload kabulü; dosya boyutu/MIME reddi. |
| Friend | İstek gönderme, duplicate request, kabul, red, silme, ağ kesintisi, eşzamanlı kabul. |
| Beer | Upload başarısızlığı, DB başarısızlığı, retry, Guinness toggle, silme sonrası sayaç tutarlılığı. |
| Feed | Çok arkadaş, aynı timestamp, boş feed, pagination, duplicate önleme. |
| UI | Dark/light, küçük ekran, uzun kullanıcı adı, klavye açık comment input, web/iOS/Android. |
| Privacy | Konum izni reddi, konum kapalı paylaşım, profil/medya görünürlük politikası. |

---

# 12. İnceleme sınırları ve doğrulama gerektiren noktalar

Aşağıdaki maddeler kaynakta statik olarak doğrulanamadı; release öncesi ayrıca kontrol edilmelidir:

- Firebase Console’daki aktif RTDB/Storage kurallarının repository dosyalarıyla birebir aynı olup olmadığı.
- Firebase Authentication e-posta doğrulama, password policy, abuse protection ve App Check ayarları.
- EAS production credentials, signing, store submission ve update channel konfigürasyonu.
- Gerçek cihazda Android/iOS kamera, galeriden seçim, görüntü flip ve konum akışı.
- `npm audit`/SCA sonuçları ve güncel bağımlılık güvenlik durumu.
- `tsc --noEmit`, ESLint ve Expo production build sonucu.
- Mevcut Firebase verisindeki orphan Storage dosyaları, yarım friend ilişkileri ve bozuk sayaçlar.

---

## Sonuç

Bu branch’teki en büyük problem UI değil; **istemci kodu, Firebase rules ve veri modelinin aynı güvenlik/işlem modelini paylaşmaması**. Önce upload path–rule uyumu, sosyal etkileşim authorization’ı, friend fan-out işlemleri ve server-owned istatistikler düzeltilirse ürün çok daha sağlam bir temel kazanır. Ardından test/CI, feed indeksleme, gizlilik ve moderasyon yatırımları yapılmalıdır.
