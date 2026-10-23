import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './state/Auth';
import { SellerDataProvider } from './state/SellerData';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SellerDataProvider>
          <App />
        </SellerDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
