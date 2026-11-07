/**
 * One-off: completes the Arabic (ar_SA) localization.
 * - Translates every key whose Arabic value was still identical to English.
 * - Adds the 37 keys that were missing from Arabic entirely.
 * - Removes the orphan key `genreStats.novelsIn`.
 * Re-run safe: only fills values that are still identical to English or absent.
 */
const fs = require('fs');
const path = require('path');

const T = {
  'aboutScreen.plugins': 'الإضافات',
  'advancedSettingsScreen.diagnostics': 'التشخيص',
  'advancedSettingsScreen.disabled': 'معطَّل',
  'advancedSettingsScreen.dnsOverHttps': '‏DNS عبر HTTPS (DoH)',
  'advancedSettingsScreen.dnsOverHttpsDescription':
    'يستخدم المُحلِّل المحدد لطلبات التطبيق والتنزيلات. لا يتأثر اتصال WebView.',
  'advancedSettingsScreen.importFailed': 'خطأ في استيراد EPUB:',
  'advancedSettingsScreen.networking': 'الشبكة',
  'advancedSettingsScreen.useFAB': 'استخدام زر عائم بدل الزر العادي',
  'advancedSettingsScreen.restartRequired':
    'أعد تشغيل LNReader لتطبيق هذا التغيير.',
  'advancedSettingsScreen.shareCrashLogs': 'مشاركة سجلات الأعطال',
  'advancedSettingsScreen.shareCrashLogsDescription':
    'إنشاء تقرير تشخيصي يتضمن معلومات التطبيق والجهاز والإضافات والاستثناء والسجلات المتاحة للتطبيق.',
  'advancedSettingsScreen.shareCrashLogsFailed': 'تعذّر إنشاء سجلات الأعطال.',
  'appearanceScreen.dateFormat': 'تنسيق التاريخ',
  'appearanceScreen.dateFormatDefault': 'الافتراضي (%{date})',
  'appearanceScreen.dynamicColors': 'ديناميكي',
  'appearanceScreen.relativeTimestamps': 'أزمنة نسبية',
  'appearanceScreen.relativeTimestampsDescription':
    '"اليوم" بدلًا من "%{date}"',
  'backupScreen.automaticBackupFrequency': 'تكرار النسخ الاحتياطي التلقائي',
  'backupScreen.automaticBackupDescription':
    'تعمل النسخ الاحتياطية في الخلفية وتُخزَّن محليًا. قد يؤخر النظام العمل في الخلفية لتوفير الطاقة.',
  'backupScreen.automaticBackupOff': 'معطَّل',
  'backupScreen.automaticBackupEvery6Hours': 'كل ٦ ساعات',
  'backupScreen.automaticBackupEvery12Hours': 'كل ١٢ ساعة',
  'backupScreen.automaticBackupDaily': 'يوميًا',
  'backupScreen.automaticBackupEvery2Days': 'كل يومين',
  'backupScreen.automaticBackupWeekly': 'أسبوعيًا',
  'backupScreen.automaticBackupLocation': 'موقع النسخ الاحتياطي التلقائي',
  'backupScreen.lastAutomaticBackup': 'آخر نسخ احتياطي تلقائي: %{time}',
  'backupScreen.backupCreated': 'أُنشئ النسخ الاحتياطي بنجاح',
  'backupScreen.backupCreatedWithWarnings':
    'أُنشئ النسخ الاحتياطي مع تحذيرات: %{warnings}',
  'backupScreen.backupRestored': 'استُعيد النسخ الاحتياطي بنجاح',
  'backupScreen.backupRestoredSelectedWithWarnings':
    'استُعيد النسخ الاحتياطي مع تحذيرات: %{warnings}',
  'backupScreen.backupRestoredSummary.one': 'استُعادة رواية واحدة',
  'backupScreen.backupRestoredSummary.other': 'استُعيدت %{count} روايات',
  'backupScreen.backupRestoredWithWarnings.one':
    'استُعادة رواية واحدة مع تحذيرات: %{warnings}',
  'backupScreen.backupRestoredWithWarnings.other':
    'استُعيدت %{count} روايات مع تحذيرات: %{warnings}',
  'backupScreen.savingBackup': 'جارٍ حفظ النسخة الاحتياطية',
  'backupScreen.categoriesRestored': 'استُعيدت %{count} تصنيفات',
  'backupScreen.categoriesRestoredWithErrors':
    'استُعيدت %{count} تصنيفات (%{failedCount} فشلت)',
  'backupScreen.categoriesRestoreFailedSummary.one': 'فشل استعادة تصنيف واحد',
  'backupScreen.categoriesRestoreFailedSummary.other':
    'فشل استعادة %{count} تصنيفات',
  'backupScreen.categoryRestoreFailed':
    'فشل استعادة التصنيف: %{categoryName} - %{error}',
  'backupScreen.categoryFileNotFound': 'ملف التصنيفات غير موجود في النسخة',
  'backupScreen.categoryFileReadFailed': 'فشل قراءة ملف التصنيفات: %{error}',
  'backupScreen.categoryFileWriteFailed': 'فشل كتابة ملف التصنيفات: %{error}',
  'backupScreen.createBackupDesc': 'يمكن استخدامه لاستعادة المكتبة الحالية',
  'backupScreen.downloadingData': 'جارٍ تنزيل البيانات',
  'backupScreen.downloadingDownloadedFiles': 'جارٍ تنزيل الملفات المنزّلة',
  'backupScreen.failed': 'فشل النسخ الاحتياطي',
  'backupScreen.novelsRestored': 'استُعيدت %{count} روايات',
  'backupScreen.novelsRestoredWithErrors':
    'استُعيدت %{count} روايات (%{failedCount} فشلت)',
  'backupScreen.novelsBackupFailedSummary.one': 'فشل نسخ رواية واحدة',
  'backupScreen.novelsBackupFailedSummary.other': 'فشل نسخ %{count} روايات',
  'backupScreen.novelsRestoreFailedSummary.one': 'فشل استعادة رواية واحدة',
  'backupScreen.novelsRestoreFailedSummary.other':
    'فشل استعادة %{count} روايات',
  'backupScreen.novelBackupFailed': 'فشل نسخ الرواية: %{novelName} - %{error}',
  'backupScreen.novelRestoreFailed':
    'فشل استعادة الرواية: %{novelName} - %{error}',
  'backupScreen.novelDirectoryNotFound': 'مجلد الرواية غير موجود في النسخة',
  'backupScreen.novelDirectoryReadFailed': 'فشل قراءة مجلد الرواية: %{error}',
  'backupScreen.restoringCategories': 'جارٍ استعادة التصنيفات',
  'backupScreen.restoringCategoriesProgress':
    'جارٍ استعادة التصنيفات (%{current}/%{total})',
  'backupScreen.restoringNovels': 'جارٍ استعادة الروايات',
  'backupScreen.restoringNovelsProgress':
    'جارٍ استعادة الروايات (%{current}/%{total})',
  'backupScreen.restoringSettings': 'جارٍ استعادة الإعدادات',
  'backupScreen.missingPluginsAfterRestore': 'إضافات مفقودة: %{plugins}',
  'backupScreen.sectionsRestoreFailedSummary.one':
    'فشل استعادة قسم واحد من النسخة',
  'backupScreen.sectionsRestoreFailedSummary.other':
    'فشل استعادة %{count} أقسام من النسخة',
  'backupScreen.sectionsBackupFailedSummary.one': 'فشل نسخ قسم واحد',
  'backupScreen.sectionsBackupFailedSummary.other': 'فشل نسخ %{count} أقسام',
  'backupScreen.settingsRestored': 'استُعيدت الإعدادات',
  'backupScreen.settingsRestoreFailedSummary': 'فشل استعادة الإعدادات',
  'backupScreen.options.title': 'محتويات النسخة الاحتياطية',
  'backupScreen.options.description': 'اختر ما سيُضمَّن في هذه النسخة.',
  'backupScreen.options.selectAll': 'تحديد الكل',
  'backupScreen.options.library': 'بيانات المكتبة',
  'backupScreen.options.libraryDescription':
    'الروايات والأغلفة وقوائم الفصول وتقدم القراءة والعلامات المرجعية والتصنيفات.',
  'backupScreen.options.settings': 'الإعدادات',
  'backupScreen.options.settingsDescription':
    'تفضيلات التطبيق والقارئ والتحديثات.',
  'backupScreen.options.plugins': 'الإضافات',
  'backupScreen.options.pluginsDescription': 'ملفات إضافات المصادر المثبتة.',
  'backupScreen.options.downloadedFiles': 'الفصول المنزّلة',
  'backupScreen.options.downloadedFilesDescription':
    'محتوى الفصول المنزّلة للقراءة دون اتصال. قد يستهلك مساحة كبيرة.',
  'backupScreen.preparingSelectedFiles': 'جارٍ تجهيز الملفات المحددة',
  'backupScreen.restoringSelectedFiles': 'جارٍ استعادة الملفات المحددة',
  'backupScreen.uploadingSelectedFiles': 'جارٍ رفع الملفات المحددة',
  'browseScreen.editPluginSetting': 'تعديل %{name}',
  'browseScreen.installPlugin': 'تثبيت %{name}',
  'browseScreen.language': 'اللغة',
  'browseScreen.migration.cover': 'الغلاف',
  'browseScreen.migration.dialogMessage': 'ترحيل %{url}؟',
  'browseScreen.migration.keepCurrent': 'إبقاء الحالي',
  'browseScreen.migration.metadata': 'تفاصيل الرواية',
  'browseScreen.migration.novelAlreadyInLibrary':
    'الرواية موجودة في المكتبة بالفعل',
  'browseScreen.migration.preservedState':
    'ستُحفظ التصنيفات وتقدم القراءة المطابق والعلامات المرجعية وإعدادات القارئ.',
  'browseScreen.migration.redownloadChapters':
    'إعادة تنزيل الفصول المنزّلة المطابقة',
  'browseScreen.migration.reviewDescription':
    'اختر ما تريد إبقاءه عند الترحيل إلى %{name}.',
  'browseScreen.migration.reviewTitle': 'مراجعة الترحيل',
  'browseScreen.migration.selectSource': 'اختر المصدر',
  'browseScreen.migration.selectSourceDesc': 'اختر مصدرًا للترحيل منه',
  'browseScreen.migration.useDestination': 'استخدام المصدر الهدف',
  'browseScreen.noSource':
    'لا تملك أي روايات من هذا المصدر في مكتبتك',
  'browseScreen.noPlugins':
    'لا توجد إضافات. أضف مستودعًا أو فعِّل لغات أخرى في إعدادات التصفح.',
  'browseScreen.noSearchResults': 'لا توجد نتائج مطابقة',
  'browseScreen.noSources':
    'لا توجد مصادر مثبتة. ثبّت إضافة لبدء تصفح الروايات.',
  'browseScreen.openPluginDetails': 'فتح تفاصيل %{name}',
  'browseScreen.openPluginSettings': 'فتح إعدادات %{name}',
  'browseScreen.openWebsite': 'فتح موقع %{name}',
  'browseScreen.pinSource': 'تثبيت %{name}',
  'browseScreen.pluginDetails': 'تفاصيل الإضافة',
  'browseScreen.pluginIcon': 'أيقونة الإضافة',
  'browseScreen.pluginNotInstalled': 'هذه الإضافة غير مثبتة',
  'browseScreen.plugins': 'الإضافات',
  'browseScreen.repositories': 'المستودعات',
  'browseScreen.sources': 'المصادر',
  'browseScreen.togglePluginSetting': 'تبديل %{name}',
  'browseScreen.uninstall': 'إزالة التثبيت',
  'browseScreen.unpinSource': 'إلغاء تثبيت %{name}',
  'browseScreen.updatePlugin': 'تحديث %{name}',
  'browseScreen.updateAll': 'تحديث الكل',
  'browseScreen.updatesPending': 'تحديثات في الانتظار',
  'categories.alwaysAsk': 'السؤال دائمًا',
  'repositories.disable': 'تعطيل',
  'repositories.disableTitle': 'تعطيل المستودع؟',
  'repositories.disableWarning':
    'سيتوقف LNReader عن فحص %{name}. ستُخفى إضافاته ما لم يوفرها مستودع آخر مفعَّل. ستظل الإضافات المثبتة مثبتة.',
  'repositories.toggle': 'تبديل مستودع %{name}',
  'common.back': 'رجوع',
  'common.imported': 'تم الاستيراد',
  'common.later': 'لاحقًا',
  'common.none': 'بلا',
  'common.close': 'إغلاق',
  'common.pause': 'إيقاف مؤقت',
  'common.preparing': 'جارٍ التجهيز',
  'common.remove': 'إزالة',
  'common.restore': 'استعادة',
  'common.resume': 'استئناف',
  'common.saved': 'تم الحفظ',
  'common.skipVersion': 'تخطي هذا الإصدار',
  'common.moreOptions': 'خيارات إضافية',
  'common.code': 'الشيفرة',
  'common.custom_code': 'الأكواد المخصصة',
  'common.textToReplace': 'النص المراد استبداله',
  'common.replaceWith': 'الاستبدال بـ',
  'common.replaceText': 'استبدال النص',
  'webview.openInWebView': 'فتح في WebView',
  'downloadScreen.storageInfo':
    'تُخزَّن الفصول المنزّلة في مساحة التطبيق الخاصة على هذا الجهاز.',
  'taskQueue.cancelTaskAction': 'إلغاء المهمة',
  'taskQueue.cancelTaskTitle': 'إلغاء المهمة؟',
  'taskQueue.cancelTaskConfirmation': 'هل تريد حقًا إلغاء %{task}؟',
  'taskQueue.keepTaskAction': 'إبقاء المهمة',
  'errorBoundary.title': 'حدث خطأ غير متوقع',
  'errorBoundary.description':
    'واجه التطبيق خطأً غير متوقع. يرجى مشاركة سجلات الأعطال في قناة الدعم على Discord.',
  'errorBoundary.copyStackTrace': 'نسخ تتبع المكدس',
  'errorBoundary.shareCrashLogs': 'مشاركة سجلات الأعطال',
  'errorBoundary.shareCrashLogsFailed':
    'تعذّرت مشاركة سجلات الأعطال. نُسخ تتبع المكدس بدلًا منها.',
  'errorBoundary.shareCrashLogsFailedWithoutCopy':
    'تعذّرت مشاركة سجلات الأعطال أو نسخ تتبع المكدس.',
  'errorBoundary.restart': 'إعادة تشغيل التطبيق',
  'generalSettingsScreen.automaticUpdates': 'التحديثات التلقائية',
  'generalSettingsScreen.automaticUpdatesDaily': 'يوميًا',
  'generalSettingsScreen.automaticUpdatesDescription':
    'تعمل عند توفر اتصال شبكة. قد يؤخر النظام العمل في الخلفية لتوفير الطاقة.',
  'generalSettingsScreen.automaticUpdatesEvery12Hours': 'كل ١٢ ساعة',
  'generalSettingsScreen.automaticUpdatesEvery2Days': 'كل يومين',
  'generalSettingsScreen.automaticUpdatesEvery3Days': 'كل ٣ أيام',
  'generalSettingsScreen.automaticUpdatesOff': 'معطَّل',
  'generalSettingsScreen.automaticUpdatesWeekly': 'أسبوعيًا',
  'generalSettingsScreen.chapterDownloadCooldown': 'الفاصل بين تنزيل الفصول',
  'generalSettingsScreen.chapterDownloadCooldownDesc':
    'الانتظار بين تنزيلات الفصول المتتالية (بالثواني). يساعد على تجنب حدود المصادر أثناء التنزيل الجماعي.',
  'generalSettingsScreen.chapterDownloadCooldownPlaceholder':
    'الفاصل بالثواني (مثال: 1.5)',
  'generalSettingsScreen.chapterDownloadCooldownWarning':
    'قد تؤدي الفواصل المنخفضة جدًا إلى تقييد المعدل أو حظر مؤقت لعنوان IP من المصادر.',
  'generalSettingsScreen.epub': '‏EPUB',
  'generalSettingsScreen.globalUpdateCategories': 'التصنيفات',
  'generalSettingsScreen.globalUpdateCategoriesDescription':
    'لن تُحدَّث الروايات في التصنيفات المستثناة حتى لو كانت ضمن تصنيف مشمول أيضًا. انقر تصنيفًا للتبديل بين مشمول ومستثنى ومحايد.',
  'generalSettingsScreen.globalUpdateExclude': 'استثناء: %{categories}',
  'generalSettingsScreen.globalUpdateInclude': 'تضمين: %{categories}',
  'generalSettingsScreen.smartUpdate': 'التحديث الذكي',
  'generalSettingsScreen.smartUpdateSkipCompleted':
    'تخطي العناصر ذات الحالة "أكملته"',
  'generalSettingsScreen.smartUpdateSkipUnstarted': 'تخطي العناصر غير المبدوءة',
  'generalSettingsScreen.smartUpdateSkipWithUnread':
    'تخطي العناصر ذات فصول غير مقروءة',
  'generalSettingsScreen.timeTracking': 'تتبع وقت القراءة',
  'generalSettingsScreen.enableTimeTracking': 'تفعيل تتبع وقت القراءة',
  'generalSettingsScreen.enableTimeTrackingDesc':
    'يتتبع الوقت المستغرق في القراءة ويعرضه في شاشة الإحصاءات',
  'generalSettingsScreen.inactivityTimeout': 'مهلة عدم النشاط',
  'generalSettingsScreen.inactivityTimeoutNever': 'أبدًا',
  'generalSettingsScreen.inactivityTimeoutDesc':
    'إيقاف تتبع الوقت تلقائيًا بعد فترة من عدم النشاط',
  'globalSearch.openNovel': 'فتح الرواية',
  'globalSearch.openCopiedNovel': 'فتح الرواية المنسوخة',
  'globalSearch.noSourceForUrl': 'لا يوجد مصدر لهذا الرابط',
  'historyScreen.removeHistoryWarning':
    'سيُزال هذا تاريخ قراءة الفصل. هل أنت متأكد؟',
  'historyScreen.resetAllChapters': 'إعادة تعيين كل الفصول لهذا العنصر',
  'libraryScreen.bottomSheet.display.download': 'التنزيل',
  'libraryScreen.bottomSheet.display.numberOfItems': 'عدد العناصر',
  'libraryScreen.emptyCategory': 'هذا التصنيف فارغ.',
  'novelScreen.bottomSheet.filters.scanlators': 'تجاهل فرق الترجمة',
  'novelScreen.chapterChapnum': 'الفصل %{num}',
  'novelScreen.exportEpubModal.applyReaderTheme':
    'تطبيق سمة القارئ على ملف EPUB',
  'novelScreen.exportEpubModal.customJSWarning':
    'قد لا تدعم جميع قارئات EPUB شيفرات JavaScript المخصصة',
  'novelScreen.exportEpubModal.description':
    'اختر الوجهة والفصول المنزّلة التي تريد تضمينها في ملف EPUB.',
  'novelScreen.exportEpubModal.directory': 'المجلد',
  'novelScreen.exportEpubModal.endChapter': 'الفصل الأخير',
  'novelScreen.exportEpubModal.export': 'تصدير',
  'novelScreen.exportEpubModal.exportAll': 'تصدير كل الفصول',
  'novelScreen.exportEpubModal.fileName': 'اسم الملف',
  'novelScreen.exportEpubModal.fileNameRequired': 'أدخل اسم ملف',
  'novelScreen.exportEpubModal.includeCustomCSS': 'تضمين CSS المخصص',
  'novelScreen.exportEpubModal.includeCustomJS': 'تضمين JavaScript المخصص',
  'novelScreen.exportEpubModal.includeChapterNumber':
    'تضمين رقم الفصل في عناوين الفصول',
  'novelScreen.exportEpubModal.invalidRange': 'أدخل أرقام فصول صالحة',
  'novelScreen.exportEpubModal.selectFolder':
    'اختر مجلد الوجهة لملف EPUB',
  'novelScreen.exportEpubModal.startChapter': 'الفصل الأول',
  'novelScreen.exportEpubModal.startGreaterThanEnd':
    'يجب أن يكون الفصل الأول أقل من أو يساوي الفصل الأخير',
  'novelScreen.exportEpubModal.title': 'تصدير الرواية كملف EPUB',
  'novelScreen.epub.exportingChapter': '%{current}/%{total} · %{chapter}',
  'novelScreen.epub.preparingExport': 'جارٍ تجهيز ملف EPUB',
  'novelScreen.epub.savingExport': 'جارٍ حفظ ملف EPUB',
  'novelScreen.coverSaved': 'حُفظ الغلاف',
  'novelScreen.coverNotSaved': 'لم يُحفظ الغلاف',
  'novelScreen.deleteChapterError': "لا يمكن حذف مجلد الفصل",
  'novelScreen.deleteMessage': 'حذف الفصول المنزّلة؟',
  'novelScreen.deletedAllDownloads': 'حُذفت جميع التنزيلات',
  'novelScreen.download.custom': 'مخصص',
  'novelScreen.download.customAmount': 'تنزيل عدد مخصص',
  'novelScreen.download.delete': 'حذف التنزيلات',
  'novelScreen.download.next': 'الفصل التالي',
  'novelScreen.download.next10': 'أقسام ١٠ التالية',
  'novelScreen.download.next5': 'أقسام ٥ التالية',
  'novelScreen.download.unread': 'غير المقروءة',
  'novelScreen.edit.addTag': 'إضافة وسم',
  'novelScreen.edit.author': 'المؤلف: %{author}',
  'novelScreen.edit.cover': 'تعديل الغلاف',
  'novelScreen.edit.info': 'تعديل المعلومات',
  'novelScreen.edit.status': 'الحالة:',
  'novelScreen.edit.summary': 'الوصف: %{summary}...',
  'novelScreen.edit.title': 'العنوان: %{title}',
  'novelScreen.jumpToChapterModal.description':
    'ابحث برقم الفصل أو اسمه، ثم اختر فتحه أو التمرير إليه في قائمة الفصول.',
  'novelScreen.jumpToChapterModal.openChapterDescription':
    'أوقفه للتمرير إليه في قائمة الفصول.',
  'novelScreen.jumpToChapterModal.searchByName': 'البحث باسم الفصل',
  'novelScreen.jumpToChapterModal.searchByNameDescription':
    'أوقفه للبحث برقم الفصل.',
  'novelScreen.loadFailed': 'تعذّر تحميل الرواية',
  'novelScreen.noCoverFound': 'لا يوجد غلاف',
  'novelScreen.notFound': 'الرواية غير موجودة في المصدر',
  'novelScreen.progress': 'التقدم %{progress}٪',
  'novelScreen.readChaptersDeleted': 'حُذفت الفصول المقروءة',
  'novelScreen.startReadingChapters': 'ابدأ قراءة %{name}',
  'novelScreen.status.cancelled': 'متوقفة',
  'novelScreen.status.completed': 'مكتملة',
  'novelScreen.status.inactive': 'غير نشطة',
  'novelScreen.status.licensed': 'مرخّصة',
  'novelScreen.status.onHiatus': 'متوقفة مؤقتًا',
  'novelScreen.status.ongoing': 'مستمرة',
  'novelScreen.status.publishingFinished': 'انتهى نشرها',
  'novelScreen.status.stub': 'مؤقتة',
  'novelScreen.status.unknown': 'غير معروفة',
  'novelScreen.tracked': 'مُتتبَّعة',
  'novelScreen.tracking': 'التتبع',
  'novelScreen.unknownStatus': 'حالة غير معروفة',
  'novelScreen.updatedToast': 'حُدِّثت %{name}',
  'readerScreen.bottomSheet.alignCenter': 'وسط',
  'readerScreen.bottomSheet.alignJustify': 'ضبط',
  'readerScreen.bottomSheet.alignLeft': 'يسار',
  'readerScreen.bottomSheet.alignRight': 'يمين',
  'readerScreen.bottomSheet.autoscrollDescription':
    'تمرير الصفحة تلقائيًا بوتيرة ثابتة',
  'readerScreen.bottomSheet.bionicReadingDescription':
    'تغميق بداية كل كلمة لمساعدة العين على التتبع الأسرع',
  'readerScreen.bottomSheet.tapToScrollDescription':
    'انقر أعلى الشاشة أو أسفلها للتمرير عبر الفصل',
  'readerScreen.bottomSheet.display': 'العرض',
  'readerScreen.bottomSheet.fullscreenDescription':
    'إخفاء شريط الحالة وشريط التنقل أثناء القراءة',
  'readerScreen.bottomSheet.navigation': 'التنقل',
  'readerScreen.bottomSheet.pageReaderDescription':
    'تقسيم الفصل إلى صفحات بدل التمرير. تجريبي — قد يفسد التنسيق في بعض الروايات',
  'readerScreen.bottomSheet.removeExtraSpacingDescription':
    'دمج الأسطر الفارغة الزائدة بين الفقرات',
  'readerScreen.bottomSheet.showBatteryAndTimeDescription':
    'عرض مستوى البطارية والساعة فوق شاشة القراءة',
  'readerScreen.bottomSheet.showProgressPercentageDescription':
    'عرض نسبة القراءة أسفل الشاشة',
  'readerScreen.bottomSheet.swipeGesturesDescription':
    'اسحب يمينًا أو يسارًا للانتقال إلى الفصل التالي أو السابق',
  'readerScreen.bottomSheet.ttsAutoPageAdvanceDescription':
    'الانتقال تلقائيًا إلى الفصل التالي عند انتهاء السرد',
  'readerScreen.bottomSheet.ttsEngineDescription':
    'محرك النطق الصوتي المستخدم لتوليد الصوت',
  'readerScreen.bottomSheet.ttsScrollToTopDescription':
    'العودة إلى بداية الفصل عند بدء السرد',
  'readerScreen.bottomSheet.verticalSeekbarDescription':
    'عرض شريط تمرير جانبي للانتقال إلى أي نقطة في الفصل',
  'readerScreen.bottomSheet.volumeButtonsScrollDescription':
    'استخدام أزرار الصوت للتمرير بدل تعديل مستوى الصوت',
  'readerScreen.emptyChapterMessage':
    "<h2>تعذّر تحميل الفصل</h2><p>لم يُعثر على محتوى قابل للقراءة. تحقق من الفصل في WebView؛ إذا ظهر هناك، <a href='%{reportUrl}'>فأبلغ عن مشكلة الإضافة</a>.</p><p><a href='%{refreshUrl}'>تحديث الفصل</a></p><p>الإضافة: %{pluginId}<br>الرواية: %{novelName}<br>الفصل: %{chapterName}</p>",
  'readerScreen.searchMinLength': 'أدخل %{count} أحرف على الأقل للبحث',
  'readerScreen.searchPlaceholder': 'ابحث في الفصل',
  'readerSettings.volumeButtonOffset':
    'مسافة تمرير أزرار الصوت (بمقاييس الشاشة)',
  'statsScreen.novels': 'روايات',
  'statsScreen.topNovelsByTimeSpent': 'أكثر الروايات وقتًا في القراءة',
  'statsScreen.topCategoriesByTimeSpent': 'أكثر التصنيفات وقتًا في القراءة',
  'statsScreen.totalTimeSpent': 'إجمالي وقت القراءة',
  'statsScreen.showNovels': 'تجميع حسب الرواية',
  'statsScreen.showCategories': 'تجميع حسب التصنيف',
  'statsScreen.plugins': 'الإضافات',
  'statsScreen.pluginDistribution': 'توزيع الإضافات',
  'trackingScreen.info':
    'التتبع باتجاه واحد: يُرسل تقدم القراءة إلى الخدمات الخارجية. اربط كل رواية على حدة من زر التتبع الخاص بها.',
  'notifications.EXPORT_EPUB': 'جارٍ تصدير EPUB',
  'notifications.taskQueued': 'أُضيفت %{task} إلى القائمة',
  'notifications.taskCompleted': 'اكتملت',
  'notifications.taskFailed': 'فشلت: %{error}',
  'time.seconds.one': 'ثانية واحدة (%{count})',
  'time.seconds.other': '%{count} ثانية',
  'time.minutes.one': 'دقيقة واحدة (%{count})',
  'time.minutes.other': '%{count} دقيقة',
  'time.hours.one': 'ساعة واحدة (%{count})',
  'time.hours.other': '%{count} ساعة',
  'time.days.one': 'يوم واحد (%{count})',
  'time.days.other': '%{count} يومًا',
  'customCodeSettings.textManipulation': 'معالجة النصوص',
  'customCodeSettings.codeSnippets': 'مقتطفات الشيفرة',
  'customCodeSettings.cssSnippets': 'مقتطفات CSS',
  'customCodeSettings.javascriptSnippets': 'مقتطفات JavaScript',
  'customCodeSettings.createCSSSnippet': 'إنشاء مقتطف CSS',
  'customCodeSettings.addCssCode':
    'إضافة شيفرة CSS مخصصة تُطبق على جميع الفصول',
  'customCodeSettings.createJSSnippet': 'إنشاء مقتطف JavaScript',
  'customCodeSettings.addJavascriptCode':
    'إضافة شيفرة JavaScript مخصصة تُطبق على جميع الفصول',
  'customCodeSettings.noCodeSnippets': 'لا توجد مقتطفات شيفرة',
  'customCodeSettings.renameSnippet': 'إعادة تسمية المقتطف',
  'customCodeSettings.yourCodeHere': 'شيفرتك هنا',
  'customCodeSettings.editReplace': 'تعديل الاستبدال/الإزالة',
  'customCodeSettings.enterAMatch': 'أدخل نمط المطابقة',
  'customCodeSettings.enterAReplace': 'أدخل قيمة الاستبدال',
  'customCodeSettings.itemAlreadyExists': 'العنصر موجود بالفعل',
  'customCodeSettings.replace': 'استبدال',
  'customCodeSettings.removeText': 'إزالة النص',
  'customCodeSettings.snippetSaved': 'حُفظ المقتطف',
  'customCodeSettings.snippetUpdated': 'حُدِّث المقتطف',
  'customCodeSettings.imported': 'تم الاستيراد',
  'genreStats.title': 'إحصاءات التصنيفات',
  'genreStats.totalNovels.one': 'رواية واحدة',
  'genreStats.totalNovels.other': '%{count} روايات',
  'genreStats.topLevelCategories.one': 'تصنيف واحد',
  'genreStats.topLevelCategories.other': '%{count} تصنيفات',
  'genreStats.mostCommon': 'الأكثر شيوعًا',
  'genreStats.empty': 'لا توجد تصنيفات',
  'genreStats.seeAll': 'عرض جميع التصنيفات',
  'genreStats.subgenres.one': 'تصنيف فرعي واحد',
  'genreStats.subgenres.other': '%{count} تصنيفات فرعية',
  'genreStats.noNovels': 'لا توجد روايات لهذا التصنيف',
  'genreStats.seeAllNovels': 'عرض الكل',
  'genreStats.editTaxonomy': 'تعديل تصنيف الأنواع',
  'genreStats.taxonomyTitle': 'تصنيف الأنواع',
  'genreStats.normalization': 'قواعد التوحيد',
  'genreStats.addCategory': 'إضافة تصنيف',
  'genreStats.addChild': 'إضافة تصنيف فرعي',
  'genreStats.addNormalization': 'إضافة قاعدة',
  'genreStats.deleteConfirmTitle': 'حذف العنصر',
  'genreStats.deleteCategoryConfirm': 'حذف هذا التصنيف وتصنيفاته الفرعية؟',
  'genreStats.deleteChildConfirm': 'حذف هذا التصنيف الفرعي؟',
  'genreStats.deleteNormalizationConfirm': 'حذف قاعدة التوحيد هذه؟',
  'genreStats.normalizationKeyPlaceholder': 'مثال: sci-fi',
  'genreStats.normalizationValuePlaceholder': 'مثال: خيال علمي',
  'genreStats.noNormalization': 'لا توجد قواعد توحيد',
  // ---- المفاتيح المفقودة سابقًا (37) ----
  'generalSettingsScreen.showContinueReadingButton':
    'إظهار زر "متابعة القراءة"',
  'generalSettingsScreen.useFABDescription':
    'إظهار زر عائم يفتح الفصل الذي قرأته آخر مرة.',
  'libraryScreen.bottomSheet.display.continueReadingButton':
    'زر متابعة القراءة',
  'libraryScreen.bottomSheet.display.overlays': 'الطبقات العلوية',
  'readerScreen.bottomSheet.invertVolumeButtons': 'عكس أزرار الصوت',
  'readerScreen.bottomSheet.invertVolumeButtonsDescription':
    'تبديل زرَّي رفع وخفض الصوت للصفحة السابقة والتالية',
  'readerScreen.bottomSheet.disablePageTransitions':
    'تعطيل حركة انتقال الصفحات',
  'readerScreen.bottomSheet.disablePageTransitionsDescription':
    'قلب الصفحات فورًا دون حركة انزلاق',
  'statsScreen.readLabel': 'مقروءة',
  'statsScreen.downloadedLabel': 'منزّلة',
  'statsScreen.readingTime': 'وقت القراءة',
  'statsScreen.chaptersInLibrary': 'فصول في المكتبة',
  'statsScreen.customizeGenres': 'تخصيص',
  'customCodeSettings.description':
    'تعمل القواعد والمقتطفات على كل فصل تقرؤه بالترتيب المعروض.',
  'customCodeSettings.textRules': 'قواعد النصوص',
  'customCodeSettings.ruleCount.one': 'قاعدة واحدة',
  'customCodeSettings.ruleCount.other': '%{count} قواعد',
  'customCodeSettings.activeSnippetCount.one': '%{count} من %{total} نشط',
  'customCodeSettings.activeSnippetCount.other': '%{count} من %{total} نشط',
  'customCodeSettings.addReplaceRule': 'إضافة استبدال',
  'customCodeSettings.addRemoveRule': 'إضافة إزالة',
  'customCodeSettings.renameHint': 'اضغط مطولًا لإعادة التسمية',
  'customCodeSettings.regexHint':
    'النص العادي يؤثر على جميع المطابقات. للتعبيرات النمطية استخدم /pattern/flags وأضف g للتأثير على جميع المطابقات.',
  'customCodeSettings.beautifyCode': 'تحسين تنسيق الشيفرة',
  'customCodeSettings.beautifyFailed':
    "تعذّر تنسيق الشيفرة. تحقق من صياغتها وحاول مجددًا.",
  'customCodeSettings.syntaxHighlighting': 'تلوين الصياغة',
  'customCodeSettings.importCode': 'استيراد شيفرة',
  'genreStats.novels': 'الروايات',
  'genreStats.genreGroups': 'مجموعات التصنيفات',
  'genreStats.taxonomyDescription':
    'تجمع الإحصاءات تصنيفات كل رواية ضمن هذه المجموعات. التصنيفات خارج المجموعات تُحسب فرادى.',
  'genreStats.newGroup': 'مجموعة جديدة',
  'genreStats.editGenreGroup': 'تعديل مجموعة التصنيفات',
  'genreStats.genresInGroup': 'التصنيفات في هذه المجموعة',
  'genreStats.noGenresInGroup': 'لا توجد تصنيفات بعد',
  'genreStats.foundInLibrary': 'موجود في مكتبتك',
  'genreStats.ungroupedGenresDescription':
    'تصنيفات تستخدمها مصادرك ولم تُضمَّن لأي مجموعة بعد',
  'genreStats.deleteGroupConfirm':
    'حذف مجموعة التصنيفات هذه؟ ستُحسب تصنيفاتها فرادى.',
};

const EN_TO_KEEP_AS_IS = new Set([
  // Brand / product names and technical acronyms intentionally stay English
  'advancedSettingsScreen.dnsOverHttps',
  'advancedSettingsScreen.dnsOverHttpsDescription',
  'generalSettingsScreen.epub',
  'webview.openInWebView',
  'browseScreen.pluginIcon',
]);

const setPath = (obj, keyPath, value) => {
  const parts = keyPath.split('.');
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof node[parts[i]] !== 'object' || node[parts[i]] === null) {
      node[parts[i]] = {};
    }
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
};

const file = path.join(
  __dirname,
  '..',
  'src',
  'i18n',
  'languages',
  'ar_SA',
  'strings.json',
);
const ar = JSON.parse(fs.readFileSync(file, 'utf8'));

const en = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'src', 'i18n', 'languages', 'en', 'strings.json'),
    'utf8',
  ),
);

let applied = 0;
let skippedIdentical = 0;
const getValue = (obj, keyPath) =>
  keyPath.split('.').reduce((node, part) => (node ? node[part] : undefined), obj);

for (const [keyPath, arabic] of Object.entries(T)) {
  const currentValue = getValue(ar, keyPath);
  const english = getValue(en, keyPath);
  if (EN_TO_KEEP_AS_IS.has(keyPath)) {
    continue;
  }
  if (currentValue === undefined || currentValue === english) {
    setPath(ar, keyPath, arabic);
    applied++;
  } else {
    skippedIdentical++;
  }
}

// Remove orphan key that has no English counterpart
if (ar.genreStats && 'novelsIn' in ar.genreStats) {
  delete ar.genreStats.novelsIn;
  // eslint-disable-next-line no-console
  console.log('removed orphan genreStats.novelsIn');
}

fs.writeFileSync(file, JSON.stringify(ar, null, 2) + '\n', 'utf8');
// eslint-disable-next-line no-console
console.log(
  `applied: ${applied}, already translated (kept): ${skippedIdentical}`,
);
