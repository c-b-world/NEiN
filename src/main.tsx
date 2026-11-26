import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { applyLanguageToDocument, loadLanguage } from './utils/i18n';
import { applyThemeToDocument, loadThemeSettings } from './utils/themeSettings';

applyThemeToDocument(loadThemeSettings());
applyLanguageToDocument(loadLanguage());

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
