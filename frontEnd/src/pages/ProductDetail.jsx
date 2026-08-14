import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useCartStore } from '../features/shop/store/useCartStore';

const MOCK_PRODUCTS = [
  {
    _id: 'mock-shop-1',
    name: 'iPhone 13 Pro - 256GB',
    category: 'Smartphones',
    condition: 'Refurbished',
    price: 64900,
    stock: 2,
    description: 'Graphite • 100% Battery Health. Fully inspected and restored to like-new condition with 12 months warranty.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZVi2SmmR-CQKCEMqeumV_nq50y2QXal5Z4acw0rVhI0x9jl9ulagfTse2iPrp8g-DT4ISUWG7Ps99lFNiHyeqDJ3yEIzBOL5p5fqwpUX7EsqEBNxdbIPwN7s5EOJZBQ8A2WcM8192ZQUVfs4JHIAUXXY0qiYUk6ROS2ExjTPDDnYd-LM7d1Sld6tZS8lg8uoj0qnGoB-htlhwK4vndy8XMd8qrnTiRJzTFQdr4WhccFgQBitewgZ01opyVBE0HCAbEJdatbcznpM'
    ],
    specs: { 'Storage': '256GB', 'Color': 'Graphite', 'Battery': '100%', 'Warranty': '12 Months' }
  },
  {
    _id: 'mock-shop-2',
    name: 'Nokia 3310 (2020)',
    category: 'Feature Phones',
    condition: 'New',
    price: 4900,
    stock: 5,
    description: 'Dark Blue • Dual SIM • 4G. The iconic classic phone with modern 4G connectivity, long battery life, and pre-installed games.',
    images: ['/feature_phone.png'],
    specs: { 'Network': '4G LTE', 'SIM': 'Dual SIM', 'Battery': 'Removable', 'Color': 'Dark Blue' }
  },
  {
    _id: 'mock-shop-3',
    name: 'Apple Watch Series 7 45mm',
    category: 'Wearables',
    condition: 'Refurbished',
    price: 24900,
    stock: 1,
    description: 'Midnight Aluminum • Sport Band. Advanced health sensors, always-on Retina display, and fast charging capability.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBIiQ5fnGbQ_JGV_hwcSPI4XMYl7C64_7iJoZ8MfpJyj7zrHKMip29ZYxv97v4yeMDRA5BlfckIs2TJqwN0PbyHvNjCN4MfwZuCWlo1HQhQNzcYZ4nQJRVEgNEgzck2bwzSLfst_Nsd3sgXu78fV1AwaPCOEK1RmzS66SAKSh124o_AxbU7WzfBcbthGFmrU4K6e89exXVdrA6S5j4RIdfvhvKX_xih7mG41FIojQvciNJWxi1rIH4AE_9dfSz6RS11BStWFlm6yDQ'
    ],
    specs: { 'Case Size': '45mm', 'Material': 'Aluminum', 'Color': 'Midnight', 'Connectivity': 'GPS' }
  }
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        const mock = MOCK_PRODUCTS.find((p) => p._id === id);
        setProduct(mock || MOCK_PRODUCTS[0]);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="pt-28 pb-16 min-h-screen bg-background text-on-surface flex flex-col items-center justify-center gap-3">
        <span className="animate-spin border-4 border-secondary border-t-transparent rounded-full w-8 h-8"></span>
        <p className="text-on-surface-variant text-sm font-label-md">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-28 pb-16 min-h-screen bg-background text-on-surface flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-error">search_off</span>
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <button
          onClick={() => navigate('/shop')}
          className="px-4 py-2 bg-secondary text-black font-bold rounded-lg text-sm cursor-pointer"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'];

  const activeImage = images[selectedImageIndex] || images[0];

  const handleAddToCart = () => {
    addToCart(product);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const specsEntries = product.specs && typeof product.specs === 'object'
    ? Object.entries(product.specs)
    : [];

  return (
    <div className="pt-24 pb-20 min-h-screen bg-background text-on-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-2 mb-6 text-on-surface-variant hover:text-secondary font-label-md text-sm transition-colors cursor-pointer bg-transparent border-none"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Shop
        </button>

        {/* Product Details Header: Name, Status & Category */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-secondary/10 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase font-mono">
              {product.condition || 'New'}
            </span>
            <span className="text-xs text-on-surface-variant capitalize font-mono">
              {product.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight">{product.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left Column: Multi-Image Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Active Image Display */}
            <div className="relative aspect-square w-full rounded-2xl glass-panel border border-white/10 p-6 flex items-center justify-center overflow-hidden bg-black/30 group">
              {product.stock === 0 && (
                <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow">
                  Sold Out
                </div>
              )}

              {/* Image counter badge */}
              {images.length > 1 && (
                <span className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white border border-white/10 px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                  {selectedImageIndex + 1} / {images.length}
                </span>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    title="Previous Image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-secondary hover:text-black border border-white/10 text-white flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                    title="Next Image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-secondary hover:text-black border border-white/10 text-white flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </button>
                </>
              )}

              {product.isAvailable === false && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#252830]/95 text-gray-200 py-2 px-4 text-center text-xs font-extrabold tracking-widest uppercase border-t border-gray-600/40 shadow-md z-20 pointer-events-none">
                  Not Available
                </div>
              )}

              <img
                src={activeImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-300"
              />
            </div>

            {/* Thumbnail Switcher Gallery */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 shrink-0 rounded-xl border transition-all overflow-hidden p-1 bg-black/40 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-secondary ring-2 ring-secondary/50 scale-105'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgSrc} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="flex flex-col gap-6">

            {/* Price tag in DA */}
            <div className="p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
              <div>
                <span className="block text-xs text-on-surface-variant font-label-md">Price</span>
                <span className="text-3xl font-extrabold text-secondary">
                  {product.price}.00 <span className="text-base font-semibold text-on-surface-variant">DA</span>
                </span>
              </div>

              <div className="text-right">
                <span className="block text-xs text-on-surface-variant font-label-md">Availability</span>
                {product.isAvailable === false ? (
                  <span className="text-xs font-bold text-gray-400 bg-gray-800/60 border border-gray-700 px-2.5 py-0.5 rounded-full">
                    Not Available
                  </span>
                ) : product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    In Stock ({product.stock})
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-400">Out of Stock / Sold</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || product.isAvailable === false}
                className="flex-1 py-3.5 px-6 bg-secondary text-black font-bold rounded-xl text-sm hover:bg-secondary/80 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border-none outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                {addedNotice ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>

            {/* Description Box */}
            {product.description && (
              <div className="glass-panel p-5 rounded-xl border border-white/10">
                <h3 className="text-base font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">description</span> Description
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications List */}
            {specsEntries.length > 0 && (
              <div className="glass-panel p-5 rounded-xl border border-white/10">
                <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">tune</span> Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {specsEntries.map(([key, val]) => (
                    <div key={key} className="bg-surface-container-low/60 p-2.5 rounded-lg border border-white/5 flex flex-col gap-0.5">
                      <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">{key}</span>
                      <span className="text-on-surface font-semibold text-xs">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

