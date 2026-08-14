import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './registration.css';
import './recovery.css';
import './touch.css';
import './family-workspace.css';
import './semantic-theme.css';
import './semantic-accessibility.css';
import './healthcare-ui.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      const assets = performance.getEntriesByType('resource').map((entry) => entry.name).filter((value) => {
        try {
          const url = new URL(value);
          return url.origin === window.location.origin
            && !url.pathname.startsWith('/api/')
            && (/\.(?:css|js|png|svg|webp|ico|woff2?)$/i.test(url.pathname) || url.pathname === '/manifest.webmanifest');
        } catch { return false; }
      });
      registration.active?.postMessage({ type: 'PRECACHE_CURRENT_BUILD', assets });
      navigator.serviceWorker.ready.then((ready) => ready.active?.postMessage({ type: 'PRECACHE_CURRENT_BUILD', assets }));
    });
  });
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
