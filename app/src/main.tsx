import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { apiClient } from './lib/api-client.ts'
import { initSentry, Sentry } from './lib/sentry.ts'

initSentry()

// Catches errors outside the React render tree (event handlers, timers,
// promise chains) that an ErrorBoundary can't see.
window.addEventListener('error', (event) => {
  Sentry.captureException(event.error ?? new Error(event.message));
  apiClient.reportError({
    message: event.message,
    stack: event.error?.stack,
    url: window.location.href,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const err = reason instanceof Error ? reason : new Error(String(reason));
  Sentry.captureException(err);
  apiClient.reportError({
    message: err.message,
    stack: err.stack,
    url: window.location.href,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
