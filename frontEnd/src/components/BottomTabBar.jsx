import { NavLink, useLocation } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';

export default function BottomTabBar() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useLanguageStore();

  const baseTabs = [
    { label: t('navHome', 'Home'),  to: '/',               icon: 'home',                  exact: true  },
    { label: t('navShop', 'Shop'),  to: '/shop',           icon: 'storefront',             exact: false },
    { label: t('bookRepair', 'Book'),  to: '/repair/book',    icon: 'build',                  exact: false },
    { label: t('trackStatus', 'Track'), to: '/repair/track',   icon: 'track_changes',          exact: false },
  ];

  const adminTab = { label: t('repairAdmin', 'Admin'), to: '/admin/repairs', icon: 'admin_panel_settings', exact: false, isAdmin: true };

  const tabs = isAuthenticated ? [...baseTabs, adminTab] : baseTabs;

  const isTabActive = (tab) => {
    if (tab.exact) return location.pathname === tab.to;
    return location.pathname.startsWith(tab.to);
  };

  // Hide bottom nav entirely for authenticated admin users — they use the sidebar
  if (isAuthenticated) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(11, 19, 38, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(93, 230, 255, 0.12)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 -1px 0 rgba(93,230,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center gap-1 flex-1 relative select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Glow pill indicator */}
              <span
                className="absolute -top-2 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: active ? '28px' : '0px',
                  background: tab.isAdmin
                    ? 'linear-gradient(90deg, #a78bfa, #818cf8)'
                    : 'linear-gradient(90deg, #5de6ff, #22d3ee)',
                  boxShadow: active
                    ? tab.isAdmin
                      ? '0 0 10px rgba(167,139,250,0.9), 0 0 22px rgba(167,139,250,0.4)'
                      : '0 0 10px rgba(93,230,255,0.9), 0 0 22px rgba(93,230,255,0.4)'
                    : 'none',
                  opacity: active ? 1 : 0,
                }}
              />

              {/* Icon bubble */}
              <span
                className="flex items-center justify-center w-11 h-11 rounded-2xl"
                style={{
                  background: active
                    ? tab.isAdmin ? 'rgba(167, 139, 250, 0.12)' : 'rgba(93, 230, 255, 0.1)'
                    : 'transparent',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '22px',
                    color: active
                      ? tab.isAdmin ? '#a78bfa' : '#5de6ff'
                      : 'rgba(218, 226, 253, 0.4)',
                    fontVariationSettings: active
                      ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
                      : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    filter: active
                      ? tab.isAdmin
                        ? 'drop-shadow(0 0 5px rgba(167,139,250,0.7))'
                        : 'drop-shadow(0 0 5px rgba(93,230,255,0.7))'
                      : 'none',
                    transition: 'color 0.2s ease, filter 0.2s ease',
                  }}
                >
                  {tab.icon}
                </span>
              </span>

              {/* Label */}
              <span
                className="text-[10px] font-semibold"
                style={{
                  color: active
                    ? tab.isAdmin ? '#a78bfa' : '#5de6ff'
                    : 'rgba(218, 226, 253, 0.38)',
                  textShadow: active
                    ? tab.isAdmin
                      ? '0 0 8px rgba(167,139,250,0.55)'
                      : '0 0 8px rgba(93,230,255,0.55)'
                    : 'none',
                  letterSpacing: '0.05em',
                  transition: 'color 0.2s ease',
                }}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
