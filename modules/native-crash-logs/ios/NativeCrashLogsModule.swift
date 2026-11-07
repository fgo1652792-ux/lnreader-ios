import ExpoModulesCore
#if canImport(React)
import React
#endif

/**
 * iOS implementation of the NativeCrashLogs module.
 *
 * Android collects Logcat-based crash reports; iOS has no equivalent exposed
 * to a sandboxed app, so the crash-report surface is intentionally inert here
 * (the JS-side crash handler + CrashRecoveryGate remain fully functional).
 *
 * `restartApp()` is the important piece: it reloads the React runtime, which
 * re-runs index.js — that is how the app applies language switches that flip
 * `I18nManager.forceRTL` (layout mirroring needs freshly created views).
 */
public class NativeCrashLogsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeCrashLogs")

    AsyncFunction("shareCrashLogs") { (_, _: Promise<Void>) in
      // No Logcat/FileProvider equivalent on iOS — nothing to share.
    }

    Function("recordJsCrash") { (stackTrace: String) in
      NSLog("[LNReader][JS crash] %@", stackTrace)
    }

    AsyncFunction("getPendingCrash") { (promise: Promise<String?>) in
      promise.resolve(nil)
    }

    AsyncFunction("clearPendingCrash") { (promise: Promise<Void>) in
      promise.resolve(())
    }

    AsyncFunction("getDebugInfo") { (promise: Promise<[String: String?]>) in
      promise.resolve(["webViewVersion": nil])
    }

    Function("restartApp") {
      #if canImport(React)
      RCTTriggerReloadCommandListeners("lnreader-restart")
      #endif
    }
  }
}
