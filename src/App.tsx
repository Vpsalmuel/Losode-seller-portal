import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Analytics } from './pages/Analytics';
import { Dashboard } from './pages/Dashboard';
import { ListingForm } from './pages/ListingForm';
import { Listings } from './pages/Listings';
import { Login } from './pages/Login';
import { OrderDetails } from './pages/OrderDetails';
import { Orders } from './pages/Orders';
import { Payments } from './pages/Payments';
import { PhotoshootGallery } from './pages/PhotoshootGallery';
import { Photoshoots } from './pages/Photoshoots';
import { PhotoshootSessions } from './pages/PhotoshootSessions';
import { Settings } from './pages/Settings';
import { RequireAuth } from './state/Auth';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="listings" element={<Listings />} />
        <Route path="listings/new" element={<ListingForm />} />
        <Route path="listings/:id/edit" element={<ListingForm />} />
        <Route path="payments" element={<Payments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="photoshoots" element={<Photoshoots />} />
        <Route path="photoshoots/sessions" element={<PhotoshootSessions />} />
        <Route path="photoshoots/sessions/:id" element={<PhotoshootGallery />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
