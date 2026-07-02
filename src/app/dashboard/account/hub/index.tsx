import { SafeAreaView } from 'react-native-safe-area-context';

import { HubAccountScreen } from '../../../../components/account/hub-account-screen';
import { colors } from '../../../../constants/theme';
import { goBackOr } from '../../../../utils/navigation';

export default function HubAccountRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <HubAccountScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
