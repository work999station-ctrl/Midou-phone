import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useRepairStore } from '../features/repairs/store/useRepairStore';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import { getApiUrl } from '../config/api';

// Static fallback products matching the Stitch mockup
const MOCK_PRODUCTS = [
  {
    _id: 'mock-1',
    name: 'iPhone 15 Pro',
    category: 'Smartphone',
    condition: 'Refurbished',
    price: 899,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuC-2BbzrS7Qpa5ApyPYZ4n8Hc76TAv_I0-nwr3ykimm_7ElMhFAcpbg54QZWtFcq3MwqWLABGPiVZeFNUsv-Deo5wCeuehOCqtJJyRIE9uOmxD0jYgbqBakTa6IhgireV0mq-LSMDxl0KSUXPbO6CYKILvv9oxX-P3-9OSLpzBBhxpvJ9_zn7iG9p3RZwKglqcfcJNg3d1MXOZdxiQysEvPLd3aRxzNZX2rTu3lpW_0nR0lW9Fc1B_WbD6U_fxofOBVCxeJJnYFUeo']
  },
  {
    _id: 'mock-2',
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    condition: 'New',
    price: 349,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuD8f7f5jU14rL_x7yq_447VwL8qMsnB4zYvM0U_rQo9gR18wz9p4j1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq']
  },
  {
    _id: 'mock-3',
    name: 'Samsung Galaxy Watch 6',
    category: 'Wearable',
    condition: 'New',
    price: 299,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuB2eD_L-XfNqD8_x1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq1bWzZlqgZp5_XpZ-VjGg262Yl9Kq']
  },
  {
    _id: 'mock-4',
    name: 'Premium Tech Toolkit',
    category: 'Tools',
    condition: 'New',
    price: 59,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAmx_0-E93N-P9eLmBwuXP8CCyZT5dp0f_TqIzt0E0X9SpkbYkU-CtwHOL-YtU-taLOCn2ynrjidYyqT7Af8z1PMklMCUKEMrMlq9NwVxAyOIhrXmKgOVDz4SBgnieg-43cxgkbjjq-N93iTQ4LTHnugkwOq3tatrn4w_RgHI9u82sKsncyg1CrDq8I3PQMFajxZ2nRcjV9uOgrtc5yZwNIXs3lTaFgcPHh927ne09nvfDJDE3XRDed-6RAfCMf14Wt8i3tt0K68iU']
  }
];

export default function Home() {
  const navigate = useNavigate();
  const setBookingField = useRepairStore((state) => state.setBookingField);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useLanguageStore();

  const [products, setProducts] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('phone'); // 'phone' or 'tablet'
  const [trackQuery, setTrackQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Fetch products from backend or fallback to mocks
    fetch(getApiUrl() + '/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.slice(0, 4));
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      })
      .catch(() => setProducts(MOCK_PRODUCTS));

    // Fetch pricing matrix from backend
    fetch(getApiUrl() + '/api/repairs/prices')
      .then((res) => res.json())
      .then((data) => setPricing(data))
      .catch(() => {
        setPricing({
          phone: {
            'screen & display': 79,
            'charging port': 49,
            'buttons': 39,
            'audio output': 49,
            'other': 29
          },
          tablet: {
            'screen & display': 119,
            'charging port': 59,
            'buttons': 49,
            'audio output': 59,
            'other': 39
          }
        });
      });
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    const cleanQuery = trackQuery.trim();
    if (cleanQuery.toUpperCase().startsWith('REP-')) {
      navigate(`/repair/track?ticketId=${encodeURIComponent(cleanQuery)}`);
    } else {
      navigate(`/repair/track?customerPhone=${encodeURIComponent(cleanQuery)}`);
    }
  };

  const handleBookRepair = (device, issue, price) => {
    resetBooking();
    setBookingData({
      deviceType: device,
      issue: issue,
      estimatedPrice: price
    });
    navigate('/repair/book');
  };

  const currentPrices = pricing ? pricing[selectedDevice] : {};

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased selection:bg-secondary/30 selection:text-secondary min-h-screen pt-20">
      {/* Hero Section */}
      <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16">
        {/* Kinetic Cybernetic Background Animation */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-secondary/15 blur-[80px] animate-drift"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary-container/10 blur-[100px] animate-drift-reverse"></div>
          <div className="absolute inset-0 bg-background/60"></div>
        </div>
        <div className="relative z-10 glass-panel rounded-xl p-stack-lg md:p-margin-desktop max-w-3xl mx-gutter text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-surface-container border border-outline-variant text-label-sm font-label-sm text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            Live Support Online
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-stack-md tracking-tight">
            Fast Repairs &amp; <br />Premium Devices
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-xl mx-auto">
            Precision engineering meets exceptional service. Restore your tech to factory standards or upgrade to certified pre-owned excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-stack-md">
            <button 
              onClick={() => { resetBooking(); navigate('/repair/book'); }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-inverse-primary to-primary-container text-white font-label-md text-label-md rounded-DEFAULT hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 active:scale-95 cursor-pointer"
            >
              {t('bookRepair', 'Book a Repair')}
            </button>
            <button 
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-secondary text-secondary font-label-md text-label-md rounded-DEFAULT hover:bg-secondary/10 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              {t('shop', 'Shop')}
            </button>
          </div>
        </div>
      </header>

      {/* Repair Price Estimator Section */}
      <section className="py-margin-desktop px-gutter max-w-container-max mx-auto border-t border-white/5">
        <div className="text-center mb-stack-lg animate-fade-in-up">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">What do you need to fix?</h2>
          <p className="font-body-md text-body-md text-outline">Select your device type to view starting pricing and book service.</p>
        </div>

        {/* Custom tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-surface-container p-1 rounded-lg border border-outline-variant flex">
            <button 
              onClick={() => setSelectedDevice('phone')}
              className={`px-6 py-2 rounded font-label-md text-label-md transition-all cursor-pointer ${selectedDevice === 'phone' ? 'bg-[#3b82f6] text-white' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Phones
            </button>
            <button 
              onClick={() => setSelectedDevice('tablet')}
              className={`px-6 py-2 rounded font-label-md text-label-md transition-all cursor-pointer ${selectedDevice === 'tablet' ? 'bg-[#3b82f6] text-white' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Tablets
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-stack-md md:gap-gutter max-w-5xl mx-auto">
          {Object.entries(currentPrices).map(([issue, price]) => {
            let icon = 'handyman';
            if (issue === 'screen & display' || issue === 'cracked screen') icon = 'smartphone';
            if (issue === 'charging port') icon = 'usb';
            if (issue === 'buttons') icon = 'toggle_on';
            if (issue === 'audio output') icon = 'volume_up';

            return (
              <div 
                key={issue}
                onClick={() => handleBookRepair(selectedDevice, issue, price)}
                className="glass-panel group rounded-lg flex flex-col items-center justify-center p-stack-md relative overflow-hidden transition-all duration-300 hover:border-inverse-primary hover:-translate-y-1 cursor-pointer min-h-[180px]"
              >
                <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/5 transition-colors duration-500"></div>
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-stack-sm group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-shadow">
                  {issue === 'charging port' ? (
                    <svg 
                      className="w-7 h-7 text-primary group-hover:text-secondary transition-colors" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="2.5" y="7" width="19" height="10" rx="5" />
                      <rect x="6.5" y="10.5" width="11" height="3" rx="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-[28px] text-primary group-hover:text-secondary transition-colors">{icon}</span>
                  )}
                </div>
                <span className="font-label-md text-label-md text-on-surface capitalize mb-1 text-center">{issue}</span>
                <span className="font-headline-sm text-secondary font-bold">${price}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Shop Items */}
      <section className="py-margin-desktop px-gutter max-w-container-max mx-auto border-t border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-stack-lg">
          <div className="mb-4 sm:mb-0">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Featured Shop Items</h2>
            <p className="font-body-md text-body-md text-outline">Premium certified devices and gear.</p>
          </div>
          <button 
            onClick={() => navigate('/shop')}
            className="text-secondary hover:text-primary transition-colors font-label-md text-label-md flex items-center gap-1 group cursor-pointer bg-transparent border-none"
          >
            View All <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
          {products.map((item) => (
            <div key={item._id} className="glass-panel group rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 hover:border-inverse-primary hover:-translate-y-1">
              <div className="aspect-square bg-surface-container-high rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
                <img 
                  alt={item.name} 
                  className="w-full h-full object-cover mix-blend-luminosity opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                  src={item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop'}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop';
                  }}
                />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">{item.category}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant text-[10px] font-medium text-secondary">{item.condition}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{item.name}</h3>
              <div className="text-primary font-bold text-lg mb-4 mt-auto">${item.price}</div>
              <button 
                onClick={() => navigate(`/shop/product/${item._id}`)}
                className="w-full py-2 bg-white/5 border border-white/10 rounded hover:bg-inverse-primary hover:border-inverse-primary text-on-surface font-label-md transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(73,75,214,0.4)] cursor-pointer"
              >
                View Item
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Track Your Repair */}
      <section className="bg-surface-container-low py-margin-desktop border-t border-white/5">
        <div className="max-w-container-max mx-auto px-gutter text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Track Your Repair</h2>
          <form onSubmit={handleTrackSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-stack-sm">
            <input 
              className="flex-1 bg-black/20 border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-DEFAULT text-on-surface px-4 py-3 font-body-md text-body-md outline-none transition-colors"
              placeholder="Enter Order ID or Serial Number" 
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="px-6 py-3 bg-surface-bright border border-outline-variant text-on-surface font-label-md text-label-md rounded-DEFAULT hover:border-secondary transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">search</span>
              Track
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
