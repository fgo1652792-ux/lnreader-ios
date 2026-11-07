/**
 * One-off: injects the new i18n keys needed by the iOS UX fix batch into
 * en + ar strings.json (English source, natural Arabic translations).
 * Safe to re-run: existing keys are never overwritten.
 */
const fs = require('fs');
const path = require('path');

const EN_NEW = {
  readerScreen: {
    tts: {
      title: 'Text to Speech',
      enableTTS: 'Enable TTS',
      engine: 'Engine',
      voice: 'Voice',
      selectEngine: 'Select Engine',
      selectVoice: 'Select Voice',
      autoPageAdvance: 'Auto Page Advance',
      scrollToTop: 'Scroll to Top',
    },
    bottomSheet: {
      theme: 'Theme',
      accessibility: 'Accessibility',
      readingEnhancements: 'Reading Enhancements',
    },
  },
  trackScreen: {
    status: 'Status',
    score: 'Score',
    chapters: 'Chapters',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    ok: 'OK',
    enterValidNumber: 'Enter a valid number',
    statusLabels: {
      reading: 'Reading',
      planToRead: 'Plan to read',
      completed: 'Completed',
      dropped: 'Dropped',
      onHold: 'On Hold',
      rereading: 'Rereading',
    },
    malScores: {
      noScore: 'No Score',
      appalling: 'Appalling',
      worseThanBad: 'Worse than bad',
      bad: 'Bad',
      average: 'Average',
      good: 'Good',
      veryGood: 'Very good',
      goodPlus: 'Good +',
      excellent: 'Excellent',
      masterpiece: 'Masterpiece',
    },
  },
  taskQueue: {
    title: 'Task Queue',
    noRunningTasks: 'No running tasks',
  },
  moreScreen: {
    repositories: 'Repositories',
    customCode: 'Custom Code',
  },
  browseScreen: {
    noResultsFound: 'No results found',
    searchMyAnimeList: 'Search MyAnimeList',
    searchAniList: 'Search AniList',
  },
  globalSearch: {
    hasResults: 'Has results',
  },
  repositories: {
    deleteRepository: 'Delete repository',
    deleteRepositoryMessage:
      'Are you sure you want to delete the repository %{url}? Its plugins will be removed.',
    invalidUrl: 'Repository URL is invalid',
    duplicateRepository: 'A repository with this URL already exists!',
    urlPlaceholder: 'Repo URL',
  },
  updatesScreen: {
    noNovelsToUpdate: "There's no novel to be updated",
  },
  novelScreen: {
    notAvailableWhileLoading: 'Not available while loading',
  },
  common: {
    increase: 'Increase',
    decrease: 'Decrease',
    invalidHexColor: 'Enter a valid hex color code',
    hexColorPlaceholder: 'Hex color code (e.g. #3399FF)',
  },
  colorPicker: {
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    preview: 'Preview',
    contrast: 'Contrast',
    contrastLowWarning: 'Low contrast — text may be hard to read',
    contrastGood: 'Readable contrast',
    readerPresets: 'Reading presets',
  },
  readerSettings: {
    customColors: 'Custom Colors',
    tabDisplay: 'Display',
    tabTheme: 'Theme',
    tabNavigation: 'Navigation',
    tabAccessibility: 'Accessibility',
  },
};

const AR_NEW = {
  readerScreen: {
    tts: {
      title: 'النطق الصوتي',
      enableTTS: 'تشغيل النطق الصوتي',
      engine: 'المحرك',
      voice: 'الصوت',
      selectEngine: 'اختر المحرك',
      selectVoice: 'اختر الصوت',
      autoPageAdvance: 'الانتقال التلقائي للصفحة',
      scrollToTop: 'التمرير إلى الأعلى',
    },
    bottomSheet: {
      theme: 'السمة',
      accessibility: 'إمكانية الوصول',
      readingEnhancements: 'تحسينات القراءة',
    },
  },
  trackScreen: {
    status: 'الحالة',
    score: 'التقييم',
    chapters: 'الفصول',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول...',
    ok: 'حسنًا',
    enterValidNumber: 'أدخل رقمًا صحيحًا',
    statusLabels: {
      reading: 'أقرأه الآن',
      planToRead: 'أنوي قراءته',
      completed: 'أكملته',
      dropped: 'أوقفت قراءته',
      onHold: 'متوقف مؤقتًا',
      rereading: 'أعيد قراءته',
    },
    malScores: {
      noScore: 'بلا تقييم',
      appalling: 'سيئ جدًا',
      worseThanBad: 'أسوأ من سيئ',
      bad: 'سيئ',
      average: 'متوسط',
      good: 'جيد',
      veryGood: 'جيد جدًا',
      goodPlus: 'جيد +',
      excellent: 'ممتاز',
      masterpiece: 'تحفة فنية',
    },
  },
  taskQueue: {
    title: 'قائمة المهام',
    noRunningTasks: 'لا توجد مهام قيد التشغيل',
  },
  moreScreen: {
    repositories: 'المستودعات',
    customCode: 'الأكواد المخصصة',
  },
  browseScreen: {
    noResultsFound: 'لا توجد نتائج',
    searchMyAnimeList: 'ابحث في MyAnimeList',
    searchAniList: 'ابحث في AniList',
  },
  globalSearch: {
    hasResults: 'لها نتائج',
  },
  repositories: {
    deleteRepository: 'حذف المستودع',
    deleteRepositoryMessage:
      'هل تريد حقًا حذف المستودع %{url}؟ ستُزال إضافاته.',
    invalidUrl: 'رابط المستودع غير صالح',
    duplicateRepository: 'يوجد مستودع بهذا الرابط بالفعل!',
    urlPlaceholder: 'رابط المستودع',
  },
  updatesScreen: {
    noNovelsToUpdate: 'لا توجد روايات لتحديثها',
  },
  novelScreen: {
    notAvailableWhileLoading: 'غير متاح أثناء التحميل',
  },
  common: {
    increase: 'زيادة',
    decrease: 'تقليل',
    invalidHexColor: 'أدخل رمز لون سداسي عشري صالحًا',
    hexColorPlaceholder: 'رمز اللون (مثال: #3399FF)',
  },
  colorPicker: {
    hue: 'درجة اللون',
    saturation: 'التشبع',
    lightness: 'السطوع',
    preview: 'معاينة',
    contrast: 'التباين',
    contrastLowWarning: 'تباين منخفض — قد يصعب قراءة النص',
    contrastGood: 'تباين مريح للقراءة',
    readerPresets: 'ألوان جاهزة للقراءة',
  },
  readerSettings: {
    customColors: 'ألوان مخصصة',
    tabDisplay: 'العرض',
    tabTheme: 'السمة',
    tabNavigation: 'التنقل',
    tabAccessibility: 'إمكانية الوصول',
  },
};

const deepAssign = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      deepAssign(target[key], value);
    } else if (target[key] === undefined) {
      target[key] = value;
    }
  }
};

const apply = (locale, additions) => {
  const file = path.join(
    __dirname,
    '..',
    'src',
    'i18n',
    'languages',
    locale,
    'strings.json',
  );
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepAssign(data, additions);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  // eslint-disable-next-line no-console
  console.log(`${locale}: keys injected`);
};

apply('en', EN_NEW);
apply('ar_SA', AR_NEW);
