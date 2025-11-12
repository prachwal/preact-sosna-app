import type { Collection } from '../types/types';
import SearchComponent from './SearchComponent';

interface SearchTabProps {
  collections: Collection[];
  searchQuery: string;
  searchResults: any[];
  searching: boolean;
  searchOptions: any;
  selectedCollection: string;
  onSearchQueryChange: (query: string) => void;
  onSearchOptionsChange: (options: any) => void;
  onPerformSearch: () => void;
  onClearResults: () => void;
}

export default function SearchTab({
  collections,
  searchQuery,
  searchResults,
  searching,
  searchOptions,
  selectedCollection,
  onSearchQueryChange,
  onSearchOptionsChange,
  onPerformSearch,
  onClearResults,
}: SearchTabProps) {
  return (
    <SearchComponent
      collections={collections}
      searchQuery={searchQuery}
      searchResults={searchResults}
      searching={searching}
      searchOptions={searchOptions}
      selectedCollection={selectedCollection}
      onSearchQueryChange={onSearchQueryChange}
      onSearchOptionsChange={onSearchOptionsChange}
      onPerformSearch={onPerformSearch}
      onClearResults={onClearResults}
    />
  );
}