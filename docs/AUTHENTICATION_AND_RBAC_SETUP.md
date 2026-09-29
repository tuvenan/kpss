# KPSS Platformu — Kimlik Doğrulama ve Rol Bazlı Yetkilendirme (RBAC) Rehberi

Bu belge, KPSS platformunda kurulan uçtan uca Supabase tabanlı kimlik doğrulama, rol hiyerarşisi, RLS (Row Level Security) politikaları, veritabanı migration'ları ve çalışma alanlarının (workspaces) kullanım kılavuzudur.

---

## 1. Mimari Genel Bakış ve Güvenlik İlkeleri

Sistemde 4 temel rol yer alır:

| Rol (Kod) | Türkçe Karşılığı | Açıklama |
| :--- | :--- | :--- |
| `member` | **Üye** | Varsayılan kayıtlı öğrenci rolü. Soru çözer, denemelere katılır, çalışma takvimini takip eder, davet koduyla öğretmen sınıflarına katılır. |
| `teacher` | **Öğretmen** | Sınıf açar, öğrencileri davet eder, sınıfındaki öğrencilerin ilerleme durumunu izler, ödev ve deneme atar. |
| `editor` | **Editör** | Müfredat ağacını (ders, ünite, konu) yönetir, soru bankasına soru ekler/günceller, toplu soru paketlerini yükler ve hata havuzunu inceler. |
| `super_admin` | **Süper Admin** | Platformun tam yetkili yöneticisidir. Kullanıcılara rol atar/kaldırır, hesapları askıya alır/yeniden etkinleştirir, sistem audit loglarını inceler ve tüm yetkileri kullanabilir. |

### Katı Güvenlik Kuralları

1. **İstemci Tarafına Asla Güvenilmez:**  
   Kullanıcı rolleri hiçbir zaman `localStorage`, `sessionStorage` veya kullanıcı tarafından düzenlenebilen `user_metadata` alanlarından yetki kontrolü için **okunmaz**. Roller her zaman Supabase `public.user_roles` tablosundan RLS korumalı sorgu ile çekilir.
2. **service_role Anahtarı İstemcide Bulunamaz:**  
   Frontend Vite bundle'ında veya `.env` dosyasında `SUPABASE_SERVICE_ROLE_KEY` bulunmaz. Tüm yetkili işlemler SQL seviyesinde `SECURITY DEFINER` RPC fonksiyonları (`assign_user_role`, `remove_user_role`, `suspend_user`, `reactivate_user`) ile yürütülür.
3. **Otomatik Üye Tanımlama:**  
   Açık kayıt (public registration) olan her kullanıcı veritabanı trigger'ı (`on_auth_user_created`) aracılığıyla yalnızca `member` rolüyle başlatılır.
4. **Son Süper Admin Koruması:**  
   Sistemde en az 1 aktif süper admin bulunması zorunludur. `remove_user_role` RPC fonksiyonu, son süper admin silinmeye çalışıldığında işlemi veritabanı seviyesinde `RAISE EXCEPTION` ile engeller.
5. **Değiştirilemez Denetim Kayıtları (Append-Only Audit Logs):**  
   `audit_logs` tablosunda yalnızca `INSERT` ve `SELECT` yetkisi tanımlıdır. `UPDATE` veya `DELETE` politikası bulunmadığından denetim logları silinemez veya değiştirilemez.

---

## 2. Migration Dosyaları ve Uygulama Sırası

Supabase veritabanında migration dosyaları aşağıdaki sırayla çalıştırılmalıdır:

```text
supabase/migrations/
  ├── 20260930000001_profiles_and_roles.sql
  ├── 20260930000002_teacher_classes_assignments.sql
  ├── 20260930000003_content_workflow_audit_logs.sql
  └── 20260930000004_security_functions_and_rpc.sql
```

### Migration Detayları

1. **`20260930000001_profiles_and_roles.sql`**:
   - `profiles` tablosunu oluşturur ve `auth.users` ile ilişkilendirir.
   - `user_roles` tablosunu ve `user_role` ENUM tipini (`member`, `teacher`, `editor`, `super_admin`) oluşturur.
   - `has_role`, `is_super_admin`, `is_editor_or_admin`, `is_teacher` yardımcı fonksiyonlarını tanımlar.
   - Yeni kullanıcı kaydolduğunda otomatik `profiles` ve `member` rolü oluşturan trigger'ı (`on_auth_user_created`) kurar.
   - RLS politikalarını aktive eder.

2. **`20260930000002_teacher_classes_assignments.sql`**:
   - `teacher_classes`: Öğretmenin açtığı sınıflar ve 30 gün geçerli katılım davet kodları (`KPSS-XXXXXX`).
   - `class_members`: Sınıflara katılan öğrenciler.
   - `assignments`: Öğretmenin sınıfa atadığı test, deneme veya çalışma planları.
   - `assignment_results`: Öğrencilerin ödev tamamlama durumları.
   - İzolasyon RLS politikaları: Öğretmenler sadece kendi sınıflarını ve bu sınıflara kayıtlı öğrencileri görebilir; öğrenciler ise sadece katıldıkları sınıfların ödevlerini görebilir.

3. **`20260930000003_content_workflow_audit_logs.sql`**:
   - Müfredat ve soru tablolarına (`subjects`, `units`, `topics`, `questions`) içerik iş akışı kolonları ekler: `status` ('draft', 'in_review', 'published', 'archived'), `created_by`, `published_by`, `version`.
   - `audit_logs` tablosunu kurar (actor_id, action, target_user_id, details, ip_address, user_agent, created_at).
   - `role_invitations` tablosunu ekler.
   - `audit_logs` için sadece INSERT ve SELECT izinleri vererek değiştirilemezliği garanti eder.

4. **`20260930000004_security_functions_and_rpc.sql`**:
   - `assign_user_role(target_user_id, new_role)`: Güvenli rol atama ve audit log kaydı.
   - `remove_user_role(target_user_id, target_role)`: Son süper admin kontrolü ile güvenli rol kaldırma.
   - `suspend_user(target_user_id, reason)`: Kullanıcı hesabını dondurma ve oturumunu sonlandırma.
   - `reactivate_user(target_user_id)`: Hesabı yeniden aktifleştirme.
   - `join_class_by_invite_code(code)`: Öğrencinin davet koduyla güvenli biçimde sınıfa katılması.
   - `bootstrap_initial_super_admin(target_user_id)`: İlk kurulum bootstrap fonksiyonu.

---

## 3. İlk Süper Admin'i Tanımlama (Bootstrap)

Veritabanında henüz hiçbir `super_admin` bulunmadığında, ilk süper admin'i güvenle tanımlamak için Supabase SQL Editor'de aşağıdaki komut bir defaya mahsus çalıştırılır:

```sql
-- 'YOUR_AUTH_USER_UUID' yerine ilk süper admin yapılacak kullanıcının auth.users tablosundaki id'si yazılır:
SELECT bootstrap_initial_super_admin('YOUR_AUTH_USER_UUID');
```

> **Önemli Güvenlik Notu:**  
> `bootstrap_initial_super_admin` fonksiyonu, veritabanında aktif `super_admin` sayısı `0` olduğu sürece çalışır. İlk süper admin oluştuktan sonra bu fonksiyon otomatik olarak kilitlenir ve sonradan yetkisiz çağrılsa dahi işlem yapmaz.

---

## 4. Rol Yetki Matrisi (Capability Matrix)

| Yetenek / Alan | Üye (`member`) | Öğretmen (`teacher`) | Editör (`editor`) | Süper Admin (`super_admin`) |
| :--- | :---: | :---: | :---: | :---: |
| Kendi profilini yönetme | ✅ | ✅ | ✅ | ✅ |
| Quiz ve deneme çözme | ✅ | ✅ | ✅ | ✅ |
| Hata havuzunu kullanma | ✅ | ✅ | ✅ | ✅ |
| Davet koduyla sınıfa katılma | ✅ | ✅ | ✅ | ✅ |
| Sınıf oluşturma ve davet kodu üretme | ❌ | ✅ | ❌ | ✅ |
| Sınıfındaki öğrencilerin ilerlemesini görme | ❌ | ✅ | ❌ | ✅ |
| Sınıfa ödev / deneme atama | ❌ | ✅ | ❌ | ✅ |
| Müfredat (ders/ünite/konu) düzenleme | ❌ | ❌ | ✅ | ✅ |
| Soru bankasına soru ekleme/düzenleme | ❌ | ❌ | ✅ | ✅ |
| Toplu soru JSON paketi yükleme | ❌ | ❌ | ✅ | ✅ |
| Hatalı soru raporlarını inceleme/çözme | ❌ | ❌ | ✅ | ✅ |
| Kullanıcıları listeleme ve rollerini yönetme | ❌ | ❌ | ❌ | ✅ |
| Kullanıcı hesaplarını askıya alma | ❌ | ❌ | ❌ | ✅ |
| Güvenlik denetim kayıtlarını (Audit Logs) inceleme | ❌ | ❌ | ❌ | ✅ |
| Sistem önbelleği ve ayarlarını yönetme | ❌ | ❌ | ❌ | ✅ |

---

## 5. Çalışma Alanları ve Rota Yapısı

Uygulamada URL hash tabanlı korumalı rotalar kullanılır:

1. **`#student` (Öğrenci Paneli - Varsayılan):**
   - Tüm kullanıcıların ve misafirlerin erişebildiği ana alan.
   - Profil menüsünden **"Sınıfa Katıl (Davet Kodu)"** seçeneği ile öğretmen davet kodları (`KPSS-XXXXXX`) girilebilir.
   - Çoklu role sahip kullanıcılar profil menüsünden yetkili oldukları panellere doğrudan geçiş yapabilir.

2. **`#teacher` (Öğretmen Çalışma Alanı):**
   - `<RequireRole role="teacher">` ile korunur.
   - **Sınıflarım:** Yeni sınıf oluşturma, 6 haneli benzersiz davet kodu ve kopyalama.
   - **Öğrencilerim & İlerleme:** Seçili sınıfa katılan öğrencilerin isim, avatar, hedef sınav ve katılım tarihleri.
   - **Ödev / Deneme Ata:** Konu testi, KPSS genel denemesi veya çalışma hedefi atama; atanan görevlerin tamamlanma sayaçları.

3. **`#editor` (Editör Çalışma Alanı):**
   - `<RequireRole role="editor">` ile korunur.
   - Kullanıcı yönetimi veya sistem ayarları bu alanda yer almaz; yalnızca içerik akışına odaklanır.
   - **Müfredat Ağacı:** Ders, ünite ve konu hiyerarşisi.
   - **Soru Bankası & İnceleme:** Soruları filtreleme, düzenleme, silme.
   - **Toplu Soru Yükleme:** JSON paket doğrulaması ve yükleme.
   - **Hata Havuzu:** Bildirilen soru inceleme ve hata giderme.

4. **`#admin` (Süper Admin Yönetim Merkezi):**
   - `<RequireRole role="super_admin">` ile korunur.
   - **Kullanıcılar & Roller:** Tüm kullanıcıları arama, rol atama, rol kaldırma, hesap dondurma/aktifleştirme.
   - **Denetim Kayıtları:** Sistemde gerçekleşen rol atama, kaldırma, askıya alma ve içerik yayımlama olaylarının salt-okunur listesi.
   - **Genel Bakış, Müfredat, Soru Bankası, Sistem Ayarları.**

---

## 6. Otomatik Testler ve Doğrulama

Sistemin bütünlüğü aşağıdaki komutlarla doğrulanabilir:

```bash
# Otomatik testleri (Vitest) çalıştırma:
npm run test:run

# TypeScript tip denetimi:
npx tsc --noEmit

# Production build kontrolü:
npm run build
```

Tüm testler harici ağ çağrıları yapmadan, izole ve deterministik mock altyapısıyla çalışacak şekilde yapılandırılmıştır.
