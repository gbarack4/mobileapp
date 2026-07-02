import { SafeAreaView } from 'react-native-safe-area-context';

import { VehiclesScreen } from '../../../components/account/vehicles-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function VehiclesRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <VehiclesScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
