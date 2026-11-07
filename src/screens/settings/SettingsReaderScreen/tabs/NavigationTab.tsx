import React, { useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TextInput } from 'react-native-paper';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import defaultTo from 'lodash-es/defaultTo';
import { useTheme, useChapterGeneralSettings } from '@hooks/persisted';
import { getString } from '@i18n/translations';
import { List, Button } from '@components/index';
import SettingSwitch from '../../components/SettingSwitch';

/**
 * Debounced MMKV writer: numeric inputs used to commit on every keystroke,
 * which rewrote the whole settings blob (and re-created the auto-scroll
 * interval) several times per second while typing.
 */
const useDebouncedSetter = <T,>(
  setter: (value: T) => void,
  delay = 500,
): ((value: T) => void) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (value: T) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      setter(value);
    }, delay);
  };
};

const NavigationTab: React.FC = () => {
  const theme = useTheme();
  const {
    useVolumeButtons = false,
    volumeButtonsOffset = null,
    verticalSeekbar = true,
    swipeGestures = false,
    pageReader = false,
    pageReaderInvertVolumeButtons = false,
    pageReaderDisableAnimation = false,
    autoScroll = false,
    autoScrollInterval = 10,
    autoScrollOffset = null,
    tapToScroll = false,
    setChapterGeneralSettings,
  } = useChapterGeneralSettings();

  const { height: screenHeight } = useWindowDimensions();

  const debouncedVolumeOffset = useDebouncedSetter<number>(value =>
    setChapterGeneralSettings({ volumeButtonsOffset: value }),
  );
  const debouncedAutoScrollInterval = useDebouncedSetter<number>(value =>
    setChapterGeneralSettings({ autoScrollInterval: value }),
  );
  const debouncedAutoScrollOffset = useDebouncedSetter<number | null>(value =>
    setChapterGeneralSettings({ autoScrollOffset: value }),
  );

  const areAutoScrollSettingsDefault =
    autoScrollInterval === 10 && autoScrollOffset === null;

  return (
    <BottomSheetScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <List.SubHeader theme={theme}>
          {getString('readerSettings.navigationControls')}
        </List.SubHeader>
        <SettingSwitch
          label={getString('readerScreen.bottomSheet.volumeButtonsScroll')}
          description={getString(
            'readerScreen.bottomSheet.volumeButtonsScrollDescription',
          )}
          value={useVolumeButtons}
          onPress={() =>
            setChapterGeneralSettings({ useVolumeButtons: !useVolumeButtons })
          }
          theme={theme}
        />
        {useVolumeButtons && (
          <View style={styles.inputContainer}>
            <TextInput
              label={getString('readerSettings.volumeButtonOffset')}
              mode="outlined"
              keyboardType="numeric"
              defaultValue={defaultTo(
                volumeButtonsOffset
                  ? Math.round(volumeButtonsOffset / screenHeight)
                  : null,
                0.75,
              ).toString()}
              onChangeText={text => {
                if (!isNaN(Number(text)) && text !== '') {
                  debouncedVolumeOffset(
                    Math.round(Number(text) * screenHeight),
                  );
                }
              }}
              style={styles.textInput}
              theme={{ colors: { ...theme } }}
            />
          </View>
        )}
        <SettingSwitch
          label={getString('readerScreen.bottomSheet.verticalSeekbar')}
          description={getString(
            'readerScreen.bottomSheet.verticalSeekbarDescription',
          )}
          value={verticalSeekbar}
          onPress={() =>
            setChapterGeneralSettings({ verticalSeekbar: !verticalSeekbar })
          }
          theme={theme}
        />
        <SettingSwitch
          label={getString('readerScreen.bottomSheet.swipeGestures')}
          description={getString(
            'readerScreen.bottomSheet.swipeGesturesDescription',
          )}
          value={swipeGestures}
          onPress={() =>
            setChapterGeneralSettings({ swipeGestures: !swipeGestures })
          }
          theme={theme}
        />
        <SettingSwitch
          label={getString('readerScreen.bottomSheet.tapToScroll')}
          description={getString(
            'readerScreen.bottomSheet.tapToScrollDescription',
          )}
          value={tapToScroll}
          onPress={() =>
            setChapterGeneralSettings({ tapToScroll: !tapToScroll })
          }
          theme={theme}
        />
      </View>

      <View style={styles.section}>
        <List.SubHeader theme={theme}>
          {getString('readerSettings.readingMode')}
        </List.SubHeader>
        <SettingSwitch
          label={getString('readerScreen.bottomSheet.pageReader')}
          description={getString(
            'readerScreen.bottomSheet.pageReaderDescription',
          )}
          value={pageReader}
          onPress={() => setChapterGeneralSettings({ pageReader: !pageReader })}
          theme={theme}
        />
        {pageReader && (
          <>
            <SettingSwitch
              label={getString('readerScreen.bottomSheet.invertVolumeButtons')}
              description={getString(
                'readerScreen.bottomSheet.invertVolumeButtonsDescription',
              )}
              value={pageReaderInvertVolumeButtons}
              onPress={() =>
                setChapterGeneralSettings({
                  pageReaderInvertVolumeButtons: !pageReaderInvertVolumeButtons,
                })
              }
              theme={theme}
            />
            <SettingSwitch
              label={getString(
                'readerScreen.bottomSheet.disablePageTransitions',
              )}
              description={getString(
                'readerScreen.bottomSheet.disablePageTransitionsDescription',
              )}
              value={pageReaderDisableAnimation}
              onPress={() =>
                setChapterGeneralSettings({
                  pageReaderDisableAnimation: !pageReaderDisableAnimation,
                })
              }
              theme={theme}
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <List.SubHeader theme={theme}>
          {getString('readerScreen.bottomSheet.autoscroll')}
        </List.SubHeader>
        <SettingSwitch
          label={getString('readerScreen.bottomSheet.autoscroll')}
          description={getString(
            'readerScreen.bottomSheet.autoscrollDescription',
          )}
          value={autoScroll}
          onPress={() => setChapterGeneralSettings({ autoScroll: !autoScroll })}
          theme={theme}
        />
        {autoScroll && (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                label={getString('readerSettings.autoScrollInterval')}
                mode="outlined"
                keyboardType="numeric"
                defaultValue={defaultTo(autoScrollInterval, 10).toString()}
                onChangeText={text => {
                  const parsed = Number(text);
                  if (text !== '' && Number.isFinite(parsed) && parsed > 0) {
                    debouncedAutoScrollInterval(parsed);
                  }
                }}
                style={styles.textInput}
                theme={{ colors: { ...theme } }}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                label={getString('readerSettings.autoScrollOffset')}
                mode="outlined"
                keyboardType="numeric"
                defaultValue={defaultTo(
                  autoScrollOffset,
                  Math.round(screenHeight),
                ).toString()}
                onChangeText={text => {
                  const parsed = Number(text);
                  if (text !== '' && Number.isFinite(parsed) && parsed > 0) {
                    debouncedAutoScrollOffset(parsed);
                  } else if (text === '') {
                    debouncedAutoScrollOffset(null);
                  }
                }}
                style={styles.textInput}
                theme={{ colors: { ...theme } }}
              />
            </View>
            {!areAutoScrollSettingsDefault && (
              <View style={styles.buttonContainer}>
                <Button
                  style={styles.button}
                  title={getString('common.reset')}
                  onPress={() => {
                    // Single write: two separate writes in one tick used to
                    // clobber each other (lost update on the stale snapshot).
                    setChapterGeneralSettings({
                      autoScrollInterval: 10,
                      autoScrollOffset: null,
                    });
                  }}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </BottomSheetScrollView>
  );
};

export default NavigationTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    marginVertical: 8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 14,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  button: {
    marginVertical: 8,
  },
  bottomSpacing: {
    height: 24,
  },
});
