import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { hapticFeedback, showConfirm, showAlert, hideBackButton } from '../utils/telegram';
import type { Entry } from '../types';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (entryDate.getTime() === today.getTime()) {
    return 'Сегодня';
  }
  if (entryDate.getTime() === yesterday.getTime()) {
    return 'Вчера';
  }
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}


interface GroupedEntries {
  date: string;
  entries: Entry[];
}

export default function Home() {
  const { entries, isLoading, deleteEntry } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Hide back button on home page
  useEffect(() => {
    hideBackButton();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      entry.location.toLowerCase().includes(query) ||
      entry.thoughts.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  const groupedEntries = useMemo((): GroupedEntries[] => {
    const groups: Record<string, Entry[]> = {};
    
    filteredEntries.forEach(entry => {
      const dateKey = formatDate(entry.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return Object.entries(groups).map(([date, entries]) => ({ date, entries }));
  }, [filteredEntries]);

  const handleNewEntry = () => {
    hapticFeedback('light');
    navigate('/situation');
  };

  const handleOpenInstructions = () => {
    hapticFeedback('light');
    navigate('/instructions');
  };

  const handleOpenEntry = (id: string) => {
    hapticFeedback('light');
    navigate(`/entry/${id}`);
  };

  const handleDeleteEntry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    hapticFeedback('medium');

    const confirmed = await showConfirm('Удалить эту запись?');
    if (confirmed) {
      await deleteEntry(id);
    }
  };

  const formatEntryForAI = (entry: Entry, index: number): string => {
    return `Запись #${index + 1} (${formatDate(entry.createdAt)})
Название: ${entry.title || 'Без названия'}

1. Местоположение:
${entry.location || 'Не указано'}

2. Окружение:
${entry.witnesses || 'Не указано'}

3. Обстановка и контекст:
${entry.circumstances || 'Не указано'}

4. Пусковой механизм (Триггер):
${entry.trigger || 'Не указано'}

5. Мысли:
${entry.thoughts || 'Не указано'}

6. Телесные ощущения:
${entry.bodyFeelings || 'Не указано'}

7. Действия:
${entry.actions || 'Не указано'}

${entry.tags.length > 0 ? `Теги: ${entry.tags.join(', ')}` : ''}
---
`;
  };

  const handleCopyToAI = async () => {
    if (entries.length === 0) {
      await showAlert('У вас пока нет записей для анализа');
      return;
    }

    hapticFeedback('light');

    const prompt = `Ты - опытный психотерапевт, специализирующийся на работе с зависимым поведением, помогающий пациенту с патологическим влечением к азартным играм. Пациент ведет дневник самонаблюдения в приложении "AntiBet" для отслеживания мыслей о игре и самокритики. Результаты анализа будут использованы на сеансах психотерапии.

Твои задачи:
1. Выяви триггеры и паттерны, которые провоцируют мысли об азартных играх.
2. Определи связь между обстоятельствами, эмоциональным состоянием и желанием играть.
3. Проанализируй, какие защитные механизмы использует пациент (отвлечение, запрет себе думать и т.д.).
4. Оцени динамику: становится ли пациенту легче справляться с влечением со временем.
5. Предложи рекомендации для терапевта и пациента.

Анализируй следующие записи из дневника:

${entries.map((entry, index) => formatEntryForAI(entry, index)).join('\n')}

Пожалуйста, предоставь структурированный анализ согласно пунктам выше. Будь тактичен и профессионален.`;

    try {
      await navigator.clipboard.writeText(prompt);
      hapticFeedback('success');
      await showAlert('Запрос скопирован в буфер обмена! Вставьте его в чат с AI.');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      hapticFeedback('error');
      await showAlert('Не удалось скопировать. Попробуйте еще раз.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-pulse text-text-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Header */}
      <header className="flex-none pt-2 pb-2 px-4 z-20 bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AntiBet
          </h1>
          <button 
            onClick={handleOpenInstructions}
            className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors text-slate-900 dark:text-white"
          >
            <span className="material-symbols-outlined text-[28px]">help</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mt-1 mb-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full h-11 pl-10 pr-4 text-base rounded-lg border-none bg-slate-200 dark:bg-surface-dark placeholder-text-secondary text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="Поиск по записям..."
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="flex items-center justify-center size-20 rounded-full bg-slate-200 dark:bg-surface-dark mb-4">
              <span className="material-symbols-outlined text-[40px] text-slate-400 dark:text-slate-500">edit_note</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Дневник пока пуст
            </h2>
            <p className="text-text-secondary max-w-xs">
              Начните вести наблюдения, чтобы лучше понимать своё состояние
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="flex items-center justify-center size-20 rounded-full bg-slate-200 dark:bg-surface-dark mb-4">
              <span className="material-symbols-outlined text-[40px] text-slate-400 dark:text-slate-500">search_off</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Ничего не найдено
            </h2>
            <p className="text-text-secondary max-w-xs">
              Попробуйте изменить поисковый запрос
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {groupedEntries.map(group => (
              <div key={group.date}>
                {/* Date Divider */}
                <div className="flex items-center py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {group.date}
                  </span>
                </div>
                
                {/* Entries */}
                {group.entries.map(entry => (
                  <article
                    key={entry.id}
                    onClick={() => handleOpenEntry(entry.id)}
                    className="relative group active:scale-[0.98] transition-transform duration-100 mb-3 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-transparent">
                      {/* Content */}
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate pr-2">
                            {entry.title}
                          </h3>
                          <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                            {formatTime(entry.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                          {entry.location}
                        </p>
                        
                        {/* Tags */}
                        {entry.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.tags.map(tag => (
                              <span 
                                key={tag}
                                className="inline-flex items-center rounded-md bg-slate-100 dark:bg-surface-dark-alt px-2 py-1 text-xs font-medium text-slate-600 dark:text-text-secondary ring-1 ring-inset ring-gray-500/10"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => handleDeleteEntry(e, entry.id)}
                        className="flex items-center justify-center text-text-secondary hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
            
            {/* Bottom Spacer */}
            <div className="h-20" />
          </div>
        )}
      </main>

      {/* Floating Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pt-12 pb-6 z-30">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
          <button
            onClick={handleNewEntry}
            className="h-12 w-full rounded-xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Новая запись
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          {entries.length > 0 && (
            <button
              onClick={handleCopyToAI}
              className="h-12 w-full rounded-xl bg-slate-200 dark:bg-surface-dark text-slate-900 dark:text-white font-semibold text-base hover:bg-slate-300 dark:hover:bg-surface-dark-alt transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Скопировать для AI
              <span className="material-symbols-outlined text-[20px]">content_copy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

