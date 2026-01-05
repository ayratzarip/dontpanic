import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { TelegramOnly } from './components/TelegramOnly';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TelegramOnly>
      <App />
    </TelegramOnly>
  </StrictMode>,
);
