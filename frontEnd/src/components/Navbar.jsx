import { NavLink } from 'react-router';
import { useCartStore } from '../features/shop/store/useCartStore';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const cartCount = useCartStore((state) => state.getCartCount());
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useLanguageStore();

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/30 dark:bg-surface/30 backdrop-blur-xl border-b border-white/10 shadow-md">
      <div className="flex justify-between items-center h-20 px-gutter max-w-container-max mx-auto">
        <NavLink to="/" className="text-headline-md font-headline-md font-bold text-primary dark:text-primary tracking-tighter hover:opacity-80 transition-opacity pl-14 md:pl-0">
          {t('appName', 'Hanout')}
        </NavLink>
        
        <div className="hidden md:flex items-center space-x-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              isActive 
                ? "text-secondary font-bold border-b-2 border-secondary pb-1 active:scale-95 transition-transform" 
                : "text-on-surface-variant hover:text-primary transition-colors duration-300 hover:bg-white/5 px-3 py-1 rounded-DEFAULT active:scale-95"
            }
          >
            {t('navHome', 'Home')}
          </NavLink>
          <NavLink 
            to="/shop" 
            className={({ isActive }) => 
              isActive 
                ? "text-secondary font-bold border-b-2 border-secondary pb-1 active:scale-95 transition-transform" 
                : "text-on-surface-variant hover:text-primary transition-colors duration-300 hover:bg-white/5 px-3 py-1 rounded-DEFAULT active:scale-95"
            }
          >
            {t('navShop', 'Shop')}
          </NavLink>
          <NavLink 
            to="/repair/book" 
            className={({ isActive }) => 
              isActive 
                ? "text-secondary font-bold border-b-2 border-secondary pb-1 active:scale-95 transition-transform" 
                : "text-on-surface-variant hover:text-primary transition-colors duration-300 hover:bg-white/5 px-3 py-1 rounded-DEFAULT active:scale-95"
            }
          >
            {t('navBookRepair', 'Book a Repair')}
          </NavLink>
          <NavLink 
            to="/repair/track" 
            className={({ isActive }) => 
              isActive 
                ? "text-secondary font-bold border-b-2 border-secondary pb-1 active:scale-95 transition-transform" 
                : "text-on-surface-variant hover:text-primary transition-colors duration-300 hover:bg-white/5 px-3 py-1 rounded-DEFAULT active:scale-95"
            }
          >
            {t('navTrackStatus', 'Track Status')}
          </NavLink>
          {isAuthenticated && (
            <NavLink 
              to="/admin/repairs" 
              className={({ isActive }) => 
                isActive 
                  ? "text-secondary font-bold border-b-2 border-secondary pb-1 active:scale-95 transition-transform" 
                  : "text-on-surface-variant hover:text-primary transition-colors duration-300 hover:bg-white/5 px-3 py-1 rounded-DEFAULT active:scale-95"
              }
            >
              {t('navAvailableRepairs', 'Available Repairs')}
            </NavLink>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <NavLink to="/cart" aria-label="Cart" className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5 rounded-full active:scale-95 relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-black bg-secondary rounded-full">
                {cartCount}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
