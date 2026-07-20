import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarSettingsScreen } from '../../../components/account/calendar-settings-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function CalendarSettingsRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <CalendarSettingsScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
