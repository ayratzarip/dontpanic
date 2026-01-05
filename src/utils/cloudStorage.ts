import WebApp from '@twa-dev/sdk';
import type { Entry } from '../types';

const ENTRIES_KEY = 'journal_entries';

/**
 * Check if Telegram Cloud Storage is available
 */
export function isCloudStorageAvailable(): boolean {
  try {
    return WebApp.isVersionAtLeast('6.9') && !!WebApp.CloudStorage;
  } catch {
    return false;
  }
}

/**
 * Get all entries from Cloud Storage
 */
export async function getEntries(): Promise<Entry[]> {
  if (!isCloudStorageAvailable()) {
    // Fallback to localStorage for development
    const stored = localStorage.getItem(ENTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  return new Promise((resolve) => {
    WebApp.CloudStorage.getItem(ENTRIES_KEY, (error, value) => {
      if (error || !value) {
        resolve([]);
        return;
      }
      try {
        resolve(JSON.parse(value));
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Save entries to Cloud Storage
 */
export async function saveEntries(entries: Entry[]): Promise<void> {
  const data = JSON.stringify(entries);
  
  if (!isCloudStorageAvailable()) {
    // Fallback to localStorage for development
    localStorage.setItem(ENTRIES_KEY, data);
    return;
  }

  return new Promise((resolve, reject) => {
    WebApp.CloudStorage.setItem(ENTRIES_KEY, data, (error, success) => {
      if (error || !success) {
        reject(new Error('Failed to save entries'));
        return;
      }
      resolve();
    });
  });
}

/**
 * Add a new entry
 */
export async function addEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entry> {
  const entries = await getEntries();
  
  const newEntry: Entry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  entries.unshift(newEntry);
  await saveEntries(entries);
  
  return newEntry;
}

/**
 * Delete an entry by id
 */
export async function deleteEntry(id: string): Promise<void> {
  const entries = await getEntries();
  const filtered = entries.filter(e => e.id !== id);
  await saveEntries(filtered);
}

/**
 * Update an entry
 */
export async function updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null> {
  const entries = await getEntries();
  const index = entries.findIndex(e => e.id === id);
  
  if (index === -1) {
    return null;
  }
  
  entries[index] = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await saveEntries(entries);
  return entries[index];
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a title from location text
 */
export function generateTitle(location: string): string {
  if (!location) return 'Новая запись';

  // Take first 50 characters or up to first line break
  const firstLine = location.split('\n')[0];
  if (firstLine.length <= 50) return firstLine;

  return firstLine.substring(0, 47) + '...';
}

/**
 * Get emoji based on text sentiment (simplified version)
 */
export function getEmoji(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('справ') || lowerText.includes('контрол') || lowerText.includes('смог')) {
    return '😊';
  }
  if (lowerText.includes('страх') || lowerText.includes('боюсь') || lowerText.includes('пани')) {
    return '😨';
  }
  if (lowerText.includes('тревог') || lowerText.includes('беспоко') || lowerText.includes('волну') || lowerText.includes('игра') || lowerText.includes('сыгра')) {
    return '😰';
  }
  if (lowerText.includes('стыд') || lowerText.includes('вин') || lowerText.includes('сожале')) {
    return '😢';
  }
  if (lowerText.includes('злость') || lowerText.includes('раздраж') || lowerText.includes('бесит')) {
    return '😤';
  }
  if (lowerText.includes('устал') || lowerText.includes('скуч') || lowerText.includes('апати') || lowerText.includes('долг')) {
    return '😔';
  }
  if (lowerText.includes('думаю') || lowerText.includes('размышл') || lowerText.includes('хоч')) {
    return '🤔';
  }

  return '😌';
}

/**
 * Extract tags from text
 */
export function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  const tagMap: Record<string, string> = {
    'казино': 'Казино',
    'ставк': 'Ставки',
    'игр': 'Желание играть',
    'сыгра': 'Желание играть',
    'выигр': 'Выигрыш',
    'проигр': 'Проигрыш',
    'долг': 'Долги',
    'денег': 'Деньги',
    'займ': 'Долги',
    'стыд': 'Стыд',
    'вин': 'Вина',
    'тревог': 'Тревога',
    'беспоко': 'Тревога',
    'страх': 'Страх',
    'семь': 'Семья',
    'жен': 'Семья',
    'муж': 'Семья',
    'одиноч': 'Одиночество',
    'скуч': 'Скука',
    'устал': 'Усталость',
    'стресс': 'Стресс',
    'работ': 'Работа',
    'дом': 'Дома',
    'улиц': 'На улице',
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lowerText.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 3); // Max 3 tags
}

