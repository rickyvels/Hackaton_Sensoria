import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './multiagent.css';
import './clarity.css';
import './semantic-platform.css';
import './semantic-accessibility.css';
import './healthcare-platform.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
