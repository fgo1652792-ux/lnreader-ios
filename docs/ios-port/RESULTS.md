# النتائج النهائية الموثقة — LNReader for iOS

> آخر تحديث: 2026-11-06 · فرع `ios-port`

## 1) البناء (GitHub Actions · macOS 26 · Xcode 26.1.1)

| البند | القيمة |
|---|---|
| تشغيل بناء IPA الناجح | https://github.com/syfslfk00-debug/lnreader-ios/actions/runs/42286306959 |
| تشغيل اختبار المحاكي الناجح | https://github.com/syfslfk00-debug/lnreader-ios/actions/runs/42297977059 |
| Artifact | `LNReader-ios-unsigned-ipa` (20.24 MB) |
| SHA256 | `ef4389fdb20f45cc4385ddd835b330b26ab461e7715465e59b495878ba207268` |
| MinimumOSVersion | **16.4** (≤ 18.5 المطلوب ✓) |
| المعمارية | **arm64** فقط (فحص lipo + لا ارتباط بمكتبات المحاكي) |
| الحزمة | `com.rajarsheechatterjee.LNReader` · الإصدار 2.1.4 |
| البنية | `Payload/LNReader.app` — غير موقّع (قابل لإعادة التوقيع) |

## 2) اختبار المحاكي الفعلي

| البند | القيمة |
|---|---|
| الجهاز | **iPad (7th generation)** — `SimDeviceType.iPad--7th-generation` |
| النظام | **iOS 18.5 runtime بالضبط** (نُزِّل عبر `xcodebuild -downloadPlatform iOS -buildVersion 18.5`) |
| الإطلاق | ✓ `simctl launch com.rajarsheechatterjee.LNReader` |
| الاستقرار | ✓ 120 ثانية — العملية حية، لا سجلات انهيار |
| لقطات الشاشة | `docs/ios-port/screenshots/01-launch.png` (0 ث)، `02-after-80s.png`، `03-after-120s.png` — شاشة Onboarding كاملة (ثيمات LNReader التسعة) مرسومة بالكامل |
| أصول القارئ | ✓ فحص مؤتمت: `LNReader.app/ReaderAssets/{css,js,fonts}` داخل حزمة المحاكي وجهاز الجهاز |

## 3) اختبارات الإضافات الحقيقية (منفذة على CI وعلى بيئة التطوير)

نفس مسار التطبيق: تنزيل dist → Function eval → require map → بحث → تفاصيل → فصل (شامل gRPC-web):

| المصدر | اللغة | النتيجة |
|---|---|---|
| wuxiaworld | الإنجليزية | ✅ 2376 فصلًا · 12,757 حرفًا |
| ixdzs8 | **الصينية** | ✅ 627 فصلًا |
| sunovels | **العربية** | ✅ 50 فصلًا (مصدر مترقم parsePage) |
| kakuyomu | اليابانية | ✅ (جولتان سابقتان بمحتوى كامل) |
| royalroad/novelbin/quanben/linovelib | — | ❌ حجب IP مركز بيانات (403/Cloudflare) — قيد بيئي |

## 4) جودة الكود

- `tsc --noEmit` نظيف · `eslint` 0 أخطاء (30 تحذيرًا = مطابق للأصل)
- Jest: **99/99 حزمة · 675/675 اختبارًا** (على CI في كل تشغيل)

## 5) ما تبقى (بسبب تقني موثق في LIMITATIONS.md)

- تنفيذ خلفي حقيقي عند مغادرة التطبيق (لا Headless JS على iOS) — طابور دائم يستأنف عند الفتح
- Share Extension (استقبال المشاركة) — shim آمن حاليًا
- DoH وسجلات الانهيار الأصلية — أندرويد-فقط
- التوقيع: الـIPA غير موقع — راجع SIGNING.md (AltStore/Sideloadly/codesign)
- جهاز iPad 7 الفعلي: غير متاح للفريق — ما هو مثبت: بناء arm64 نظيف + MIN_OS 16.4 + لا مكتبات محاكي
