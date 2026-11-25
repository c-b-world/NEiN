import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyThemeToDocument, loadThemeSettings } from './utils/themeSettings';

applyThemeToDocument(loadThemeSettings());

createRoot(document.getElementById('root')!).render(<App />);
