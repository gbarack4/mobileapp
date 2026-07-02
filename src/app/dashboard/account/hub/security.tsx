import { SafeAreaView } from 'react-native-safe-area-context';

import { HubSecurityScreen } from '../../../../components/account/hub-settings-screen';
import { colors } from '../../../../constants/theme';
import { goBackOr } from '../../../../utils/navigation';

export default function HubSecurityRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <HubSecurityScreen onBack={() => goBackOr('/dashboard/account/hub')} />
    </SafeAreaView>
  );
}
