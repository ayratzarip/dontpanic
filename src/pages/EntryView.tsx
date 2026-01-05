import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { setupBackButton, hapticFeedback, showConfirm } from '../utils/telegram';

export default function EntryView() {
  const { id } = useParams<{ id: string }>();
  const { entries, currentEntry, updateCurrentEntry, loadEntryForEditing, updateExistingEntry, resetCurrentEntry, editingEntryId } = useApp();
  const navigate = useNavigate();
  const [hasChanges, setHasChanges] = useState(false);
  const [entryDateTime, setEntryDateTime] = useState('');

  useEffect(() => {
    if (id && !editingEntryId) {
      loadEntryForEditing(id);
    }
  }, [id, editingEntryId, loadEntryForEditing]);

  useEffect(() => {
    if (editingEntryId) {
      const entry = entries.find(e => e.id === editingEntryId);
      if (entry) {
        // Форматируем дату для input[type="datetime-local"]
        const date = new Date(entry.createdAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setEntryDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
    }
  }, [editingEntryId, entries]);

  useEffect(() => {
    if (editingEntryId) {
      setHasChanges(true);
    }
  }, [currentEntry, entryDateTime, editingEntryId]);

  useEffect(() => {
    const cleanup = setupBackButton(async () => {
      if (hasChanges) {
        const confirmed = await showConfirm('Выйти без сохранения изменений?');
        if (confirmed) {
          resetCurrentEntry();
          navigate('/');
        }
      } else {
        resetCurrentEntry();
        navigate('/');
      }
    });
    return cleanup;
  }, [navigate, hasChanges, resetCurrentEntry]);

  const handleBack = async () => {
    hapticFeedback('light');
    if (hasChanges) {
      const confirmed = await showConfirm('Выйти без сохранения изменений?');
      if (confirmed) {
        resetCurrentEntry();
        navigate('/');
      }
    } else {
      resetCurrentEntry();
      navigate('/');
    }
  };

  const handleSave = async () => {
    hapticFeedback('medium');
    try {
      // Обновляем createdAt, если изменилась дата
      if (entryDateTime && editingEntryId) {
        const newDate = new Date(entryDateTime);
        const entry = entries.find(e => e.id === editingEntryId);
        if (entry && newDate.toISOString() !== entry.createdAt) {
          await updateExistingEntry(newDate.toISOString());
        } else {
          await updateExistingEntry();
        }
      } else {
        await updateExistingEntry();
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEntryDateTime(e.target.value);
  };

  const entry = entries.find(e => e.id === id);
  if (!entry && !editingEntryId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Запись не найдена
          </h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pb-2 sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <button
          onClick={handleBack}
          className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors"
        >
          <span className="material-symbols-outlined text-[24px] text-slate-900 dark:text-white">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight text-center text-slate-900 dark:text-white truncate max-w-[200px]">
          Редактирование
        </h2>
        <div className="size-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 pb-32 pt-4">
        <div className="space-y-0 rounded-xl overflow-hidden border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark">
          {/* Дата и Время */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Дата и Время
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <input
              type="datetime-local"
              value={entryDateTime}
              onChange={handleDateTimeChange}
              className="w-full bg-transparent text-base text-slate-900 dark:text-white border-none outline-none focus:ring-0 p-0"
            />
          </div>

          {/* Место */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Местоположение
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <textarea
              value={currentEntry.location}
              onChange={(e) => updateCurrentEntry('location', e.target.value)}
              className="w-full min-h-[80px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="Где Вы находились..."
            />
          </div>

          {/* Свидетели */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Ваше окружение
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <textarea
              value={currentEntry.witnesses}
              onChange={(e) => updateCurrentEntry('witnesses', e.target.value)}
              className="w-full min-h-[60px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="Кто был рядом с Вами..."
            />
          </div>

          {/* Обстоятельства */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Обстановка и контекст
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <textarea
              value={currentEntry.circumstances}
              onChange={(e) => updateCurrentEntry('circumstances', e.target.value)}
              className="w-full min-h-[80px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="Ваше состояние, события..."
            />
          </div>

          {/* Триггер */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Пусковой механизм
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <textarea
              value={currentEntry.trigger}
              onChange={(e) => updateCurrentEntry('trigger', e.target.value)}
              className="w-full min-h-[80px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="Что запустило мысли об игре..."
            />
          </div>

          {/* Мысли */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Ваши мысли
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <textarea
              value={currentEntry.thoughts}
              onChange={(e) => updateCurrentEntry('thoughts', e.target.value)}
              className="w-full min-h-[100px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="О чем Вы подумали..."
            />
          </div>

          {/* Телесные ощущения */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3 border-b border-slate-200 dark:border-border-dark">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Телесные ощущения
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4 border-b border-slate-100 dark:border-border-dark">
            <textarea
              value={currentEntry.bodyFeelings}
              onChange={(e) => updateCurrentEntry('bodyFeelings', e.target.value)}
              className="w-full min-h-[100px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="Напряжение, ритм сердца..."
            />
          </div>

          {/* Действия */}
          <div className="bg-slate-50 dark:bg-surface-dark-alt px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Ваши действия
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark px-4 py-4">
            <textarea
              value={currentEntry.actions}
              onChange={(e) => updateCurrentEntry('actions', e.target.value)}
              className="w-full min-h-[100px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none border-none outline-none focus:ring-0 p-0"
              placeholder="Ваша реакция на тягу..."
            />
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-linear-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent pt-12">
        <div className="flex gap-4 max-w-lg mx-auto w-full">
          <button
            onClick={handleSave}
            className="h-12 w-full rounded-xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Сохранить изменения
          </button>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
