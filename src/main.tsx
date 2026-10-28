import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './components/Toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.');
}

createRoot(rootElement).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
