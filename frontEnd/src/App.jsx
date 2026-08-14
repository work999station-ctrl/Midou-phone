import { Routes, Route, Navigate, useLocation } from 'react-router';
import { useAuthStore } from './features/auth/store/useAuthStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomTabBar from './components/BottomTabBar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import RepairBook from './pages/RepairBook';
import RepairTrack from './pages/RepairTrack';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import AdminRepairManagement from './pages/AdminRepairManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import AdminDebts from './pages/AdminDebts';

function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1326] text-[#dae2fd] overflow-x-hidden w-full">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow w-full max-w-full overflow-x-hidden pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ProductDetail />} />
          <Route path="/repair/book" element={<RepairBook />} />
          <Route path="/repair/track" element={<RepairTrack />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/debts" element={<AdminDebts />} />
          <Route path="/admin/repairs" element={<AdminRepairManagement />} />
        </Routes>
      </main>
      {!isAdminRoute && (
        <>
          <Footer />
          <BottomTabBar />
        </>
      )}
    </div>
  );
}

export default App;
