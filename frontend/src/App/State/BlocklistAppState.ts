import Blocklist from 'typings/Blocklist';
import AppSectionState, {
  AppSectionFilterState,
  PagedAppSectionState,
  TableAppSectionState,
} from './AppSectionState';

export type SeriesBlocklistAppState = AppSectionState<Blocklist>;

interface BlocklistAppState
  extends AppSectionState<Blocklist>,
    AppSectionFilterState<Blocklist>,
    PagedAppSectionState,
    TableAppSectionState {
  isRemoving: boolean;
}

export default BlocklistAppState;
