import { useTheme } from '@/components/theme/ThemeProvider';
import { colors } from '@/utils/colors';

export const useThemeColors = () => {
  const { actualTheme } = useTheme();

  const getColor = (lightColor: string, darkColor?: string) => {
    return actualTheme === 'dark' ? darkColor || lightColor : lightColor;
  };

  const statusColors = {
    success: getColor(colors.success[500], colors.success[400]),
    warning: getColor(colors.warning[500], colors.warning[400]),
    error: getColor(colors.error[500], colors.error[400]),
    info: getColor(colors.info[500], colors.info[400]),
  };

  const backgroundColors = {
    primary: getColor('#ffffff', '#1f2937'),
    secondary: getColor('#f9fafb', '#111827'),
    muted: getColor('#f3f4f6', '#374151'),
  };

  const textColors = {
    primary: getColor('#111827', '#f9fafb'),
    secondary: getColor('#6b7280', '#9ca3af'),
    muted: getColor('#9ca3af', '#6b7280'),
  };

  return {
    getColor,
    statusColors,
    backgroundColors,
    textColors,
    isDark: actualTheme === 'dark',
  };
};
