import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectWorkLocationsScreen } from '../../../components/account/select-work-locations-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function WorkLocationsRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <SelectWorkLocationsScreen onClose={() => goBackOr('/dashboard/account/availability')} />
    </SafeAreaView>
  );
}
