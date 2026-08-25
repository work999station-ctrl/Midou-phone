import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import LanguageSwitcher from './LanguageSwitcher';

export default function AdminSidebar() {
  const { logout } = useAuthStore();
  const { t } = useLanguageStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const navItemClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
      isActive
        ? 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(128,131,255,0.3)] font-bold'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="px-8 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl shadow-[0_0_15px_rgba(192,193,255,0.4)] flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[22px]">hub</span>
          </div>
          <span className="font-headline-md text-headline-md tracking-tight uppercase text-primary font-bold">
            {t('adminAppName', 'Midou Phone Admin')}
          </span>
        </div>
      </div>

      <div className="px-6 mb-4">
        <LanguageSwitcher className="w-full justify-center py-2" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-outline mb-2">{t('management', 'Management')}</p>

        <NavLink to="/admin/dashboard" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">dashboard</span>
          {t('dashboard', 'Dashboard')}
        </NavLink>

        <NavLink to="/admin/transactions" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">point_of_sale</span>
          {t('posAndTransactions', 'Transactions & POS')}
        </NavLink>

        <NavLink to="/admin/debts" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">credit_score</span>
          {t('debtsRegister', 'Debts Register')}
        </NavLink>

        <NavLink to="/admin/repairs" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">build</span>
          {t('repairAdmin', 'Repair Admin')}
        </NavLink>

        <div className="pt-4 mb-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-outline mb-2">{t('storeAndRepairs', 'Store & Repairs')}</p>
        </div>

        <NavLink to="/shop" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">storefront</span>
          {t('shopPage', 'Shop Page')}
        </NavLink>

        <NavLink to="/repair/book" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">home_repair_service</span>
          {t('bookRepair', 'Book Repair')}
        </NavLink>

        <NavLink to="/repair/track" className={navItemClass} onClick={() => setOpen(false)}>
          <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary">track_changes</span>
          {t('trackStatus', 'Track Repair')}
        </NavLink>
      </nav>

      {/* Footer / Logout */}
      <div className="px-4 pt-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-error hover:bg-error/10 hover:text-error transition-all duration-300 group text-left cursor-pointer border-none bg-transparent font-medium"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">logout</span>
          {t('logout', 'Logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile hamburger button ── (hidden on lg+) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3.5 left-4 z-[60] flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 transition-all active:scale-95 cursor-pointer lg:hidden"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
      </button>

      {/* ── Mobile backdrop overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#0f1729]/95 backdrop-blur-xl border-r border-white/10 z-[60] flex flex-col pt-8 pb-8 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button inside drawer */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer border-none"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar ── (always visible on lg+) */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white/5 backdrop-blur-md border-r border-white/10 z-50 flex-col pt-8 pb-8 hidden lg:flex">
        <SidebarContent />
      </aside>
    </>
  );
}
