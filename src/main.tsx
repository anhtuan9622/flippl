import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'neo-brutalist-white',
        duration: 3000,
        style: {
          padding: '16px',
          color: 'black',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        success: {
          iconTheme: {
            primary: '#16a34a',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: 'white',
          },
        },
      }}
    />
  </>
);