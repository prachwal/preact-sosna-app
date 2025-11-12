import { createContext, h } from 'preact';
import { useContext } from 'preact/hooks';
import type { Collection } from '../types/types';

interface AppContextType {
  selectedCollection: string;
  setSelectedCollection: (collection: string) => void;
  collections: Collection[];
  // Add other global state as needed
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: any;
  selectedCollection: string;
  setSelectedCollection: (collection: string) => void;
  collections: Collection[];
}

export function AppProvider({
  children,
  selectedCollection,
  setSelectedCollection,
  collections
}: AppProviderProps) {
  const value: AppContextType = {
    selectedCollection,
    setSelectedCollection,
    collections,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}