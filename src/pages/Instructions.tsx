import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupBackButton, hapticFeedback } from '../utils/telegram';

interface InstructionItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  content: string;
}

const basicInstructions: InstructionItem[] = [
  {
    id: 'create',
    icon: 'edit_note',
    iconColor: 'text-primary bg-blue-500/10 dark:bg-blue-500/20',
    title: 'Как вести дневник',
    content: 'Нажмите кнопку «Новая запись» при появлении тревоги или панической атаки. Последовательно заполните 7 шагов самонаблюдения. Подробное описание помогает лучше понять триггеры. Будьте максимально детальны — чем подробнее запись, тем эффективнее работает техника.',
  },
  {
    id: 'edit',
    icon: 'edit',
    iconColor: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20',
    title: 'Редактирование записей',
    content: 'Вы можете вернуться к любой записи и дополнить её. Нажмите на карточку записи на главном экране. После того, как паника прошла, полезно вернуться к записи и добавить рефлексию: что помогло, какие мысли оказались ошибочными, как можно было справиться лучше.',
  },
];

const descriptionInstructions: InstructionItem[] = [
  {
    id: 'location',
    icon: 'location_on',
    iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20',
    title: '1. Место',
    content: 'Где Вы находились, когда началась тревога или паническая атака? Например: дома, в метро, в лифте, в торговом центре, на работе. Место может быть важным триггером.',
  },
  {
    id: 'witnesses',
    icon: 'groups',
    iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20',
    title: '2. Окружение',
    content: 'Были ли Вы одни или с кем-то? С знакомыми людьми, с посторонними или в толпе? Социальный контекст влияет на интенсивность тревоги - например, страх, что окружающие заметят Ваше состояние.',
  },
  {
    id: 'circumstances',
    icon: 'psychology_alt',
    iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20',
    title: '3. Обстоятельства',
    content: 'Опишите фон: Ваше физическое и эмоциональное состояние, события перед этим. Например: недосыпание, стресс на работе, конфликт с близкими, физическая усталость, употребление кофеина. Это помогает выявить факторы уязвимости.',
  },
  {
    id: 'trigger',
    icon: 'bolt',
    iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20',
    title: '4. Триггер',
    content: 'Что конкретно запустило паническую атаку? Телесное ощущение (сердцебиение), ситуация (замкнутое пространство), мысль ("со мной что-то не так")? Определение триггера - ключ к пониманию паники.',
  },
  {
    id: 'thoughts',
    icon: 'chat_bubble',
    iconColor: 'text-pink-600 dark:text-pink-400 bg-pink-500/10 dark:bg-pink-500/20',
    title: '5. Мысли',
    content: 'Какие катастрофические мысли возникли? "У меня инфаркт", "я умру", "я схожу с ума", "я не справлюсь"? Чем подробнее Вы опишете мысли, тем лучше - это помогает потом оспорить иррациональные убеждения.',
  },
  {
    id: 'body',
    icon: 'favorite',
    iconColor: 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20',
    title: '6. Телесные ощущения',
    content: 'Опишите максимально детально все телесные симптомы: сердцебиение, дыхание, головокружение, дрожь, потливость, онемение, тошнота. Где в теле? Насколько сильно?',
  },
  {
    id: 'actions',
    icon: 'exercise',
    iconColor: 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20',
    title: '7. Действия',
    content: 'Что Вы делали в момент паники? Пытались ли Вы как-то себе помочь, звонили кому-то, уходили с места события или просто ждали? Опишите любые Ваши действия по факту.',
  },
];

const aiInstructions: InstructionItem[] = [
  {
    id: 'ai',
    icon: 'smart_toy',
    iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20',
    title: 'Анализ с AI-помощником',
    content: 'Используйте функцию "Скопировать для AI", чтобы получить профессиональный анализ паттернов ваших панических атак. Вставьте скопированный текст в чат с ChatGPT или Claude. AI поможет выявить триггеры, паттерны и связи между мыслями и ощущениями.',
  },
];

const securityInstructions: InstructionItem[] = [
  {
    id: 'privacy',
    icon: 'lock',
    iconColor: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 dark:bg-slate-500/20',
    title: 'Конфиденциальность',
    content: 'Ваши записи хранятся в зашифрованном виде в Telegram Cloud Storage. Доступ к ним имеете только Вы. Это безопасное пространство для честного самонаблюдения. Конфиденциальность — основа эффективной работы с тревогой.',
  },
];

function InstructionGroup({ title, items }: { title?: string; items: InstructionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    hapticFeedback('light');
    setOpenId(openId === id ? null : id);
  };

  return (
    <div>
      {title && (
        <h3 className="px-4 pb-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="flex flex-col gap-px rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-800">
        {items.map(item => (
          <details 
            key={item.id}
            className="group bg-white dark:bg-surface-dark"
            open={openId === item.id}
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) {
                toggleItem(item.id);
              }
            }}
          >
            <summary className="flex cursor-pointer items-center justify-between p-4 active:bg-slate-50 dark:active:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center size-8 rounded-lg ${item.iconColor}`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <span className="text-slate-900 dark:text-white text-[16px] font-medium">{item.title}</span>
              </div>
              <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${openId === item.id ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </summary>
            <div className="px-4 pb-4 pt-0 pl-[52px]">
              <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
                {item.content}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function Instructions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const cleanup = setupBackButton(() => {
      navigate('/');
    });
    return cleanup;
  }, [navigate]);

  const handleBack = () => {
    hapticFeedback('light');
    navigate('/');
  };

  const handleUnderstood = () => {
    hapticFeedback('success');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 transition-colors">
        <div className="max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between p-4 h-14">
            <button
              onClick={handleBack}
              className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors"
            >
              <span className="material-symbols-outlined text-[24px] text-slate-900 dark:text-white">arrow_back</span>
            </button>
            <h2 className="text-slate-900 dark:text-white text-[17px] font-semibold leading-tight absolute left-1/2 -translate-x-1/2">
              Инструкции
            </h2>
            <div className="w-12" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Search Bar */}
        <div className="max-w-lg mx-auto w-full px-4 py-3">
          <div className="relative flex w-full items-center rounded-xl bg-slate-200/50 dark:bg-surface-dark group focus-within:ring-2 focus-within:ring-primary/50 transition-all overflow-hidden">
            <div className="flex items-center justify-center pl-3 text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-2.5 pl-2 pr-4 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-0"
              placeholder="Поиск по инструкциям..."
            />
          </div>
        </div>

        {/* Instructions Lists */}
        <div className="max-w-lg mx-auto w-full px-4 space-y-6 pt-4">
          <InstructionGroup items={basicInstructions} />
          <InstructionGroup title="Что писать в описании" items={descriptionInstructions} />
          <InstructionGroup items={aiInstructions} />
          <InstructionGroup title="Безопасность" items={securityInstructions} />

          {/* Footer */}
          <div className="text-center pt-4 pb-8">
            <p className="text-slate-400 dark:text-gray-600 text-xs">Версия приложения 1.0.0</p>
          </div>
        </div>
      </main>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-slate-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto w-full">
          <button
            onClick={handleUnderstood}
            className="h-12 w-full rounded-xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center"
          >
            Всё понятно
          </button>
        </div>
      </div>
    </div>
  );
}

