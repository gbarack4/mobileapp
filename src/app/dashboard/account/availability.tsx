import { SafeAreaView } from 'react-native-safe-area-context';

import { AvailabilityScreen } from '../../../components/account/availability-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function AvailabilityRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <AvailabilityScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
