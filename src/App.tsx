import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import {
  Home,
  Situation,
  Thoughts,
  BodyFeelings,
  Actions,
  Instructions,
  EntryView,
} from './pages';

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/AntiBet">
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
          <Routes>
            {/* 1. Мои записи - Домашняя страница */}
            <Route path="/" element={<Home />} />

            {/* 2. Просмотр/редактирование записи */}
            <Route path="/entry/:id" element={<EntryView />} />

            {/* 3. Контекст: Место, Свидетели, Обстоятельства, Триггер */}
            <Route path="/situation" element={<Situation />} />

            {/* 4. Мысли об игре */}
            <Route path="/thoughts" element={<Thoughts />} />

            {/* 5. Телесные ощущения */}
            <Route path="/body-feelings" element={<BodyFeelings />} />

            {/* 6. Действия пользователя */}
            <Route path="/actions" element={<Actions />} />

            {/* 7. Инструкции */}
            <Route path="/instructions" element={<Instructions />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
