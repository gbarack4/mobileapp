import { SafeAreaView } from 'react-native-safe-area-context';

import { InsuranceScreen } from '../../../components/account/insurance-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function InsuranceRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <InsuranceScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
