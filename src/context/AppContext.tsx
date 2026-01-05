import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Entry, NewEntry, Theme, AppContextType } from '../types';
import { INITIAL_ENTRY } from '../types';
import {
  getEntries,
  addEntry,
  deleteEntry as deleteStorageEntry,
  updateEntry as updateStorageEntry,
  generateTitle,
  getEmoji,
  extractTags
} from '../utils/cloudStorage';
import { getTelegramTheme, initTelegram, hapticFeedback } from '../utils/telegram';

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<NewEntry>(INITIAL_ENTRY);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Initialize Telegram WebApp and load entries
  useEffect(() => {
    initTelegram();
    setTheme(getTelegramTheme());
    loadEntries();

    // Listen for theme changes
    const handleThemeChange = () => {
      setTheme(getTelegramTheme());
    };

    // Telegram dispatches themeChanged event
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await getEntries();
      setEntries(loaded);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCurrentEntry = useCallback(<K extends keyof NewEntry>(key: K, value: NewEntry[K]) => {
    setCurrentEntry(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveEntry = useCallback(async () => {
    try {
      const combinedText = `${currentEntry.location} ${currentEntry.thoughts} ${currentEntry.trigger} ${currentEntry.circumstances}`;

      const newEntry = await addEntry({
        ...currentEntry,
        title: generateTitle(currentEntry.location),
        emoji: getEmoji(combinedText),
        tags: extractTags(combinedText),
      });

      setEntries(prev => [newEntry, ...prev]);
      setCurrentEntry(INITIAL_ENTRY);
      hapticFeedback('success');
    } catch (error) {
      console.error('Failed to save entry:', error);
      hapticFeedback('error');
      throw error;
    }
  }, [currentEntry]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await deleteStorageEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      hapticFeedback('success');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      hapticFeedback('error');
      throw error;
    }
  }, []);

  const resetCurrentEntry = useCallback(() => {
    setCurrentEntry(INITIAL_ENTRY);
    setEditingEntryId(null);
  }, []);

  const loadEntryForEditing = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setCurrentEntry({
        location: entry.location,
        witnesses: entry.witnesses,
        circumstances: entry.circumstances,
        trigger: entry.trigger,
        thoughts: entry.thoughts,
        bodyFeelings: entry.bodyFeelings,
        actions: entry.actions,
      });
      setEditingEntryId(id);
    }
  }, [entries]);

  const updateExistingEntry = useCallback(async (newCreatedAt?: string) => {
    if (!editingEntryId) {
      throw new Error('No entry is being edited');
    }

    try {
      const combinedText = `${currentEntry.location} ${currentEntry.thoughts} ${currentEntry.trigger} ${currentEntry.circumstances}`;

      const updateData: Partial<Entry> = {
        ...currentEntry,
        title: generateTitle(currentEntry.location),
        emoji: getEmoji(combinedText),
        tags: extractTags(combinedText),
      };

      if (newCreatedAt) {
        updateData.createdAt = newCreatedAt;
      }

      const updated = await updateStorageEntry(editingEntryId, updateData);

      if (updated) {
        setEntries(prev => prev.map(e => e.id === editingEntryId ? updated : e));
        setCurrentEntry(INITIAL_ENTRY);
        setEditingEntryId(null);
        hapticFeedback('success');
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      hapticFeedback('error');
      throw error;
    }
  }, [editingEntryId, currentEntry]);

  const value: AppContextType = {
    entries,
    currentEntry,
    isLoading,
    theme,
    editingEntryId,
    setCurrentEntry,
    updateCurrentEntry,
    saveEntry,
    deleteEntry,
    loadEntries,
    resetCurrentEntry,
    loadEntryForEditing,
    updateExistingEntry,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

