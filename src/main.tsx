import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// import { AuthProvider } from './contexts/AuthContext';
import { initPerformanceMonitoring } from './utils/performance';
import './index.css';

// Initialize performance monitoring
initPerformanceMonitoring();

// Register service worker for caching and offline support in production only
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
  const isGhPages = window.location.hostname.includes('github.io');
  const swPath = isGhPages ? '/children4worldchildren/sw.js' : '/sw.js';
  
  // Only register the service worker if we're on the same origin
  if (publicUrl.origin === window.location.origin) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates every hour
          setInterval(() => {
            registration.update().catch(err => 
              console.log('ServiceWorker update check failed: ', err)
            );
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <AuthProvider> */}
      <App />
    {/* </AuthProvider> */}
  </StrictMode>
);
