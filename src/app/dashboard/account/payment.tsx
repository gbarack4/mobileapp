import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentScreen } from '../../../components/account/payment-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function PaymentRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <PaymentScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
