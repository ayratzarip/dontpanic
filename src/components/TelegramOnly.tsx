import { useEffect, useState } from 'react';
import { isTelegramEnvironment } from '../utils/telegram';

interface TelegramOnlyProps {
  children: React.ReactNode;
}

export function TelegramOnly({ children }: TelegramOnlyProps) {
  const [isInTelegram, setIsInTelegram] = useState<boolean | null>(null);

  useEffect(() => {
    // Small delay to ensure WebApp is fully initialized
    const timer = setTimeout(() => {
      setIsInTelegram(isTelegramEnvironment());
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Loading state
  if (isInTelegram === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-300 text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Not in Telegram - show fallback
  if (!isInTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-slate-700/50">
          {/* Telegram Icon */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-14 h-14 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              Только в Telegram
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              Это приложение работает только внутри Telegram
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-left bg-slate-900/50 rounded-2xl p-5 border border-slate-700/30">
            <p className="text-slate-400 text-sm font-medium">
              Чтобы использовать приложение:
            </p>
            <ol className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">1.</span>
                <span>Откройте Telegram</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">2.</span>
                <span>Найдите бота приложения</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">3.</span>
                <span>Запустите Mini App</span>
              </li>
            </ol>
          </div>

          {/* Footer */}
          <p className="text-slate-500 text-xs">
            Telegram Mini App
          </p>
        </div>
      </div>
    );
  }

  // In Telegram - render app
  return <>{children}</>;
}
