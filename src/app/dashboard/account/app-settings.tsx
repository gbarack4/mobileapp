import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSettingsScreen } from '../../../components/account/app-settings-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function AppSettingsRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <AppSettingsScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
