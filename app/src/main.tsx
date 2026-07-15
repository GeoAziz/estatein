import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { apiClient } from './lib/api-client.ts'

// Catches errors outside the React render tree (event handlers, timers,
// promise chains) that an ErrorBoundary can't see.
window.addEventListener('error', (event) => {
  apiClient.reportError({
    message: event.message,
    stack: event.error?.stack,
    url: window.location.href,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  apiClient.reportError({
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
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
