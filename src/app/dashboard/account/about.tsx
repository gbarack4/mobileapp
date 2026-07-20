import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutScreen } from '../../../components/account/about-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function AboutRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <AboutScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
