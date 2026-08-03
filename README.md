E-commerce Order API (NestJS)
Layihənin Məqsədi (Goal)
İstehsal səviyyəsində (production-style) e-commerce backend sistemi qurmaq. Bura daxildir: CRUD əməliyyatları, autentifikasiya, tranzaksiyalar, keşləmə (caching) və hadisələrə əsaslanan (event-driven) dizayn.
Texnologiya Yığını (Tech Stack)
NestJS + TypeScript

MYSQL (verilənlər bazası) —TypeORM-dən istifadə edilir.
Keşləmə (Caching): @nestjs/cache-manager vasitəsilə yaddaşda (in-memory) keşləmə.

Swagger: Bütün endpoint-lərin əvvəldən sənədləşdirilməsi.

Yüklədiyimiz Paketlər (Packages & Dependencies)
Layihəni qurarkən və tələb olunan funksionallıqları yazarkən aşağıdakı NPM paketlərindən istifadə etmişik:

@nestjs/typeorm və typeorm — NestJS ilə məlumat bazası (MySQL) arasında əlaqə qurmaq və Repository pattern-dən istifadə etmək üçün.

mysql2 — MySQL verilənlər bazası sürücüsü (driver).

@nestjs/mapped-types — DTO-larda (məsələn, UpdateProductDto) PartialType istifadə edərək təkrar kod yazmağın qarşısını almaq üçün.

class-validator və class-transformer — Gələn sorgulardakı (DTO) məlumatların validasiyası (məsələn, boş olmaması, düzgün format) və avtomatik tip çevrilməsi üçün.

@nestjs/swagger və swagger-ui-express — API sənədləşdirməsi (Swagger interfeysi) üçün.

bcrypt — İstifadəçi şifrələrini və tokenlərin hash-lənməsi üçün.

@nestjs/jwt və @nestjs/passport / passport-jwt — JWT əsaslı autentifikasiya (Access və Refresh tokenlər) üçün.

dotenv — Gizli dəyişənləri (.env) idarə etmək üçün.


Milestone 1 — Core CRUD & Data Model
1.Entitylərin Qurulması:
-User:İstifadəçilərin qeydiyyatı,rolu(CUSTOMER,ADMİN),şifrə təhlükəsizliyi və refresh token hash-ləri quruldu.
-Product:Məhsul məlumatları,qiyməti,kateqoriyası ilə əlaqələndirildi və sistemə Soft Delete(deletedAt) mexanizmi əlavə edildi.Bu Mexanizm ondan ibarətdirki,silinən məhsullar siyahıdan gizlənilir lakin silinmədən öncə köhnə sifarişlər bazada saxlanılır.
-Category:Kateqoriyalar  üçün tam CRUD hazırlandı.Öz-özünə referans verən(parentİd) strukturu quruldu maksimum 1 səviyyə dərinlik məhdudiyyəti(alt kateqoriyanında alt kateqoriyası olmayacaq) tətbiq edildi.
-Address:İstifadəçi ünvanları üçün əlaqələr quruldu
2.Məhsullar üzrə Axtarış(Search) və Filtrləmə(/products):
-Səhifələmə(Pagination-page limit) və verilənlər metadata şəklində qaytarılması(data,total,page,pageCount) quruldu.
-Kateqoriya və Qiymət aralığına görə(price range),adına görə axtarış(search by name ) və sıralma(sorting) xüsusiyyətləri quruldu.
3.Swagger  və Seed sənədləşməsi:
-Bütün endpoint-lər Swagger-ə inteqrasiya edildi.1000+ məhsulu test etmək üçün seed skripti hazırlandı.


Milestone 2 — Auth & Authorization
1.JWT Authentifikasiya və Token Mexanizmi:
-İstifadəçinin qeydiyyatı(Register) və sistemə daxil olması(Login) Access Token və Refresh Token generasiyası hazırlandı.
-Təhlükəsizlik üçün Refresh Token Rotation mexanizmi quruldu.
-JWTStrategy və JwtAuthGuard  tənzimlənərək qorunan endpoint-lərin təhlükəsizliyi təmin edildi.Tokenin vaxtının keçnəsi və yenilənməsi zamanı axın səliqəli və işlək vəziyyətə salındı.
2.Şifrələmə(Password Hashing)
-İstifadəçi şifrələri verilənlər bazasında hash-lənərək saxlanıldı.səbəbi isə kənardan gələn kiberhücum zamanı şifrələr yazıldığı kimi qorunmasının qarşısını almaqdır.hashləmə zamanı şifrə database-də simvollar toplsusu şəklində saxlanılır təhlükəsizlik üçün.
3.Rol Əsaslı İcazələr(RBAC)
-Admin və Customer rollarına ayrıldı.Məsələn,Admin rolundakı istifadəçi product əlavə edə bildiyi halda Customer rolunda istifadəçi product əlavə edə bilmir.
-Rolları idarə etmək üçün @Roles dekoratoru və buna uyğun RolesGuard yazıldı.
4.Xüsüsi Parametr Dekoratoru(CurrentUser)
-İstənilən qorunan endpoint-də(Məsələn /logout) cari istifadəçinin məlumatlarını birbaşa əldə etmək üçün custom @CurrentUser dekoratorundan istifadə edirik.



Milestone 3 — Cart & Orders
1.Səbət Mexanizması(Cart Management)
-Hər bir istifadəçin eyni anda aktiv 1 səbəti ola bilər.Səbət elementləri məhsul və miqdarı ilə(quantity) əlaqələdnirilir.
-Post /cart/items:Məhsulu səbətə əlavə edir.Əgər bu məhsul artıq səbətdə varsa yeni sətirdə yazmır onu miqdarının(quantity) üzərinə gəlir.
-PATCH /cart/items/:id və DELETE /cart/items/:id:Səbətin miqdarını və s yeniliyir digəri isə səbətdən tamamilə silir
-GET /cart:Səbət məhsulları ilə birlikdə bütün məlumatları ilə birlikdə(səbətin qiyməti məhsullarə miqdarı) birlikdə istifadəçiyə göstərir.
-Stok Validasiyası-Məhsulu səbətə əlavə dərkən və ya səbəti yeniləyərkən stoku yoxlayır əgər stokda o qədər məhsul yoxdursa istifadəçiyə(Hal hazırda stokda o qədər məhsul yoxdur) mesajını veririk.
2.Ödənişə Keçid və Tranzaksiyalar (Checkout & Transactions):
-POST /orders/checkout:Səbət sifarişə çevirən əsas əməliyyatdır.
-Bu proses zamanı aşağıdakı addımlar ardıcıllıqla icra olunur:
a. Səbətin boş olub olmadığı yoxlanır(boşdursa 400 qaytarır).
b.Hər bir element üçün stok yoxlanır.
c.Məhsulların stokları azaldılır.
d.Sifariş və sifariş elementləri yaradılır. Məhsulun adı və qiyməti sifariş elementinə kopyalanır ki, gələcəkdə məhsulun qiyməti dəyişsə belə, köhnə sifarişlərdə müştərinin həmin vaxt nə qədər ödədiyi düzgün görünsün.
e.Sifariş tamamlandıqdan sonra səbət təmizlənir.
-Database Transictions:
-Bütün bu addımlar Verilənlər Bazası Tranzaksiyası (Transaction) daxilində sarınıb; hər hansı bir addımda xəta baş verərsə, heç bir məlumat yarımçıq saxlanılmır (rollback olunur).
3.Sifarişin Həyat Dövrü və Statusları(Order Lifecycle):
-Sifariş Statusları:Pending->Paid->Shipped->Delivered, əlavə olaraq isə yalnız Pending statusundan keçə bilən Cancelled Mövcuddur.
-Status Keçidlərinə Nəzarət:Yanlış status keçidləri (məsələn, artıq DELIVERED olmuş sifarişi ləğv etmək cəhdi) 409 Conflict xətası qaytarır.
-Stokun Bərpası:PENDİNG Statusundakı sifariş ləğv olunduqda(CANCELLED) məhsulların stoku avtomatik olaraq geri bərpa olunur.
-POST /orders/:id/pay:Ödənişi simulyasiya edir və sifarişin statusunu PAİD olur.
-Sifarişin İzlənməsi:Get/orders cari  istifadəçinin bütün sifarişlərini siyahılayır.GET /orders/:id konkret  sifarişi və onun içindəki məhsulları detallı qaytarır.



Milestone 4 — Caching & Events:
1.In-Memory Keşləmə(Caching):
-Ən çox sorğulanan endpoint olan GET /products (unikal query-param kombinasiyalarına görə) və GET /products/:id üçün @nestjs/cache-manager istifadə edilərək keşləmə mexanizmi quruldu və təhlükəsizlik üçün ağlabatan TTL (məsələn, 60 saniyə) təyin edildi.
-Keşin təmizlənməsi(İnvalidaiton):Məhsul yaradıldıqda,yeniləndi və ya silindikdə köhnəlmiş keş məlumatları təmizləndi.
2.Hadisə Əsaslı Dizayn(Event-Driven Architecture):
-Sifariş Ödənilərkən(order-paid) e-poçt bildirişinin göndərilməsi,adminin  xəbərdar edilməsi və statistikanın yenilənməsi(stockların sayı) kimi əlavə işlər OrderServicedən ayırıldı.
-@nestjs/event-emitter vasitəsilə order-paid və order-created hadisələri emit edildi və ayrı-ayrı siniflər tərəfindən idarə olundu.
-Asinxron İcra: Məsələn, ödəniş zamanı e-poçt simulyasiyası (log faylına yazmaqla) dinləyici vasitəsilə yerinə yetirilir; HTTP cavabı dinləyicilərin bitməsini gözləmir və dinləyicide baş verə biləcək xəta ödəniş əməliyyatına təsir etmir.
3.Planlaşdırılmış tapşırıqlar(Scheduled):
-@nestjs/schedule vasitəsilə qurulan Cron job tətbiq edildi:hər bir neçə dəqiqədən bir 30 dəqiqədən köhnə olan PENDİNG statuslu sifarişlər avtomatik şəkildə ləğv olunur və stok avtomatik şəkildə bərpa olunur.
4.Təhlükəsizlik(Hardening):
-Brute-force hücümların qarşısın almaq üçün @nestjs/throttler istifadə edərək autentifikasiya endpontlərinə rate-limiting tətbiq olundu(Məsələn,hər İP üçün dəqiqədə maksimum 5 login cəhdi).


Milestone 5 — Docs & Polish
1.Loqinq İnterseptoru(Logging İnterceptor) və Qlobal Xəta Filtri(Exception Handling)
-Logging İnterceptor:Gələn Hər bir sorğunun metodunu(Get,Post və s.) yolunu(path),icra müddətini(duration) və istifadəçi identifikatoru(user id) izləmək üçün loq mexanizmi quruldu.
-Global Exception Filter:Bütün xətaların tək  və vahid strukturunda(consistent error shape) müştəriyə qayıtması təmin edildi.
2.Sağlamlıq Yoxlaması EndPointi-(Health Check)
-@nestjs/terminus paketi istifadə edilərək verilənlər bazasının(database) və sistemin işlək vəziyyətdə olmasını yoxlayan health check endpoint-i əlavə edildi.
