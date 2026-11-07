import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';

import { Dialog } from '@components';
import { ThemeColors } from '@theme/types';
import { getString } from '@i18n/translations';
import {
  contrastRatio,
  hexToHsl,
  hslToHex,
  isValidHex,
  normalizeHex,
  WCAG_AA_CONTRAST,
  type Hsl,
} from '@utils/colorUtils';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A single-channel gradient slider (hue / saturation / lightness).
 * Lightweight PanResponder implementation: no extra native dependency, and
 * it mirrors correctly under RTL by measuring in window coordinates.
 */
const GradientSlider: React.FC<{
  value: number; // 0..1
  colors: GradientColors;
  onChange: (value: number) => void;
  onCommit: () => void;
  accessibilityLabel: string;
  theme: ThemeColors;
}> = ({ value, colors, onChange, onCommit, accessibilityLabel, theme }) => {
  const trackRef = useRef<View>(null);
  const trackLayout = useRef({ x: 0, width: 1 });

  const updateFromTouch = (pageX: number) => {
    const { x, width } = trackLayout.current;
    onChange(clamp01((pageX - x) / Math.max(1, width)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => updateFromTouch(e.nativeEvent.pageX),
      onPanResponderMove: e => updateFromTouch(e.nativeEvent.pageX),
      onPanResponderRelease: () => onCommit(),
      onPanResponderTerminate: () => onCommit(),
    }),
  ).current;

  // RTL mirrors the physical track; the thumb mirrors with it.
  const thumbFraction = I18nManager.isRTL ? 1 - value : value;

  return (
    <View style={styles.sliderRow}>
      <View
        ref={trackRef}
        style={styles.sliderTrackWrapper}
        onLayout={() =>
          trackRef.current?.measureInWindow((x, _y, width) => {
            trackLayout.current = { x, width: width || 1 };
          })
        }
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(value * 100),
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sliderTrack}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${thumbFraction * 100}%`,
            },
          ]}
          pointerEvents="none"
        />
      </View>
      <Text style={[styles.sliderValue, { color: theme.onSurfaceVariant }]}>
        {Math.round(value * 100)}
      </Text>
    </View>
  );
};

type ReaderColorPickerModalProps = {
  visible: boolean;
  title: string;
  /** The color currently stored for the edited channel. */
  color: string;
  /** The other channel's current color, for the live preview pair. */
  otherColor: string;
  /** Which channel is being edited (drives the preview pair). */
  editedChannel: 'background' | 'text';
  /** Single-color presets shown as swatches. */
  presets: string[];
  theme: ThemeColors;
  onConfirm: (hex: string) => void;
  /** Reset to the app default for this channel. */
  onReset: () => void;
  onDismiss: () => void;
};

/**
 * Interactive reader color picker: HSL sliders, reading presets, a live
 * background/text preview with a WCAG contrast check, and an optional hex
 * field. Replaces the hex-only modal whose stale state reverted user colors.
 */
const ReaderColorPickerModal: React.FC<ReaderColorPickerModalProps> = ({
  visible,
  title,
  color,
  otherColor,
  editedChannel,
  presets,
  theme,
  onConfirm,
  onReset,
  onDismiss,
}) => {
  // Derived from props on every open: no stale state between openings.
  const [hsl, setHsl] = useState<Hsl>(() => hexToHsl(color) ?? { h: 0, s: 0, l: 100 });
  const [hexInput, setHexInput] = useState(color);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setHsl(hexToHsl(color) ?? { h: 0, s: 0, l: 100 });
      setHexInput(color);
      setError(null);
    }
  }, [visible, color]);

  const previewHex = useMemo(() => hslToHex(hsl), [hsl]);
  const previewBackground = editedChannel === 'background' ? previewHex : otherColor;
  const previewText = editedChannel === 'text' ? previewHex : otherColor;
  const contrast = contrastRatio(previewBackground, previewText);
  const lowContrast = contrast < WCAG_AA_CONTRAST;

  const applyHsl = (next: Hsl) => {
    setHsl(next);
    const hex = hslToHex(next);
    setHexInput(hex);
    setError(null);
  };

  const submitHex = () => {
    const normalized = normalizeHex(hexInput.trim());
    if (!normalized) {
      setError(getString('common.invalidHexColor'));
      return;
    }
    onConfirm(normalized);
  };

  return (
    <Dialog.Root visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.ScrollArea>
        {/* Live preview of the resulting background/text pair */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
            {getString('colorPicker.preview')}
          </Text>
          <View
            style={[styles.preview, { backgroundColor: previewBackground }]}
            accessibilityLabel={`${getString('colorPicker.preview')}: ${getString('colorPicker.contrast')} ${contrast.toFixed(1)}`}
          >
            <Text style={[styles.previewText, { color: previewText }]}>
              Aa  أهلاً بكم في المعاينة
            </Text>
          </View>
          <View style={styles.contrastRow}>
            <Text
              style={[
                styles.contrastValue,
                { color: lowContrast ? '#D84315' : theme.primary },
              ]}
            >
              {getString('colorPicker.contrast')}: {contrast.toFixed(1)}:1
            </Text>
            {lowContrast ? (
              <Text style={[styles.contrastWarning, { color: '#D84315' }]}>
                {getString('colorPicker.contrastLowWarning')}
              </Text>
            ) : (
              <Text style={[styles.contrastWarning, { color: theme.primary }]}>
                {getString('colorPicker.contrastGood')}
              </Text>
            )}
          </View>
        </View>

        {/* HSL sliders */}
        <View style={styles.section}>
          <GradientSlider
            value={hsl.h / 360}
            colors={HUE_GRADIENT as GradientColors}
            onChange={v => setHsl({ ...hsl, h: Math.round(v * 360) })}
            onCommit={() => applyHsl(hsl)}
            accessibilityLabel={getString('colorPicker.hue')}
            theme={theme}
          />
          <GradientSlider
            value={hsl.s / 100}
            colors={[
              hslToHex({ ...hsl, s: 0 }),
              hslToHex({ ...hsl, s: 100 }),
            ] as GradientColors}
            onChange={v => setHsl({ ...hsl, s: Math.round(v * 100) })}
            onCommit={() => applyHsl(hsl)}
            accessibilityLabel={getString('colorPicker.saturation')}
            theme={theme}
          />
          <GradientSlider
            value={hsl.l / 100}
            colors={[
              '#000000',
              hslToHex({ ...hsl, l: 50 }),
              '#FFFFFF',
            ] as GradientColors}
            onChange={v => setHsl({ ...hsl, l: Math.round(v * 100) })}
            onCommit={() => applyHsl(hsl)}
            accessibilityLabel={getString('colorPicker.lightness')}
            theme={theme}
          />
        </View>

        {/* Presets */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
            {getString('colorPicker.readerPresets')}
          </Text>
          <View style={styles.presetGrid}>
            {presets.map(preset => (
              <Pressable
                key={preset}
                style={[
                  styles.presetSwatch,
                  { backgroundColor: preset },
                  previewHex.toLowerCase() === preset.toLowerCase() &&
                    styles.presetSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={preset}
                onPress={() => applyHsl(hexToHsl(preset) ?? hsl)}
              />
            ))}
          </View>
        </View>

        {/* Hex input */}
        <TextInput
          value={hexInput}
          onChangeText={text => {
            setHexInput(text);
            const normalized = normalizeHex(text.trim());
            if (normalized) {
              setHsl(hexToHsl(normalized) ?? hsl);
              setError(null);
            } else if (isValidHex(text.trim()) === false && text.trim()) {
              setError(getString('common.invalidHexColor'));
            }
          }}
          onSubmitEditing={submitHex}
          placeholder={getString('common.hexColorPlaceholder')}
          mode="outlined"
          dense
          error={Boolean(error)}
          theme={{ colors: { ...theme } }}
          style={styles.hexInput}
        />
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Dialog.Action title={getString('common.reset')} onPress={onReset} />
        <Dialog.Action title={getString('common.cancel')} onPress={onDismiss} />
        <Dialog.Action title={getString('common.save')} onPress={submitHex} />
      </Dialog.Actions>
    </Dialog.Root>
  );
};

const HUE_GRADIENT = [
  '#FF0000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#FF00FF',
  '#FF0000',
] as const;

type GradientColors = readonly [string, string, ...string[]];

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  sectionLabel: { fontSize: 13, marginBottom: 6 },
  preview: {
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  previewText: { fontSize: 17, lineHeight: 26 },
  contrastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  contrastValue: { fontSize: 13, fontWeight: '600' },
  contrastWarning: { fontSize: 12, flexShrink: 1 },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  sliderTrackWrapper: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 20,
    borderRadius: 10,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  sliderValue: {
    width: 34,
    textAlign: 'center',
    fontSize: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.5)',
  },
  presetSelected: {
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  hexInput: { marginTop: 12 },
  errorText: { color: '#FF0033', fontSize: 12, marginTop: 4 },
});

export default ReaderColorPickerModal;
