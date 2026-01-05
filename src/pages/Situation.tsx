import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { setupBackButton, hapticFeedback, showConfirm } from '../utils/telegram';
import { WITNESSES_OPTIONS } from '../types';

export default function Situation() {
  const { currentEntry, updateCurrentEntry, resetCurrentEntry } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showTip, setShowTip] = useState(false);
  const totalSteps = 4;

  useEffect(() => {
    setShowTip(false);
  }, [step]);

  // Проверка наличия данных для более стабильной зависимости
  const hasEntryData = useMemo(() => {
    return currentEntry.location.trim().length > 0 || 
           currentEntry.witnesses.trim().length > 0 || 
           currentEntry.circumstances.trim().length > 0 || 
           currentEntry.trigger.trim().length > 0;
  }, [currentEntry.location, currentEntry.witnesses, currentEntry.circumstances, currentEntry.trigger]);

  useEffect(() => {
    let isProcessing = false;
    
    const cleanup = setupBackButton(async () => {
      // Защита от множественных одновременных вызовов
      if (isProcessing) return;
      isProcessing = true;

      try {
        if (step > 1) {
          setStep(step - 1);
        } else if (hasEntryData) {
          const confirmed = await showConfirm('Отменить создание записи?');
          if (confirmed) {
            resetCurrentEntry();
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } finally {
        // Сбрасываем флаг после небольшой задержки, чтобы предотвратить повторные клики
        setTimeout(() => {
          isProcessing = false;
        }, 300);
      }
    });
    
    return cleanup;
  }, [navigate, step, hasEntryData, resetCurrentEntry]);

  const handleBack = async () => {
    hapticFeedback('light');
    if (step > 1) {
      setStep(step - 1);
    } else if (hasEntryData) {
      const confirmed = await showConfirm('Отменить создание записи?');
      if (confirmed) {
        resetCurrentEntry();
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      hapticFeedback('light');
      setStep(step + 1);
    } else {
      hapticFeedback('light');
      navigate('/thoughts');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return currentEntry.location.trim().length > 0;
      case 2:
        return currentEntry.witnesses.length > 0;
      case 3:
        return true; // Обстоятельства опциональны
      case 4:
        return true; // Триггер опционален
      default:
        return false;
    }
  };

  const renderProgressIndicator = () => {
    const totalStepsAll = 7;
    return (
      <div className="flex w-full flex-row items-center justify-center gap-2 py-4 px-4">
        {[...Array(totalStepsAll)].map((_, index) => {
          const currentStepGlobal = step; // Текущий шаг из 4 внутренних = шаг 1-4 из 7 общих
          return (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                index < currentStepGlobal
                  ? 'bg-primary shadow-[0_0_8px_rgba(19,127,236,0.5)]'
                  : 'bg-slate-200 dark:bg-surface-dark'
              }`}
            />
          );
        })}
      </div>
    );
  };

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
        <h2 className="text-lg font-bold leading-tight tracking-tight text-center text-slate-900 dark:text-white">
          Шаг {step} из 7
        </h2>
        <div className="size-10" />
      </header>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 pb-32">
        {/* Step 1: Место */}
        {step === 1 && (
          <>
            <div className="pt-2 pb-2">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                Местоположение
              </h1>
            </div>
            <p className="text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 pb-6">
              Где Вы находились в момент возникновения тяги? Окружающая обстановка может быть важным фактором.
            </p>
            <div className="relative flex-1 min-h-[160px] flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Где Вы были?
              </label>
              <div className="relative group w-full h-full flex-1">
                <textarea
                  value={currentEntry.location}
                  onChange={(e) => updateCurrentEntry('location', e.target.value)}
                  className="w-full h-full min-h-[180px] p-4 rounded-xl bg-white dark:bg-surface-dark border-2 border-transparent focus:border-primary/50 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-all shadow-sm"
                  placeholder="Например: дома в гостиной, на работе, в машине, в торговом центре..."
                />
                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={() => { setShowTip(!showTip); hapticFeedback('light'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span>Примеры</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tip Modal */}
            {showTip && (
              <div className="mt-4 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-lg border border-slate-200 dark:border-border-dark animate-fade-in">
                <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Примеры мест</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300 mb-3">
                  <li>Дома (на диване, на кухне, в ванной)</li>
                  <li>На рабочем месте / В офисе</li>
                  <li>В пути (в пробке, в метро, в такси)</li>
                  <li>На прогулке / В парке</li>
                  <li>В магазине / ТЦ</li>
                  <li>В гостях или заведении</li>
                </ul>
                <button
                  onClick={() => setShowTip(false)}
                  className="w-full py-2.5 rounded-lg bg-slate-200 dark:bg-surface-dark-alt font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-border-dark transition-colors"
                >
                  Понятно
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Свидетели */}
        {step === 2 && (
          <>
            <div className="pt-2 pb-2">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                Ваше окружение
              </h1>
            </div>
            <p className="text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 pb-4">
              Были ли Вы одни или в компании? Социальный контекст часто влияет на наше состояние.
            </p>

            <button
              onClick={() => { setShowTip(!showTip); hapticFeedback('light'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors mb-6 w-fit"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span>Почему это важно?</span>
            </button>

            {/* Tip Modal */}
            {showTip && (
              <div className="mb-6 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-lg border border-slate-200 dark:border-border-dark animate-fade-in">
                <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Влияние окружения</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3 text-sm">
                  Разные ситуации могут по-разному провоцировать желание играть:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300 mb-3">
                  <li><strong>В одиночестве:</strong> часто триггером становится скука, грусть или чувство свободы ("никто не увидит").</li>
                  <li><strong>С друзьями/знакомыми:</strong> социальное давление, разговоры о ставках, желание "быть как все".</li>
                  <li><strong>В толпе:</strong> стресс или дискомфорт, от которых хочется "убежать" в игру.</li>
                </ul>
                <button
                  onClick={() => setShowTip(false)}
                  className="w-full py-2.5 rounded-lg bg-slate-200 dark:bg-surface-dark-alt font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-border-dark transition-colors"
                >
                  Понятно
                </button>
              </div>
            )}

            <div className="space-y-3">
              {WITNESSES_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    updateCurrentEntry('witnesses', option);
                    hapticFeedback('light');
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    currentEntry.witnesses === option
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white border-2 border-transparent hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {currentEntry.witnesses === option && (
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3: Обстоятельства */}
        {step === 3 && (
          <>
            <div className="pt-2 pb-2">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                Обстановка и контекст
              </h1>
            </div>
            <p className="text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 pb-6">
              Что предшествовало возникновению тяги? Опишите Ваш общий эмоциональный фон или события, которые могли повлиять.
            </p>
            <div className="relative flex-1 min-h-[160px] flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Обстоятельства
              </label>
              <div className="relative group w-full h-full flex-1">
                <textarea
                  value={currentEntry.circumstances}
                  onChange={(e) => updateCurrentEntry('circumstances', e.target.value)}
                  className="w-full h-full min-h-[180px] p-4 rounded-xl bg-white dark:bg-surface-dark border-2 border-transparent focus:border-primary/50 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-all shadow-sm"
                  placeholder="Например: усталость после работы, ссора с близкими, чувство скуки, получение зарплаты..."
                />
                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={() => { setShowTip(!showTip); hapticFeedback('light'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span>Примеры</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tip Modal */}
            {showTip && (
              <div className="mt-4 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-lg border border-slate-200 dark:border-border-dark animate-fade-in">
                <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Что может быть контекстом?</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300 mb-3">
                  <li><strong>Физическое состояние:</strong> усталость, голод, опьянение, недосып.</li>
                  <li><strong>Эмоции:</strong> стресс, тревога, скука, одиночество, злость, радость (эйфория).</li>
                  <li><strong>События:</strong> конфликт, проблемы на работе, получение денег, свободное время.</li>
                </ul>
                <button
                  onClick={() => setShowTip(false)}
                  className="w-full py-2.5 rounded-lg bg-slate-200 dark:bg-surface-dark-alt font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-border-dark transition-colors"
                >
                  Понятно
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 4: Триггер */}
        {step === 4 && (
          <>
            <div className="pt-2 pb-2">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                Пусковой механизм
              </h1>
            </div>
            <p className="text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 pb-6">
              Постарайтесь определить конкретный момент, событие или мысль, которые запустили желание играть.
            </p>
            <div className="relative flex-1 min-h-[160px] flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Триггер
              </label>
              <div className="relative group w-full h-full flex-1">
                <textarea
                  value={currentEntry.trigger}
                  onChange={(e) => updateCurrentEntry('trigger', e.target.value)}
                  className="w-full h-full min-h-[180px] p-4 rounded-xl bg-white dark:bg-surface-dark border-2 border-transparent focus:border-primary/50 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-all shadow-sm"
                  placeholder="Например: увидел рекламу казино, пришло SMS от букмекера, друг рассказал о выигрыше, мысль 'мне повезет'..."
                />
                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={() => { setShowTip(!showTip); hapticFeedback('light'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span>Примеры</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tip Modal */}
            {showTip && (
              <div className="mt-4 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-lg border border-slate-200 dark:border-border-dark animate-fade-in">
                <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Что может быть триггером?</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300 mb-3">
                  <li><strong>Внешние:</strong> реклама, вывески, SMS-уведомления, просмотр спорта, разговоры других людей.</li>
                  <li><strong>Финансовые:</strong> необходимость отдать долг, получение денег, нехватка средств.</li>
                  <li><strong>Внутренние:</strong> внезапное воспоминание о выигрыше, фантазия об успехе, скука, желание "быстрых денег".</li>
                </ul>
                <button
                  onClick={() => setShowTip(false)}
                  className="w-full py-2.5 rounded-lg bg-slate-200 dark:bg-surface-dark-alt font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-border-dark transition-colors"
                >
                  Понятно
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-linear-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent pt-12">
        <div className="flex gap-4 max-w-lg mx-auto w-full">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="h-12 w-full rounded-xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step < totalSteps ? 'Далее' : 'К мыслям'}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
