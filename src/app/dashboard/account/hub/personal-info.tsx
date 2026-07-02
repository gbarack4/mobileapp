import { SafeAreaView } from 'react-native-safe-area-context';

import { HubPersonalInfoScreen } from '../../../../components/account/hub-settings-screen';
import { colors } from '../../../../constants/theme';
import { goBackOr } from '../../../../utils/navigation';

export default function HubPersonalInfoRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <HubPersonalInfoScreen onBack={() => goBackOr('/dashboard/account/hub')} />
    </SafeAreaView>
  );
}
