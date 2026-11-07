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

    AsyncFunction("shareCrashLogs") { (_: String, _: String, promise: Promise) in
      // No Logcat/FileProvider equivalent on iOS — nothing to share.
      promise.resolve(())
    }

    Function("recordJsCrash") { (stackTrace: String) in
      NSLog("[LNReader][JS crash] %@", stackTrace)
    }

    AsyncFunction("getPendingCrash") { (promise: Promise) in
      promise.resolve(nil)
    }

    AsyncFunction("clearPendingCrash") { (promise: Promise) in
      promise.resolve(())
    }

    AsyncFunction("getDebugInfo") { (promise: Promise) in
      let info: [String: String?] = ["webViewVersion": nil]
      promise.resolve(info)
    }

    Function("restartApp") {
      #if canImport(React)
      RCTTriggerReloadCommandListeners("lnreader-restart")
      #endif
    }
  }
}
