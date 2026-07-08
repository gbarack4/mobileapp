import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentsScreen } from '../../../components/account/documents-screen';
import { colors } from '../../../constants/theme';
import { goBackOr } from '../../../utils/navigation';

export default function DocumentsRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <DocumentsScreen onClose={() => goBackOr('/dashboard')} />
    </SafeAreaView>
  );
}
