import { SafeAreaView } from 'react-native-safe-area-context';

import { HubPrivacyDataScreen } from '../../../../components/account/hub-settings-screen';
import { colors } from '../../../../constants/theme';
import { goBackOr } from '../../../../utils/navigation';

export default function HubPrivacyDataRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <HubPrivacyDataScreen onBack={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
