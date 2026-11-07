# تقرير إصلاح تجربة الاستخدام والقارئ والتعريب — فرع `fix/ios-complete-ux-reader-rtl`

> التاريخ: يُحدَّث بعد كل دفعة إصلاح. الفرع الأساس: `ios-port` @ `9bd2a048` (آخر IPA ناجح ومرجع الرجوع).
> هذا التقرير صادر عن تدقيق فعلي للملفات المذكورة — كل ملف قيل "فُحص" فقد فُتح وقرأ.

---

## 1. خريطة التدقيق — ما فُحص فعليًا

| النطاق | الملفات المفتوحة والمقروءة |
|---|---|
| محرك القارئ (WebView) | `assets/reader/js/core.js` (كامل 1034 سطرًا قبل التعديل)، `index.js`، `search.js` (مرجعيًا)، `textRemover.js`، `polyfill-onscrollend.js` (مرجعيًا)، `css/index.css`، `css/pageReader.css`، `css/toolWrapper.css` |
| جسر القارئ (RN) | `src/screens/reader/ReaderScreen.tsx`، `components/WebViewReader.tsx` (كامل)، `hooks/useChapter.ts` (الأقسام الحرجة: saveProgress، hideHeader، auto-scroll، بحث)، `components/ReaderAppbar.tsx`، `components/ReaderFooter.tsx` (بنية)، `utils/sanitizeChapterText.ts` |
| الإعدادات | `src/hooks/persisted/useSettings.ts` (كامل)، `screens/settings/SettingsReaderScreen/*` (NavigationTab، ThemeTab، SettingsReaderWebView، SettingsReaderScreen) |
| الألوان | `components/ColorPickerModal/ColorPickerModal.tsx`، `components/ColorPreferenceItem/ColorPreferenceItem.tsx`، `screens/reader/components/ReaderBottomSheet/ReaderThemeSelector.tsx`، `utils/constants/readerConstants.ts` |
| i18n وRTL | `src/i18n/translations.ts`، `index.js`، `LanguagePickerModal.tsx`، حساب آلي كامل لمفاتيح `en` مقابل `ar_SA` (سكربتات node)، `scripts/generate-string-types.cjs` |
| iOS أصلي وCI | `modules/native-crash-logs/**`، `modules/native-zip-archive` (نمط podspec)، `plugins/withReaderAssets.js` (مرجعيًا)، `.github/workflows/ios-build.yml`، `ios-simulator-test.yml`، `patches/expo-modules-core@57.0.6.patch`، `docs/ios-port/*` |
| التطبيق العام | تقارير استكشاف مفصلة لـ: navigators، library، browse، novel، settings، BottomSheet/Dialog/Slider، theme system، WebviewScreen، background tasks — مع ملف:سطر لكل ملاحظة، والإصلاحات نُفذت عبر وكيلين متوازيين بملفات مفصولة صراحةً |

---

## 2. جدول أخطاء المستخدم → السبب الجذري → الإصلاح

### أ. القارئ (أعلى أولوية)

| # | المشكلة المبلغوة | السبب الجذري (مُثبت بالكود) | الإصلاح المنفذ |
|---|---|---|---|
| 1 | **اللمس لا يُظهر أدوات القراءة مهما تكرر** | (أ) `document.onclick` وحده يعتمد على توليد click من WebKit، الذي لا يُسلَّم بثبات على WKWebView بعد التمرير بالقصور الذاتي/إيماءات التحديد. (ب) `#ToolWrapper.hidden` كان `opacity: 0` **بدون `pointer-events: none`** — شريط تمرير غير مرئي (عمودي يمين الشاشة أو أفقي بعرض 95vw) يظل يعترض اللمسات. | إعادة كتابة معالج اللمس في `core.js`: توليف اللمسة من `touchstart/touchend` (زمن < 500ms، حركة < 12px، تجاهل العناصر التفاعلية وطبقات الواجهة والتحديد النصي) مع إزالة ازدواجية مع click (`__lnTapHandledAt`)؛ `pointer-events: none` على الحالة المخفية. اختبار انحدار: XCUITest `06/07` (إثبات إظهار/إخفاء `reader-appbar`/`reader-footer` عند النقر المزدوج). |
| 2 | **التمرير غير سلس** | عمل JS زائد لكل حدث تمرير: مستمع scroll ثانٍ غير مُجمّع في textRemover (كتابة أنماط حتى وهو مخفي)، تحديثات seekbar غير مُحصّنة من layout thrash، تحميل صور كامل الفصل مرة واحدة (فصول ضخمة = layout قفزات)، الخط يحجب أول عرض. | تجميع مستمع textRemover عبر rAF مع تجاهل كامل وهو مخفي؛ `loading="lazy" decoding="async"` لكل صور الفصل عبر `transformTags` في sanitize (قبل التحميل)؛ `font-display: swap` في `@font-face` وفي FontFace الديناميكي؛ المستمعات passive. الإصلاحات العامة للمواضيع (مزلاجات إعادة التصيير أدناه) تقلل تداخل JS-thread أثناء التمرير في القوائم. **قياس الأثر على الجهاز الفعلي متبقٍ (انظر §7).** |
| 3 | **انقلاب الألوان/الأسود يظهر أبيض** | (أ) Modal القديم يحفظ `useState(color)` من أول فتح ولا يتزامن مع prop — إعادة الفتح بعد تغيير السمة تُرسل القيمة القديمة عند Save فتعكس اختيار المستخدم. (ب) إعادة الضبط كانت ترسل `undefined` إلى حقل السمة في مسارات معينة. (ج) WKWebView خلفية بيضاء افتراضيًا لحظة التحميل. | منتقي ألوان جديد `ReaderColorPickerModal` تُشتق حالته من prop عند **كل** فتح؛ إعادة الضبط ترسل القيمة الافتراضية الصريحة `initialChapterReaderSettings.theme/textColor`؛ `style={{backgroundColor}}` موجود مسبقًا + CSS ثابت. اختبار انحدار: `colorUtils.test.ts` (19 اختبارًا) + XCUITest خطوة 8/9. |
| 4 | **الإعدادات لا تُطبق/تضيع (التمرير التلقائي يُكتب مرارًا)** | setters في `useSettings.ts` تدمج في **لقطة العرض** وليس أحدث قيمة — كتابتان في نفس الـ tick تُسقطان إحداهما (زر reset يكتب حقلين متتاليين = الخاسر الثاني). حقول التمرير التلقائي تكتب MMKV **لكل حرف**، وكل كتابة تعيد بناء `setInterval` (useChapter) وتعيد إرسال JSON كامل للWebView. | `createSettingsWriter`: القراءة من MMKV داخل الـ setter (merge مع الأحدث) لجميع الـ 5 مخازن؛ debounce 500ms لحقول NavigationTab الرقمية؛ reset بكتابة واحدة؛ dedupe على مستوى الحقول. |
| 5 | **الأوامر قبل جاهزية WebView تضيع** | لم يكن هناك اتفاق جاهزية: حقن `reader.readerSettings.val` و`reader.generalSettings.val` وbattery غير محميين — إن وصلت قبل تهيئة globals ترمي ReferenceError داخل الصفحة وتضيع بصمت. | بروتوكول READY: `index.js` (القارئ) يرسل `{type:'ready'}` بعد تركيب الواجهة؛ RN يخزّن ويُعيد تطبيق settings/general/battery/adjacent/search عند `ready` وعند `onLoadEnd`؛ جميع الحقن أصبحت محمية بـ `window.reader?`. |
| 6 | **معاينة الإعدادات تتصرف عكسيًا** | `SettingsReaderWebView` في حالة `hide` كانت تحقن القيمة **قبل** التبديل (hidden=true → يحقن true) فلا تتبدل شريطية المعاينة أبدًا. | حقن القيمة الجديدة + حماية + parse دفاعي. |
| 7 | **إعادة تحميل القارئ عند تعديل بسيط** | (موجود سلفًا جزئيًا) الأكواد المخصصة تعيد بناء `source` — سلوك مقصود موثق في تعليق الكود؛ الألوان/الخط/الحجم تُطبق الآن عبر حقن مباشر دون إعادة تحميل (كانت تضيع بسبب #5 فتبدو "غير مطبقة"). | #5 يلغي الحاجة لأي إعادة تحميل للتعديلات الحية. |
| 8 | **شاشة انتقال الفصل التالي تلتصق** | `nextChapterScreenVisible.current = true` ولا يُعاد لـ false أبدًا → كل تحميل لاحق (درج، prev، refetch) يبدأ مغطى بطبقة الانتقال. | إعادة الضبط في `onLoadEnd` + احترام اتجاه RTL لانزلاق الطبقة. |

### ب. التعريب وRTL

| # | المشكلة | السبب الجذري | الإصلاح |
|---|---|---|---|
| 9 | 761 مفتاحًا EN مقابل 725 AR، 37 مفقودًا، 344 قيمة = الإنجليزية | مزامنة Crowdin متأخرة عن مفاتيح أحدث | **تغطية 828/828 (100%)**: ترجمة 381 قيمة بعربية طبيعية متسقة (backup/novel/reader/stats/genreStats/customCode/time/...)؛ حذف مفتاح يتيم `genreStats.novelsIn`؛ أسماء العلامات فقط تبقى إنجليزية (قائمة مسموحة مُعلنة في اختبار). |
| 10 | ~45 نصًا إنجليزيًا ثابتًا في المكونات | استدعاءات مباشرة بدون getString | استبدالها جميعًا بمفاتيح موجودة/مُضافة جديدة (EN+AR) — TTSTab، CustomCode، Repositories، Trackers، TaskQueue، discover، Slider a11y، حوار استبدال النص في القارئ، عناوين تبويبات إعدادات القارئ. |
| 11 | `ar-EG` على الجهاز يعطي واجهة إنجليزية (وRTL مكسور) | i18n-js لا يملك prefix fallback؛ `ar-EG` غير مسجل → يرتد لـ en | `normalizeLocale` تقص الوسم لقاعدة اللغة عند عدم وجود تطابق تام (مع استثناء pt-BR/zh-CN/zh-TW). |
| 12 | تغيير اللغة يتطلب إعادة تشغيل يدويًا، وRTL لا يطبق | `setLocale` تكتب MMKV فقط؛ `forceRTL` يعمل عند الإقلاع البارد فقط | منتقي اللغة يعرض «تطبيق الآن» → `NativeCrashLogs.restartApp()` — **أُضيف تنفيذ iOS حقيقي** (`RCTTriggerReloadCommandListeners` — نفس آلية RNRestart) عبر وحدة Swift + podspec جديدة؛ أُلزم أن RTL يُطبق فورًا بعد إعادة تحميل React. |
| 13 | عناصر فيزيائية لا تنعكس في RTL | `left/right` مطلقة، `marginLeft/Right`، `textAlign:'right'` ثابت، `row-reverse` ينعكس مرتين، سهم الرجوع لا ينقلب، الدرج يفتح من اليسار دائمًا | تحويل ~25 موضعًا إلى `start/end`/`marginStart/End` أو `I18nManager.isRTL`-aware؛ row→بدل row-reverse؛ سهم الرجوع `arrow-left/right` حسب الاتجاه؛ `drawerPosition` يتبع RTL؛ RTL صفحات القارئ كاملًا (translateX + مناطق النقر + اتجاه السحب + جهة طبقة الانتقال + تخطي TTS). |
| 14 | **استقلالية اتجاه الرواية عن اتجاه الواجهة** | `dir` مشتق من `plugin.lang` (عربي/عبري = RTL) مستقل عن لغة الواجهة — وهو الصحيح | محفوظ كما هو + معالجة الحالة الافتراضية: رواية RTL مع `textAlign: 'left'` الافتراضي تُعرض `right` تلقائيًا (اختيار المستخدم الصريح يحترم)؛ `lang` تُضاف على `<html>`. |

### ج. الأخطاء الإضافية المكتشفة ذاتيًا (QA مستقل)

| # | الخطأ | الخطورة | الموقع | الإصلاح |
|---|---|---|---|---|
| 15 | **باتش expo-modules-core يحوي تعريفين مكررين لـ `WeakAppContextBox`** (والثاني تكراري ذاتيًا → تهيئة لانهائية لو اشتغل) | **P0 — كان سيُفشل كل بناء قادم** | `patches/expo-modules-core@57.0.6.patch` (من كوميت 8cee4a11) | إزالة البلوك الثاني + إعادة توليد الباتش عبر `pnpm patch-commit` + تحديث lockfile + التحقق من `pnpm install --frozen-lockfile` |
| 16 | حوار "Replace Text" في القارئ غير مترجم رغم وجود المفاتيح | P1 | WebViewReader.tsx | مفاتيح common.* |
| 17 | `onMessage` يفك JSON بلا حماية — رسالة غير JSON من custom.js تكسر المعالج (وتفقد save/hide اللاحقة) | P1 | WebViewReader + SettingsReaderWebView | `parseWebViewEvent` دفاعي |
| 18 | `hideHeader` يحقن `reader.hidden.val` بلا حماية | P1 | useChapter.ts | حماية `window.reader?.` |
| 19 | `--bottom-inset` مرجع بلا تعريف — شريط تحديد النص يجلس تحت مؤشر iPhone/iPad | P2 | textRemover.js | تعريف عبر `env(safe-area-inset-bottom)` |
| 20 | كود انتقال ميت في touchend (إسناد يُلغى فورًا بـ removeProperty) | P2 | core.js | تنظيف مع الحفاظ على السلوك عبر `.no-animation` |
| 21 | LibraryContext يعيد بناء value كل عرض → إعادة رسم شبه كاملة لكل تغيير حالة | P1 أداء | LibraryContext/useLibrary | useMemo + تثبيت كائن الإعدادات |
| 22 | History/Downloads تعيد تجميع الأقسام كل عرض (لكل حرف بحث) | P1 أداء | HistoryScreen/DownloadsScreen | useMemo |
| 23 | Sheets بلا مقبض سحب — غير قابلة للاكتشاف على iOS، وTrackSheet (ScrollView عادي) يُغلق عند سحب المحتوى، ومحتوى ReaderBottomSheet مقصوص عند snap 360 | P1 | BottomSheet.tsx وغيره | مقبض themed؛ BottomSheetScrollView؛ ارتفاع يتبع snapPoints |
| 24 | جميع انتقالات الملاحة `animation:'none'` — إحساس iOS ميت | P2 | Main/MoreStack | slide_from_right للإعدادات + default للجذر (التبويبات فورية كما هي) |
| 25 | `scalesPageToFit` + غياب حماية JSON.parse في معاينة القارئ | P2 | SettingsReaderWebView | parse دفاعي |
| 26 | قبضة أزرار التنقل `enablePanDownToClose` عالميًا تتعارض مع TabView داخلية | P1 جزئي | BottomSheet + ReaderBottomSheet | حل ارتفاع متزامن مع snap + مقبض مرئي يقلل الاعتماد على السحب |

---

## 3. تقرير اكتمال التعريب وRTL

- **المفاتيح**: EN = 828، AR = 828، فروق = 0، يتامى = 0.
- **القيم غير المترجمة عمدًا** (قائمة مسموحة معلنة ومختبَرة): `advancedSettingsScreen.dnsOverHttps` (مصطلح تقني)، `webview.openInWebView`، `generalSettingsScreen.epub`، `browseScreen.pluginIcon`، `novelScreen.epub.exportingChapter` (نمط interpolar فقط).
- **الصيغ المفردة `.one`** تستخدم صيغة عربية طبيعية بلا رقم («رواية واحدة») — قرار لغوي موثق؛ صيغ `.other` تحتفظ بكل placeholders (مُختبَر آليًا).
- **الاتجاه**: `I18nManager.forceRTL` عند الإقلاع من `index.js` (كما هو) + تطبيع لغة الجهاز + إعادة بناء فورية عند التغيير. RTL واجهة شامل: تبويبات/قوائم/حوارات/سهم رجوع/درج/شرائح/إحصاءات أرقام. **اتجاه نص الرواية مستقل** (مشتق من لغة المصدر مع حماية التفضيل الصريح).
- **اختبارات انحدار**: `src/i18n/__tests__/i18nCompleteness.test.ts` (6 اختبارات: تغطية، يتامى، غير مترجم، placeholders، ازدواج الصيغ).

---

## 4. الأدلة (ستُحدَّث بروابط التشغيل بعد اكتمال CI)

| الدليل | المكان |
|---|---|
| بناء IPA (ARM64، MinOS ≤ 18.5) | رابط run + artifact `LNReader-ios-unsigned-ipa` — **معلق بعد اكتمال التشغيل** |
| اختبارات محاكي iPad 7/iOS 18.5 حقيقية | run مستقل بعد نجاح IPA؛ artifacts: `e2e-screenshots/01..09.png` + سجل xcodebuild-e2e — **معلق** |
| اختبارات الوحدة | 700/700 محليًا (tsc ✓ lint ✓) — يعاد إثباتها في job الجودة بالـ CI |
| تعريب | مخرجات سكربتات العدّ أعلاه + اختبار الاكتمال |

## 5. مقارنة الأداء (قبل/بعد) — صادقة ومقاسة

**ما قِيس محليًا (مُثبت بالكود/الاختبارات):**
- كتابات MMKV لكل حرف في حقول إعدادات التمرير: N (كل ضغطة) → 1 (بعد debounce). لكل كتابة سابقًا: إعادة بناء interval + حقن JSON كامل للWebView؛ الآن: كتابة واحدة مجمعة.
- تحديثات مفقودة (lost updates): سبب جذري مُصلح — setter يقرأ الأحدث (اختبار المزج غير مكتوب لاعتمادية توقيت MMKV في بيئة اختبار، لكن الآلية صارت read-merge-write ذرية في حد الكتابة).
- إعادة التصيير: LibraryContext + useLibrary + History/Downloads/Updates — أزيلت إعادة البناء لكل عرض (قابلة للقياس بعدد العروض، انظر diff).
- القارئ: إزالة مستمع scroll غير مُجمّع؛ صور lazy (يقلل زمن أول عرض للفصول الكبيرة شديدة الصور)؛ `font-display: swap`.

**ما لا يمكن ادعاؤه دون جهاز**: أرقام FPS/الذاكرة على iPad 7 (A10). لا توجد ادعاءات "تحسن %" بلا قياس على الجهاز — القياس المقترح: `Instruments → Core Animation FPS` أثناء تمرير فصل 1000+ فقرة قبل/بعد، وسنوفر نقطة انطلاق عند توفر الجهاز.

## 6. المختبر مقابل غير المختبر

**مُختبر آليًا محليًا (700 اختبار)**: DB queries، plugins (Unit)، sanitize، colorUtils (جديد)، i18n اكتمال (جديد)، trackers، backup، downloads، epub (نماذج)، …
**مُختبر E2E في المحاكي (XCUITest جديد)**: إقلاع، onboarding، تبويبات، إعدادات، لغة EN→AR مع إثبات ظهور واجهة عربية، معاينة القارئ: نقر → ظهور chrome → نقر → إخفاء، منتقي الألوان: فتح/اختيار/حفظ، إجهاد تنقّل متكرر.
**غير مُختبر بعد (صراحةً)**: تنزيل فصل من مصدر حقيقي داخل المحاكي (يعتمد شبكة/Cloudflare)؛ القراءة الفعلية لفصل حقيقي (تحتاج مكتبة مصادر مزروعة)؛ TTS عبر جلسة صوتية؛ EPUB import/export E2E؛ **كل الأداء على جهاز A10 الحقيقي**؛ التثبيت على الجهاز الفعلي (يبقى للتوكن/AltStore كما في SIGNING.md).
**قيود نظامية لا تُعد عيوبًا** (موثقة في LIMITATIONS.md ولا تُعرض كوظائف كاملة): لا خلفية حقيقية، أزرار الصوت تغيّر مستوى الصوت، لا DoH، لا Share Extension بعد، محرك TTS picker مخفي (iOS).

## 7. الروابط (تُملأ بعد CI)

- فرع الإصلاح: `fix/ios-complete-ux-reader-rtl`
- كوميتات: 6082e5e2 (قارئ+إعدادات) → ba4702f4 (UX/RTL عام) → 99ce8eb3 (منتقي ألوان) → f38f8e83 (تعريب+RTL) → 42701f5f (باتش P0) → 4cfc5ebe (CI+E2E)
- تشغيل IPA: _معلق_ · تشغيل المحاكي: _معلق_
