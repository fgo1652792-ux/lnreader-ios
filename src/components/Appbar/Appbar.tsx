import React from 'react';
import { I18nManager, StatusBar } from 'react-native';

import { Appbar as PaperAppbar } from 'react-native-paper';
import { getString } from '@i18n/translations';
import { ThemeColors } from '../../theme/types';

interface AppbarProps {
  title: string;
  handleGoBack?: () => void;
  theme: ThemeColors;
  mode?: 'small' | 'medium' | 'large' | 'center-aligned';
  children?: React.ReactNode;
}

const Appbar: React.FC<AppbarProps> = ({
  title,
  handleGoBack,
  theme,
  mode = 'large',
  children,
}) => (
  <PaperAppbar.Header
    style={{ backgroundColor: theme.surface }}
    statusBarHeight={StatusBar.currentHeight}
    mode={mode}
  >
    {handleGoBack && (
      <PaperAppbar.Action
        onPress={handleGoBack}
        /* Paper's BackAction hardcodes a physically-left arrow; use an
           explicit, RTL-aware icon instead. */
        icon={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
        accessibilityLabel={getString('common.back')}
        iconColor={theme.onSurface}
      />
    )}
    <PaperAppbar.Content
      title={title}
      titleStyle={{ color: theme.onSurface }}
    />
    {children}
  </PaperAppbar.Header>
);

export default Appbar;
