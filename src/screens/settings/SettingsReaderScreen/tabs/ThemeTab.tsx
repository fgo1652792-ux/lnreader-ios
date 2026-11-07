import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme, useChapterReaderSettings } from '@hooks/persisted';
import { getString } from '@i18n/translations';
import { List, ColorPreferenceItem, Button } from '@components/index';
import { useBoolean } from '@hooks';
import { Portal } from 'react-native-paper';
import ReaderColorPickerModal from '@components/ColorPickerModal/ReaderColorPickerModal';
import { initialChapterReaderSettings } from '@hooks/persisted/useSettings';
import ReaderThemeSelector from '@screens/reader/components/ReaderBottomSheet/ReaderThemeSelector';
import { presetReaderThemes } from '@utils/constants/readerConstants';

/** Comfortable single-color presets for each channel. */
const BACKGROUND_PRESETS = [
  '#FFFFFF',
  '#F5F5FA',
  '#F7DFC6',
  '#DCE5E2',
  '#E8E6E3',
  '#CCE8CF',
  '#292832',
  '#1C1C1E',
  '#161B22',
  '#000000',
];

const TEXT_PRESETS = [
  '#111111',
  '#2C2C2C',
  '#4A3B2A',
  '#37474F',
  '#593100',
  '#8D6E63',
  '#CCCCCC',
  '#B0BEC5',
  '#9E9E9E',
  '#FFFFFF',
];

const ThemeTab: React.FC = () => {
  const theme = useTheme();
  const readerSettings = useChapterReaderSettings();
  const readerBackgroundModal = useBoolean();
  const readerTextColorModal = useBoolean();

  const labelStyle = [styles.label, { color: theme.onSurface }];

  const isCurrentThemeCustom = readerSettings.customThemes.some(
    item =>
      item.backgroundColor === readerSettings.theme &&
      item.textColor === readerSettings.textColor,
  );

  const isCurrentThemePreset = presetReaderThemes.some(
    item =>
      item.backgroundColor === readerSettings.theme &&
      item.textColor === readerSettings.textColor,
  );

  return (
    <>
      <BottomSheetScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <List.SubHeader theme={theme}>
            {getString('readerSettings.preset')}
          </List.SubHeader>
          <ReaderThemeSelector
            label={getString('readerSettings.preset')}
            labelStyle={labelStyle}
          />
        </View>

        <View style={styles.section}>
          <List.SubHeader theme={theme}>
            {getString('readerSettings.customColors')}
          </List.SubHeader>
          <ColorPreferenceItem
            label={getString('readerSettings.backgroundColor')}
            description={readerSettings.theme}
            onPress={readerBackgroundModal.setTrue}
            theme={theme}
          />
          <ColorPreferenceItem
            label={getString('readerSettings.textColor')}
            description={readerSettings.textColor}
            onPress={readerTextColorModal.setTrue}
            theme={theme}
          />
        </View>

        {isCurrentThemeCustom ? (
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              title={getString('readerSettings.deleteCustomTheme')}
              onPress={() =>
                readerSettings.deleteCustomReaderTheme({
                  backgroundColor: readerSettings.theme,
                  textColor: readerSettings.textColor,
                })
              }
            />
          </View>
        ) : !isCurrentThemePreset ? (
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              title={getString('readerSettings.saveCustomTheme')}
              onPress={() =>
                readerSettings.saveCustomReaderTheme({
                  backgroundColor: readerSettings.theme,
                  textColor: readerSettings.textColor,
                })
              }
            />
          </View>
        ) : null}

        <View style={styles.bottomSpacing} />
      </BottomSheetScrollView>

      <Portal>
        <ReaderColorPickerModal
          title={getString('readerSettings.backgroundColor')}
          visible={readerBackgroundModal.value}
          color={readerSettings.theme}
          otherColor={readerSettings.textColor}
          editedChannel="background"
          presets={BACKGROUND_PRESETS}
          theme={theme}
          onConfirm={hex =>
            readerSettings.setChapterReaderSettings({ theme: hex })
          }
          onReset={() =>
            readerSettings.setChapterReaderSettings({
              theme: initialChapterReaderSettings.theme,
            })
          }
          onDismiss={readerBackgroundModal.setFalse}
        />
        <ReaderColorPickerModal
          title={getString('readerSettings.textColor')}
          visible={readerTextColorModal.value}
          color={readerSettings.textColor}
          otherColor={readerSettings.theme}
          editedChannel="text"
          presets={TEXT_PRESETS}
          theme={theme}
          onConfirm={hex =>
            readerSettings.setChapterReaderSettings({ textColor: hex })
          }
          onReset={() =>
            readerSettings.setChapterReaderSettings({
              textColor: initialChapterReaderSettings.textColor,
            })
          }
          onDismiss={readerTextColorModal.setFalse}
        />
      </Portal>
    </>
  );
};

export default ThemeTab;

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
  label: {
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  button: {
    marginVertical: 8,
  },
  bottomSpacing: {
    height: 24,
  },
});
