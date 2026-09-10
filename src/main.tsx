import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createBrowserLogger } from './events';
import './styles.css';

const logger = createBrowserLogger();
createRoot(document.getElementById('root')!).render(<StrictMode><App logger={logger} /></StrictMode>);
