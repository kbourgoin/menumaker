import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logger } from './utils/logger'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.debug('Service worker registered successfully', 'PWA', registration);
      })
      .catch((registrationError) => {
        logger.error('Service worker registration failed', 'PWA', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
