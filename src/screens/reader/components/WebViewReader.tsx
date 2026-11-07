import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  StatusBar,
  StyleSheet,
} from 'react-native';
import WebView from 'react-native-webview';
import * as Linking from 'expo-linking';
import color from 'color';

import { useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';

import { getPlugin } from '@plugins/pluginManager';
import { MMKVStorage, getMMKVObject } from '@utils/mmkv/mmkv';
import {
  CHAPTER_GENERAL_SETTINGS,
  CHAPTER_READER_SETTINGS,
  ChapterGeneralSettings,
  ChapterReaderSettings,
  initialChapterGeneralSettings,
  initialChapterReaderSettings,
} from '@hooks/persisted/useSettings';
import { getBatteryLevel } from 'react-native-device-info';
import { PLUGIN_STORAGE } from '@utils/Storages';
import { getReaderAssetsPrefix } from '@utils/readerAssets';
import { useChapterContext } from '../ChapterContext';
import { ReaderSearchResult } from '../types';
import { useTtsSession } from '../hooks/useTtsSession';
import type { TtsSettings } from '@modules/nitro-tts';
import { ChapterInfo } from '@database/types';
import { Dialog } from '@components/Dialog';
import { TextInput } from 'react-native-paper';
import useCustomCode from './Hooks/useCustomCode';
import useTextModifications from './Hooks/useTextModifications';
import {
  isChapterRefreshUrl,
  isPluginIssueReportUrl,
} from '../utils/sanitizeChapterText';

export type WebViewPostEvent = {
  type: string;
  data?: unknown;
  autoStartTTS?: boolean;
  index?: number;
  total?: number;
};

/**
 * Parses a WebView message defensively. Plugin `custom.js` snippets (or a
 * partially-written message) can post non-JSON strings; throwing here would
 * break every later message, including progress saves and toolbar toggles.
 */
const parseWebViewEvent = (raw: string): WebViewPostEvent | null => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.type
      ? (parsed as WebViewPostEvent)
      : null;
  } catch {
    return null;
  }
};

type WebViewReaderProps = {
  onPress(): void;
  onTouchStart?(): void;
  onSearchResult(result: ReaderSearchResult): void;
  searchTextRef: React.MutableRefObject<string>;
};

const onLogMessage = (payload: { nativeEvent: { data: string } }) => {
  const dataPayload = JSON.parse(payload.nativeEvent.data);
  if (dataPayload) {
    if (dataPayload.type === 'console') {
      /* eslint-disable no-console */
      console.info(`[Console] ${JSON.stringify(dataPayload.msg, null, 2)}`);
    }
  }
};

/** Checks whether two TTS settings objects are equal */
const areTTSSettingsEqual = (
  a: ChapterReaderSettings['tts'],
  b: ChapterReaderSettings['tts'],
) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.rate === b.rate &&
    a.pitch === b.pitch &&
    a.autoPageAdvance === b.autoPageAdvance &&
    a.scrollToTop === b.scrollToTop &&
    a.voice?.identifier === b.voice?.identifier &&
    a.engine?.name === b.engine?.name
  );
};

const toNativeTtsSettings = (
  settings: ChapterReaderSettings['tts'],
): TtsSettings => ({
  engineName: settings?.engine?.name,
  voiceIdentifier: settings?.voice?.identifier,
  rate: settings?.rate ?? 1,
  pitch: settings?.pitch ?? 1,
});

/**
 * The adjacent chapters are resolved after the chapter itself is on screen, so
 * they are pushed into the loaded page instead of being baked into the HTML –
 * rebuilding the HTML would reload the WebView and lose the reading position.
 */
const buildAdjacentChapterScript = (
  nextChapter?: ChapterInfo,
  prevChapter?: ChapterInfo,
) => `
  window.reader?.setAdjacentChapters?.(${JSON.stringify({
    nextChapter,
    prevChapter,
    strings: {
      nextChapter: getString('readerScreen.nextChapter', {
        name: nextChapter?.name,
      }),
    },
  })});
  true;
`;

const { RNDeviceInfo } = NativeModules;
const deviceInfoEmitter = new NativeEventEmitter(RNDeviceInfo);

/**
 * Last level seen, so a chapter can be rendered without the synchronous native
 * call the sync variant of this API performs. It is refreshed asynchronously
 * and pushed into the page, which also happens on every battery change event.
 */
let lastKnownBatteryLevel = 0;

const assetsUriPrefix = getReaderAssetsPrefix();

const WebViewReader: React.FC<WebViewReaderProps> = ({
  onPress,
  onTouchStart,
  onSearchResult,
  searchTextRef,
}) => {
  const {
    novel,
    chapter,
    chapterText: html,
    navigateChapter,
    saveProgress,
    nextChapter,
    prevChapter,
    webViewRef,
    onUserInteraction,
    isTTSReadingRef,
    refetch,
  } = useChapterContext();
  const theme = useTheme();
  const initialReaderSettings = useMemo(
    () => ({
      ...initialChapterReaderSettings,
      ...getMMKVObject<ChapterReaderSettings>(CHAPTER_READER_SETTINGS),
    }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapter.id],
  );

  const chapterGeneralSettings = useMemo(
    () => ({
      ...initialChapterGeneralSettings,
      ...getMMKVObject<ChapterGeneralSettings>(CHAPTER_GENERAL_SETTINGS),
    }),
    // needed to preserve settings during chapter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapter.id],
  );

  const [batteryLevel] = useState(lastKnownBatteryLevel);
  const plugin = getPlugin(novel?.pluginId);
  const pluginCustomJS = `file://${PLUGIN_STORAGE}/${plugin?.id}/custom.js`;
  const pluginCustomCSS = `file://${PLUGIN_STORAGE}/${plugin?.id}/custom.css`;
  const nextChapterScreenVisible = useRef<boolean>(false);
  const autoStartTTSRef = useRef<boolean>(false);
  const activeChapterIdRef = useRef(chapter.id);
  const adjacentChapterScriptRef = useRef(buildAdjacentChapterScript());
  const {
    command: runTtsCommand,
    loadAndPlay,
    progress: ttsProgress,
    seekTo: seekTts,
    state: ttsState,
    updateSettings: updateTtsSettings,
  } = useTtsSession();

  const { customJS, customCSS } = useCustomCode(initialReaderSettings);

  const {
    html: processedHtml,
    replaceModalVisible,
    setReplaceModalVisible,
    selectedTextForReplace,
    replacementText,
    setReplacementText,
    handleReplaceSave,
    handleReplaceCancel,
    eventTextAction,
  } = useTextModifications(html, webViewRef);

  const [readerSettings, setReaderSettings] = useState(
    () =>
      getMMKVObject<ChapterReaderSettings>(CHAPTER_READER_SETTINGS) ||
      initialChapterReaderSettings,
  );

  /**
   * Ready-handshake: the page posts `{type:'ready'}` once all reader globals
   * exist. Updates pushed before that are dropped by the WebView (the global
   * is not there yet), so they are buffered and replayed on ready.
   */
  const webViewReadyRef = useRef(false);
  const generalSettingsRef = useRef<ChapterGeneralSettings>(
    chapterGeneralSettings,
  );
  // Chapter changes rebuild the page snapshot; keep the replay source current.
  useEffect(() => {
    generalSettingsRef.current = chapterGeneralSettings;
  }, [chapterGeneralSettings]);
  const adjacentScriptReadyRef = useRef<string | null>(null);

  const pushReaderSettingsToWebView = useCallback(
    (settings: ChapterReaderSettings) => {
      if (!webViewReadyRef.current) {
        return;
      }
      webViewRef.current?.injectJavaScript(
        `window.reader?.readerSettings && (reader.readerSettings.val = ${JSON.stringify(
          settings,
        )}); true;`,
      );
    },
    [webViewRef],
  );

  const pushGeneralSettingsToWebView = useCallback(
    (settings: ChapterGeneralSettings) => {
      generalSettingsRef.current = settings;
      if (!webViewReadyRef.current) {
        return;
      }
      webViewRef.current?.injectJavaScript(
        `window.reader?.generalSettings && (reader.generalSettings.val = ${JSON.stringify(
          settings,
        )}); true;`,
      );
    },
    [webViewRef],
  );

  const pushBatteryToWebView = useCallback(
    (level: number) => {
      if (!webViewReadyRef.current) {
        return;
      }
      webViewRef.current?.injectJavaScript(
        `if (window.reader?.batteryLevel) { reader.batteryLevel.val = ${level}; } true;`,
      );
    },
    [webViewRef],
  );

  const pushAdjacentChaptersToWebView = useCallback(
    (script: string) => {
      if (!webViewReadyRef.current) {
        return;
      }
      webViewRef.current?.injectJavaScript(script);
    },
    [webViewRef],
  );

  const readerSettingsRef = useRef<ChapterReaderSettings>(readerSettings);

  useEffect(() => {
    readerSettingsRef.current = readerSettings;
  }, [readerSettings]);

  useEffect(() => {
    isTTSReadingRef.current = ttsState === 'playing';
    webViewRef.current?.injectJavaScript(`
      window.tts?.setPlaybackState?.(${JSON.stringify(ttsState)});
      true;
    `);
    if (ttsState === 'completed') {
      webViewRef.current?.injectJavaScript('window.tts?.complete?.(); true;');
    }
  }, [isTTSReadingRef, ttsState, webViewRef]);

  useEffect(() => {
    if (ttsProgress.total > 0) {
      webViewRef.current?.injectJavaScript(`
        window.tts?.setActiveIndex?.(${ttsProgress.index});
        true;
      `);
    }
  }, [ttsProgress, webViewRef]);

  useEffect(() => {
    if (activeChapterIdRef.current !== chapter.id) {
      activeChapterIdRef.current = chapter.id;
      runTtsCommand('stop');
    }
  }, [chapter.id, runTtsCommand]);

  useEffect(() => {
    const script = buildAdjacentChapterScript(nextChapter, prevChapter);
    // Kept for onLoadEnd: an update that lands before the document is ready is
    // dropped by the WebView, so it is replayed once the page has loaded.
    adjacentChapterScriptRef.current = script;
    adjacentScriptReadyRef.current = script;
    pushAdjacentChaptersToWebView(script);
  }, [
    nextChapter,
    prevChapter,
    pushAdjacentChaptersToWebView,
    webViewRef,
  ]);

  useEffect(() => {
    const mmkvListener = MMKVStorage.addOnValueChangedListener(key => {
      switch (key) {
        case CHAPTER_READER_SETTINGS: {
          // Update reader settings
          const newReaderSettings =
            getMMKVObject<ChapterReaderSettings>(CHAPTER_READER_SETTINGS) ||
            initialChapterReaderSettings;
          setReaderSettings(newReaderSettings);
          if (
            !areTTSSettingsEqual(
              readerSettingsRef.current.tts,
              newReaderSettings.tts,
            )
          ) {
            updateTtsSettings(toNativeTtsSettings(newReaderSettings.tts));
          }
          // Update WebView settings (buffered until the page is ready)
          pushReaderSettingsToWebView(newReaderSettings);
          break;
        }
        case CHAPTER_GENERAL_SETTINGS: {
          const newGeneralSettings =
            getMMKVObject<ChapterGeneralSettings>(CHAPTER_GENERAL_SETTINGS) ||
            initialChapterGeneralSettings;
          pushGeneralSettingsToWebView(newGeneralSettings);
          break;
        }
      }
    });

    const subscription = deviceInfoEmitter.addListener(
      'RNDeviceInfo_batteryLevelDidChange',
      (level: number) => {
        lastKnownBatteryLevel = level;
        pushBatteryToWebView(level);
      },
    );

    getBatteryLevel().then(level => {
      lastKnownBatteryLevel = level;
      pushBatteryToWebView(level);
    });

    return () => {
      subscription.remove();
      mmkvListener.remove();
    };
  }, [
    pushBatteryToWebView,
    pushGeneralSettingsToWebView,
    pushReaderSettingsToWebView,
    updateTtsSettings,
    webViewRef,
  ]);
  const isRTL = plugin?.lang === 'Arabic' || plugin?.lang === 'Hebrew';
  const readerDir = isRTL ? 'rtl' : 'ltr';
  // RTL chapters inherit the reader's alignment: the stored default `left`
  // is mirrored to `right` so Arabic/Hebrew novels read naturally. An explicit
  // alignment choice other than the default is respected as-is.
  const resolvedTextAlign =
    isRTL && initialReaderSettings.textAlign === 'left'
      ? 'right'
      : initialReaderSettings.textAlign;

  /**
   * Serialising the whole chapter is expensive, so the document is built once
   * per chapter. Handing the WebView a different `source` also reloads the
   * page, so nothing that changes while a chapter is on screen may be part of
   * it – those updates go through `injectJavaScript` instead.
   */
  const source = useMemo(() => {
    // eslint-disable-next-line react-hooks/refs
    const isNextChapterScreenVisible = nextChapterScreenVisible.current;
    return {
      baseUrl: !chapter.isDownloaded ? plugin?.site : undefined,
      headers: plugin?.imageRequestInit?.headers,
      method: plugin?.imageRequestInit?.method,
      body: plugin?.imageRequestInit?.body,
      html: `
        <!DOCTYPE html>
          <html dir="${readerDir}" lang="${
            plugin?.lang?.toLowerCase() || 'en'
          }">
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
              <meta name="color-scheme" content="light dark">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/index.css">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/pageReader.css">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/toolWrapper.css">
              <link rel="stylesheet" href="${assetsUriPrefix}/css/tts.css">
              <style>
              :root {
                --StatusBar-currentHeight: ${StatusBar.currentHeight}px;
                --readerSettings-theme: ${initialReaderSettings.theme};
                --readerSettings-padding: ${initialReaderSettings.padding}px;
                --readerSettings-textSize: ${initialReaderSettings.textSize}px;
                --readerSettings-textColor: ${initialReaderSettings.textColor};
                --readerSettings-textAlign: ${resolvedTextAlign};
                --readerSettings-lineHeight: ${
                  initialReaderSettings.lineHeight
                };
                --readerSettings-fontFamily: ${
                  initialReaderSettings.fontFamily
                };
                --theme-primary: ${theme.primary};
                --theme-onPrimary: ${theme.onPrimary};
                --theme-secondary: ${theme.secondary};
                --theme-tertiary: ${theme.tertiary};
                --theme-onTertiary: ${theme.onTertiary};
                --theme-onSecondary: ${theme.onSecondary};
                --theme-surface: ${theme.surface};
                --theme-surface-0-9: ${color(theme.surface)
                  .alpha(0.9)
                  .toString()};
                --theme-onSurface: ${theme.onSurface};
                --theme-surfaceVariant: ${theme.surfaceVariant};
                --theme-onSurfaceVariant: ${theme.onSurfaceVariant};
                --theme-outline: ${theme.outline};
                --theme-outlineVariant: ${theme.outlineVariant};
                --theme-rippleColor: ${theme.rippleColor};
                }
                </style>
                <style id="ln-font">
                @font-face {
                  font-family: ${initialReaderSettings.fontFamily};
                  src: url("${assetsUriPrefix}/fonts/${
                    initialReaderSettings.fontFamily
                  }.ttf");
                  font-display: swap;
                }
                                </style>
              <link rel="stylesheet" href="${pluginCustomCSS}">
              <style id="ln-custom-css">${customCSS}</style>
            </head>
            <body class="${
              chapterGeneralSettings.pageReader ? 'page-reader' : ''
            } ${
        chapterGeneralSettings.pageReaderDisableAnimation ? 'no-animation' : ''
      }">
              <div class="transition-chapter" style="transform: ${
                isNextChapterScreenVisible
                  ? `translateX(${isRTL ? '' : '-'}100%)`
                  : 'translateX(0%)'
              };
              ${chapterGeneralSettings.pageReader ? '' : 'display: none'}"
              ">${chapter.name}</div>
              <div id="LNReader-chapter">
                ${processedHtml}
              </div>
              <div id="reader-ui"></div>
              </body>
              <script>
                var initialPageReaderConfig = ${JSON.stringify({
                  nextChapterScreenVisible: isNextChapterScreenVisible,
                })};


                var initialReaderConfig = ${JSON.stringify({
                  readerSettings: initialReaderSettings,
                  chapterGeneralSettings,
                  novel,
                  chapter,
                  batteryLevel,
                  autoSaveInterval: 2222,
                  DEBUG: __DEV__,
                  strings: {
                    finished:
                      getString('readerScreen.finished') +
                      ': ' +
                      chapter.name.trim(),
                    noNextChapter: getString('readerScreen.noNextChapter'),
                    removeText: getString('common.remove'),
                    replaceText: getString('customCodeSettings.replace'),
                  },
                })}
              </script>
              <script>window.LN_READER_ASSETS_PREFIX = ${JSON.stringify(
                assetsUriPrefix,
              )};</script>
              <script src="${assetsUriPrefix}/js/polyfill-onscrollend.js"></script>
              <script src="${assetsUriPrefix}/js/icons.js"></script>
              <script src="${assetsUriPrefix}/js/van.js"></script>
              <script src="${assetsUriPrefix}/js/text-vibe.js"></script>
              <script src="${assetsUriPrefix}/js/core.js"></script>
              <script src="${assetsUriPrefix}/js/search.js"></script>
              <script src="${assetsUriPrefix}/js/index.js"></script>
              <script src="${assetsUriPrefix}/js/textRemover.js"></script>
              <script src="${pluginCustomJS}"></script>
              <script id="ln-custom-js">
              function fn(){
                let html = document.querySelector('#LNReader-chapter').innerHTML;
                ${customJS}
                document.querySelector('#LNReader-chapter').innerHTML = html;
              }
              document.addEventListener('DOMContentLoaded', fn);
              </script>
          </html>
          `,
    };
  }, [
    batteryLevel,
    chapter,
    chapterGeneralSettings,
    processedHtml,
    customJS,
    customCSS,
    initialReaderSettings,
    novel,
    plugin,
    pluginCustomCSS,
    pluginCustomJS,
    readerDir,
    theme,
  ]);

  return (
    <>
      <WebView
        ref={webViewRef}
        onTouchStart={onTouchStart}
        style={{ backgroundColor: readerSettings.theme }}
        allowFileAccess={true}
        originWhitelist={['*']}
        scalesPageToFit={true}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        webviewDebuggingEnabled={__DEV__}
        onShouldStartLoadWithRequest={({ url }) => {
          if (isPluginIssueReportUrl(url)) {
            void Linking.openURL(url);
            return false;
          }
          if (isChapterRefreshUrl(url)) {
            refetch();
            return false;
          }
          return true;
        }}
        onLoadEnd={() => {
          // The baked page-turn overlay has served its purpose once this page
          // rendered; reset it so later loads (drawer navigation, refetch) do
          // not start covered by the transition screen.
          nextChapterScreenVisible.current = false;

          // Replay everything that may have been pushed while the document was
          // still loading (the WebView drops injections for missing globals).
          webViewReadyRef.current = true;
          webViewRef.current?.injectJavaScript(
            `if (window.reader && window.reader.batteryLevel) {
            window.reader.batteryLevel.val = ${lastKnownBatteryLevel};
          } true;`,
          );
          pushReaderSettingsToWebView(readerSettingsRef.current);
          pushGeneralSettingsToWebView(generalSettingsRef.current);
          pushAdjacentChaptersToWebView(
            adjacentScriptReadyRef.current || adjacentChapterScriptRef.current,
          );

          const searchText = searchTextRef.current.trim();
          if (searchText) {
            webViewRef.current?.injectJavaScript(
              `window.readerSearch?.search(${JSON.stringify(
                searchText,
              )}); true;`,
            );
          }

          if (autoStartTTSRef.current) {
            autoStartTTSRef.current = false;
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(`
              (function() {
                if (window.tts && reader.generalSettings.val.TTSEnable) {
                  setTimeout(() => {
                    tts.start();
                  }, 500);
                }
              })();
            `);
            }, 300);
          }
        }}
        onMessage={(ev: { nativeEvent: { data: string } }) => {
          __DEV__ && onLogMessage(ev);
          const event = parseWebViewEvent(ev.nativeEvent.data);
          if (!event) {
            return;
          }
          switch (event.type) {
            case 'ready':
              // The page is fully initialised: replay current state in case
              // the onLoadEnd replay raced ahead of the reader globals.
              webViewReadyRef.current = true;
              pushReaderSettingsToWebView(readerSettingsRef.current);
              pushGeneralSettingsToWebView(generalSettingsRef.current);
              pushBatteryToWebView(lastKnownBatteryLevel);
              pushAdjacentChaptersToWebView(
                adjacentScriptReadyRef.current ||
                  adjacentChapterScriptRef.current,
              );
              break;
            case 'tts-queue': {
              const payload = event.data as
                | { queue?: unknown; startIndex?: unknown }
                | undefined;
              const queue = Array.isArray(payload?.queue)
                ? payload?.queue.filter(
                    (item): item is string =>
                      typeof item === 'string' && item.trim().length > 0,
                  )
                : [];
              const startIndex =
                typeof payload?.startIndex === 'number'
                  ? payload.startIndex
                  : 0;
              void loadAndPlay(
                queue,
                startIndex,
                {
                  novelName: novel?.name || 'Unknown',
                  chapterName: chapter.name,
                  coverUri: novel?.cover || undefined,
                },
                toNativeTtsSettings(readerSettingsRef.current.tts),
              );
              break;
            }
            case 'tts-command': {
              if (!event.data || typeof event.data !== 'object') {
                break;
              }
              const data = event.data as {
                command?: unknown;
                index?: unknown;
              };
              switch (data.command) {
                case 'next':
                case 'pause':
                case 'play':
                case 'previous':
                case 'replay':
                case 'stop':
                  runTtsCommand(data.command);
                  break;
                case 'seekTo':
                  if (typeof data.index === 'number') {
                    seekTts(data.index);
                  }
                  break;
              }
              break;
            }
            case 'hide':
              onPress();
              break;
            case 'refresh':
              refetch();
              break;
            case 'next':
              nextChapterScreenVisible.current = true;
              if (event.autoStartTTS) {
                autoStartTTSRef.current = true;
              }
              navigateChapter('NEXT');
              break;
            case 'prev':
              if (event.autoStartTTS) {
                autoStartTTSRef.current = true;
              }
              navigateChapter('PREV');
              break;
            case 'save':
              if (event.data && typeof event.data === 'number') {
                saveProgress(event.data);
              }
              break;
            case 'text-action':
              eventTextAction(event);
              break;
            case 'search-result':
              if (event.data && typeof event.data === 'object') {
                const data = event.data as {
                  query?: unknown;
                  current?: unknown;
                  total?: unknown;
                  renderedTotal?: unknown;
                  isTruncated?: unknown;
                };
                const query = typeof data.query === 'string' ? data.query : '';
                if (query !== searchTextRef.current.trim()) {
                  break;
                }
                const total = typeof data.total === 'number' ? data.total : 0;
                onSearchResult({
                  query,
                  current: typeof data.current === 'number' ? data.current : 0,
                  total,
                  renderedTotal:
                    typeof data.renderedTotal === 'number'
                      ? data.renderedTotal
                      : total,
                  isTruncated: data.isTruncated === true,
                });
              }
              break;
            case 'interaction':
              onUserInteraction();
              break;
          }
        }}
        source={source}
      />
      <Dialog.Root
        visible={replaceModalVisible}
        onDismiss={() => setReplaceModalVisible(false)}
      >
        <Dialog.Header>
          <Dialog.Title>{getString('common.replaceText')}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <TextInput
            label={getString('common.textToReplace')}
            value={selectedTextForReplace}
            editable={false}
            mode="outlined"
            style={styles.textInput}
            theme={{ colors: { background: theme.surface } }}
          />
          <TextInput
            label={getString('common.replaceWith')}
            value={replacementText}
            onChangeText={setReplacementText}
            autoCorrect={false}
            mode="outlined"
            style={styles.textInput}
            theme={{ colors: { background: theme.surface } }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Dialog.Action onPress={handleReplaceCancel}>
            {getString('common.cancel')}
          </Dialog.Action>
          <Dialog.Action onPress={handleReplaceSave}>
            {getString('common.save')}
          </Dialog.Action>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

const styles = StyleSheet.create({
  textInput: { marginBottom: 16 },
});

export default memo(WebViewReader);
