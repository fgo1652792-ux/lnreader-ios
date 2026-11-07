import React, { RefObject, useCallback, useMemo, useRef } from 'react';
import {
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackHandler } from '@hooks/index';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import BottomSheetBackdrop from './BottomSheetBackdrop';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@hooks/persisted';
import { getBottomSheetLayout, normalizeBottomSheetSnapPoints } from './layout';

/**
 * Height (px) occupied by the themed grab handle rendered by this wrapper:
 * a 4px bar with an 8px marginBottom. Sheets whose content is sized from
 * their snap points (e.g. the reader sheet) must subtract this so their
 * content fits inside the remaining sheet area.
 */
export const BOTTOM_SHEET_HANDLE_HEIGHT = 12;

/**
 * Themed grab handle: without it the sheet's drag affordance is invisible
 * and hard to discover on iOS. The whole sheet body remains draggable.
 */
const SheetHandle: React.FC = () => {
  const theme = useTheme();
  return (
    <View
      style={[styles.handle, { backgroundColor: theme.outlineVariant }]}
    />
  );
};

interface BottomSheetProps
  extends Omit<
    BottomSheetModalProps,
    | 'backgroundComponent'
    | 'backgroundStyle'
    | 'backdropComponent'
    | 'bottomInset'
    | 'containerStyle'
    | 'enableDynamicSizing'
    | 'enableOverDrag'
    | 'enablePanDownToClose'
    | 'handleComponent'
    | 'handleIndicatorStyle'
    | 'handleStyle'
    | 'onChange'
    | 'ref'
    | 'snapPoints'
    | 'style'
    | 'topInset'
  > {
  bottomSheetRef: RefObject<BottomSheetModalMethods | null>;
  onChange?: (index: number) => void;
  snapPoints?: number[];
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  bottomSheetRef,
  children,
  onChange,
  snapPoints,
  ...otherProps
}) => {
  const indexRef = useRef<number>(null);
  const { bottom, top } = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const theme = useTheme();
  const { horizontalInset, maxHeight, topMargin } = getBottomSheetLayout({
    bottom,
    height,
    top,
    width,
  });
  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...backdropProps} />
    ),
    [],
  );
  useBackHandler(() => {
    if (typeof indexRef.current === 'number' && indexRef.current !== -1) {
      bottomSheetRef?.current?.close();
      return true;
    }
    return false;
  });

  const safeSnapPoints = useMemo(() => {
    return normalizeBottomSheetSnapPoints(snapPoints, maxHeight);
  }, [maxHeight, snapPoints]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      backdropComponent={renderBackdrop}
      handleComponent={SheetHandle}
      backgroundStyle={[
        styles.modal,
        {
          backgroundColor: theme.surfaceContainerLow ?? theme.surface,
        },
      ]}
      containerStyle={{
        paddingBottom: bottom,
        paddingHorizontal: horizontalInset,
      }}
      onChange={index => {
        onChange?.(index);
        indexRef.current = index;
      }}
      enableDynamicSizing={false}
      enableOverDrag={false}
      enablePanDownToClose
      topInset={top + topMargin}
      snapPoints={safeSnapPoints}
      {...otherProps}
    >
      {children}
    </BottomSheetModal>
  );
};

export default React.memo(BottomSheet);

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginBottom: 8,
    width: 40,
  },
  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
