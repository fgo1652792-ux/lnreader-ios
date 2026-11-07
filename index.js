import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { AppRegistry, I18nManager } from 'react-native';
import { i18n, isRTLLocale } from './src/i18n/translations';
import { runHeadlessBackgroundTask } from './src/services/backgroundTasks';
import { installJsCrashHandler } from './src/services/crashLogs/installJsCrashHandler';
import { restartApplication } from './src/services/crashLogs/nativeCrashState';

installJsCrashHandler();

AppRegistry.registerHeadlessTask(
  'LNReaderBackgroundTask',
  () => runHeadlessBackgroundTask,
);

import App from './App';

/**
 * ---------------------------------------------------------------------------
 * RTL decision — the single source of truth for layout direction.
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS (the tab-indicator bug):
 *
 *   `I18nManager.getConstants().isRTL` is captured ONCE, when the JS bundle
 *   is evaluated (see react-native/Libraries/ReactNative/I18nManager.js —
 *   `i18nConstants` is a module-scope constant). On iOS the native value it
 *   snapshots comes from RCTI18nUtil, which is persisted in NSUserDefaults.
 *
 *   react-native-tab-view derives BOTH its page order (pager layoutDirection)
 *   and its indicator math from that frozen constant, while every real RN
 *   view (the tab strip's FlatList, rows, icons) is mirrored LIVE by the
 *   native layer. If the frozen snapshot and the live mirroring ever
 *   disagree, the indicator points at the neighbour tab while the content
 *   shows the tab the user actually selected — exactly the bug reported on
 *   Browse (المصادر/الإضافات) and Library (افتراضي/محلي/…) tabs.
 *
 * THE FIX: decide the direction HERE, before anything mounts, and make the
 * frozen snapshot agree with it. When a mismatch is detected (first launch
 * with an RTL app language, or a language flip whose runtime reload was
 * declined), we persist the correct values and reload the bundle ONCE,
 * before registering the root component — so every view of this process is
 * created under the same direction the tab system will compute with.
 *
 * The reload is guarded by a global flag that survives JS reloads but not
 * process restarts, so it can never loop.
 * ---------------------------------------------------------------------------
 */
const targetRTL = isRTLLocale(i18n.locale);
const snapshotRTL = I18nManager.getConstants().isRTL;

// Persisted by the native side (RCTI18nUtil) immediately; the AppDelegate
// prebuild patch re-applies them before the bridge starts on every launch.
I18nManager.allowRTL(targetRTL);
I18nManager.forceRTL(targetRTL);

const RTL_REBUILD_FLAG = '__LNREADER_RTL_REBUILD__';

if (snapshotRTL !== targetRTL && !globalThis[RTL_REBUILD_FLAG]) {
  globalThis[RTL_REBUILD_FLAG] = true;
  // Reload before mounting: the re-evaluated bundle re-snapshots
  // I18nManager.getConstants() from the values we just persisted, so the
  // tab-view direction and the native view mirroring are guaranteed to
  // agree for the lifetime of this process. The user only sees the splash.
  restartApplication();
} else {
  delete globalThis[RTL_REBUILD_FLAG];
  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  registerRootComponent(App);
}
