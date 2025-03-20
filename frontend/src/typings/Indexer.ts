import Provider from './Provider';

interface Indexer extends Provider {
  enableRss: boolean;
  enableAutomaticSearch: boolean;
  enableInteractiveSearch: boolean;
  seasonSearchMaximumSingleEpisodeAge: number;
  protocol: string;
  priority: number;
  tags: number[];
}

export default Indexer;
