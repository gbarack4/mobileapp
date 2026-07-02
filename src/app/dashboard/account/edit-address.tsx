import { SafeAreaView } from 'react-native-safe-area-context';

import { EditAddressScreen } from '../../../components/account/edit-address-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function EditAddressRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <EditAddressScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
