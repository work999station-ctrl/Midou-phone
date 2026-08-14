import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import AdminSidebar from '../components/AdminSidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminTransactions() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'new', 'ledger'
  
  // Data States
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // POS Cart State
  const [posMode, setPosMode] = useState('sales'); // 'sales' or 'restock'
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customTotal, setCustomTotal] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState({}); // { [productId]: { name, price, stock, category, saving } }
  const [previewImage, setPreviewImage] = useState(null); // { url, name }


  // Ledger Filter States
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerDate, setLedgerDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all'); // 'all', 'sale', 'purchase'
  const [ledgerSyncFilter, setLedgerSyncFilter] = useState('all'); // 'all', 'sync', 'no_sync'

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'phone',
    price: '',
    stock: 1,
    images: '',
    purchaseCost: ''
  });

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'phone', label: 'Smartphones' },
    { id: 'tablet', label: 'Tablets' },
    { id: 'watch', label: 'Watches' },
    { id: 'headphones', label: 'Audio & Headphones' },
    { id: 'charger', label: 'Chargers' },
    { id: 'cable', label: 'Cables' },
    { id: 'screen-protector', label: 'Screen Protectors' },
    { id: 'case', label: 'Cases & Covers' },
    { id: 'accessories', label: 'Accessories' }
  ];

  // New Transaction Form State
  const [formData, setFormData] = useState({
    type: 'purchase',
    description: '',
    totalPrice: '',
    quantity: 1,
    updateStock: false,
    isNewProduct: false,
    productId: '',
    category: 'other'
  });

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin');
  }, [isAuthenticated, navigate]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/internal-storage');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTransactions(), fetchProducts()]).finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesType = ledgerTypeFilter === 'all' || tx.type === ledgerTypeFilter;
    const matchesSync = ledgerSyncFilter === 'all' || 
      (ledgerSyncFilter === 'sync' && tx.updateStock) ||
      (ledgerSyncFilter === 'no_sync' && !tx.updateStock);

    const tDate = new Date(tx.createdAt);
    tDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (ledgerDate) {
      const filterD = new Date(ledgerDate);
      filterD.setHours(0, 0, 0, 0);
      matchesDate = tDate.getTime() === filterD.getTime();
    }

    return matchesSearch && matchesType && matchesSync && matchesDate;
  });

  const formatDA = (num) => (num || 0).toLocaleString('en-US') + ' DA';

  // --- POS Logc ---
  const addToCart = (product) => {
    setCustomTotal(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price, totalPrice: product.price }];
    });
  };

  const updateCartItem = (id, field, value) => {
    setCustomTotal(null);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id === id) {
          if (field === 'quantity') {
            const newQty = Math.max(1, value);
            return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
          }
          if (field === 'unitPrice') {
            const newUnitPrice = Math.max(0, value);
            return { ...item, unitPrice: newUnitPrice, totalPrice: item.quantity * newUnitPrice };
          }
        }
        return item;
      })
    );
  };

  const removeCartItem = (id) => {
    setCustomTotal(null);
    setCart((prev) => prev.filter((item) => item.product._id !== id));
  };

  // --- Inline product editing ---
  const startEditProduct = (product) => {
    setEditingProduct((prev) => ({
      ...prev,
      [product._id]: { 
        name: product.name,
        price: product.price, 
        stock: product.stock ?? 0, 
        category: product.category, 
        saving: false 
      }
    }));
  };

  const cancelEditProduct = (id) => {
    setEditingProduct((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const saveEditProduct = async (id) => {
    const edits = editingProduct[id];
    if (!edits) return;
    setEditingProduct((prev) => ({ ...prev, [id]: { ...edits, saving: true } }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/internal-storage/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: edits.name,
          price: Number(edits.price), 
          stock: Number(edits.stock), 
          category: edits.category 
        })
      });
      if (res.ok) {
        await fetchProducts();
        cancelEditProduct(id);
      }
    } catch (err) {
      console.error('Failed to update product', err);
      setEditingProduct((prev) => ({ ...prev, [id]: { ...edits, saving: false } }));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this product from storage?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/internal-storage/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const autoTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      const finalTotal = customTotal !== null ? customTotal : autoTotal;
      const ratio = autoTotal > 0 ? finalTotal / autoTotal : 1;

      for (const item of cart) {
        const adjustedPrice = Math.round(item.totalPrice * ratio);
        await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: posMode === 'sales' ? 'sale' : 'purchase',
            description: item.product.name,
            totalPrice: adjustedPrice,
            quantity: item.quantity,
            productId: item.product._id,
            updateStock: true
          })
        });
      }
      setCart([]);
      setCustomTotal(null);
      fetchTransactions();
      fetchProducts();
    } catch (err) {
      console.error('Checkout failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Add New Product & Purchase ---
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setCreateError('File size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct((prev) => ({ ...prev, images: reader.result }));
      setCreateError('');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.purchaseCost) {
      setCreateError('Please enter product name and total purchase cost.');
      return;
    }
    setSavingProduct(true);
    setCreateError('');

    try {
      const initialStock = Number(newProduct.stock) || 1;
      const unitCost = Math.floor(Number(newProduct.purchaseCost) / initialStock);
      const sellingPrice = newProduct.price ? Number(newProduct.price) : unitCost;

      // 1. Create in Internal Storage
      const resInternal = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/internal-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category: newProduct.category,
          price: sellingPrice,
          stock: initialStock,
          images: newProduct.images.trim() ? [newProduct.images.trim()] : []
        })
      });

      if (!resInternal.ok) {
        const errData = await resInternal.json();
        throw new Error(errData.message || 'Failed to create product');
      }

      const createdItem = await resInternal.json();

      // 2. Create Purchase Transaction for the cost
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'purchase',
          description: `Initial Stock: ${createdItem.name}`,
          totalPrice: Number(newProduct.purchaseCost),
          quantity: Number(newProduct.stock) || 10,
          productId: createdItem._id,
          updateStock: false // Already set initial stock during creation
        })
      });

      // 3. Create in Public Shop (Optional sync)
      try {
        await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProduct.name.trim(),
            category: newProduct.category,
            price: sellingPrice,
            stock: initialStock,
            description: `${newProduct.name.trim()} - ${newProduct.category}`,
            images: newProduct.images.trim() ? [newProduct.images.trim()] : []
          })
        });
      } catch (e) {
        console.warn('Shop product sync warning:', e.message);
      }

      await fetchProducts();
      await fetchTransactions();

      setShowAddModal(false);
      setNewProduct({ name: '', category: 'phone', price: '', stock: 10, images: '', purchaseCost: '' });
    } catch (err) {
      console.error('Create product error:', err.message);
      setCreateError(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // --- New Transaction Form Logic ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          description: formData.description.trim(),
          totalPrice: Number(formData.totalPrice),
          quantity: 1,
          updateStock: false
        })
      });
      
      setFormData({
        type: 'purchase',
        description: '',
        totalPrice: '',
        quantity: 1,
        updateStock: false,
        isNewProduct: false,
        productId: '',
        category: 'other'
      });
      fetchTransactions();
      fetchProducts();
      setActiveTab('ledger');
    } catch (err) {
      console.error('Failed to create transaction', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleCancelTransaction = async (tx) => {
    if (!window.confirm(`Are you sure you want to cancel this ${tx.type}? This will add a canceled transaction to the ledger and reverse the stock change.`)) return;
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'canceled',
          description: `Canceled: ${tx.description}`,
          totalPrice: tx.totalPrice,
          quantity: tx.quantity,
          productId: tx.productId,
          updateStock: tx.updateStock
        })
      });
      fetchTransactions();
      fetchProducts();
    } catch (err) {
      console.error('Failed to cancel transaction', err);
    }
  };

  const { t, lang } = useLanguageStore();

  const getCategoryLabel = (id) => {
    switch (id) {
      case 'all': return t('allProducts', 'All Products');
      case 'phone': return t('catSmartphones', 'Smartphones');
      case 'tablet': return t('catTablets', 'Tablets');
      case 'watch': return t('catWatches', 'Watches');
      case 'headphones': return t('catHeadphones', 'Audio & Headphones');
      case 'charger': return t('catChargers', 'Chargers');
      case 'cable': return t('catCables', 'Cables');
      case 'screen-protector': return t('catScreenProtectors', 'Screen Protectors');
      case 'case': return t('catCases', 'Cases & Covers');
      case 'accessories': return t('catAccessories', 'Accessories');
      default: return id;
    }
  };

  const getProductCategoryBadge = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'phone': return t('badgePhone', 'Smartphone');
      case 'feature-phone': return t('badgeFeaturePhone', 'Feature Phone');
      case 'tablet': return t('badgeTablet', 'Tablet');
      case 'watch': return t('badgeWatch', 'Watch');
      case 'headphones': return t('badgeHeadphones', 'Headphones');
      case 'charger': return t('badgeCharger', 'Charger');
      case 'cable': return t('badgeCable', 'Cable');
      case 'screen-protector': return t('badgeScreenProtector', 'Screen Protector');
      case 'case': return t('badgeCase', 'Case');
      case 'cover': return t('badgeCover', 'Cover');
      case 'accessories': return t('badgeAccessories', 'Accessories');
      default: return cat;
    }
  };

  const formatDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return '';
    if (lang === 'ar') {
      const monthsAr = [
        'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
        'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `\u200E${d.getDate()} \u200E${monthsAr[d.getMonth()]} \u200E${d.getFullYear()} \u200E${hours}:${minutes}`;
    }
    return d.toLocaleString();
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen relative overflow-hidden">
      <AdminSidebar />
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Header Tabs */}
        <header className="bg-surface/50 backdrop-blur-md border-b border-white/5 py-3 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 z-10 sticky top-0">
          <h1 className="text-lg sm:text-2xl font-bold text-on-surface tracking-tight pl-10 lg:pl-0">
            {t('posAndTransactions', 'Transactions & POS')}
          </h1>
          <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end">
            <LanguageSwitcher compact />
            <div className="flex bg-black/40 rounded-full p-1 border border-white/10 overflow-x-auto">
              {['pos', 'new', 'ledger'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--color-primary),0.5)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'pos' ? (lang === 'ar' ? '🛒 نقطة البيع' : '🛒 POS') : tab === 'new' ? (lang === 'ar' ? '➕ إضافة' : '➕ New') : (lang === 'ar' ? '📜 السجل' : '📜 Ledger')}
                </button>
              ))}
            </div>
            {activeTab === 'pos' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-secondary text-[#0b1326] font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(93,230,255,0.3)] hover:shadow-[0_0_25px_rgba(93,230,255,0.6)] hover:scale-105 transition-all cursor-pointer border-none whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">add_box</span>
                <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة منتج' : 'Add Product'}</span>
                <span className="sm:hidden">{lang === 'ar' ? 'إضافة' : 'Add'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          
          {/* TAB: POS MODE */}
          {activeTab === 'pos' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full relative">
              {/* Left Column: Products Grid & Category Filter */}
              <div className="flex-1 space-y-6 flex flex-col min-h-0 overflow-hidden">
                
                {/* Mode Toggle (Sales vs Restock) */}
                <div className="flex p-1 bg-surface-container-high border border-white/5 rounded-xl self-start">
                  <button
                    onClick={() => setPosMode('sales')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border-none ${posMode === 'sales' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                    {t('modeSelling', 'Selling')}
                  </button>
                  <button
                    onClick={() => setPosMode('restock')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border-none ${posMode === 'restock' ? 'bg-primary text-white shadow-[0_0_15px_rgba(192,193,255,0.4)]' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">inventory</span>
                    {t('modeRestock', 'Restock')}
                  </button>
                </div>

                {/* Search & Categories Selector */}
                <div className="flex flex-col gap-4 shrink-0">
                  <div className="relative flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30 focus-within:border-primary/50 transition-all group shadow-inner">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">search</span>
                    <input
                      className="bg-transparent border-none outline-none ml-3 w-full text-on-surface text-label-md placeholder:text-outline-variant"
                      placeholder={t('searchProductPlaceholder', 'Search product...')}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Mobile: dropdown */}
                  <div className="block sm:hidden">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[18px] pointer-events-none">category</span>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-surface-container-high border border-primary/30 text-on-surface text-sm font-semibold rounded-xl pl-10 pr-4 py-2.5 outline-none appearance-none cursor-pointer shadow-[0_0_12px_rgba(192,193,255,0.15)] focus:border-primary/60"
                      >
                        {categories.map((cat) => {
                          const count = cat.id === 'all' ? products.length : products.filter(p => p.category === cat.id).length;
                          return (
                            <option key={cat.id} value={cat.id}>
                              {getCategoryLabel(cat.id)} ({count})
                            </option>
                          );
                        })}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {/* Desktop: pill buttons */}
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    {categories.map((cat) => {
                      const count = cat.id === 'all'
                        ? products.length
                        : products.filter(p => p.category === cat.id).length;
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-primary text-on-primary border-primary shadow-[0_0_12px_rgba(192,193,255,0.4)]'
                              : 'bg-surface-container-high/50 text-on-surface-variant border-white/5 hover:bg-white/10 hover:text-on-surface'
                          }`}
                        >
                          {getCategoryLabel(cat.id)}
                          <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-white/10 text-on-surface-variant'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin pb-24 lg:pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredProducts.map((product) => {
                      const img = product.images && product.images.length > 0 ? product.images[0] : null;
                      const selectedEntry = cart.find((item) => item.product._id === product._id);
                      const iconMap = {
                        phone: 'smartphone', 'feature-phone': 'phone_android', tablet: 'tablet_mac',
                        headphones: 'headphones', watch: 'watch', charger: 'charger', cable: 'cable',
                        'screen-protector': 'screen_lock_portrait', case: 'phonelink_ring',
                        cover: 'phonelink_ring', accessories: 'devices_other'
                      };
                      const fallbackIcon = iconMap[product.category] || 'inventory_2';

                      const isEditing = !!editingProduct[product._id];
                      const edits = editingProduct[product._id] || {};

                      return (
                        <div
                          key={product._id}
                          className={`relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-300 group flex flex-col justify-between shadow-lg ${
                            isEditing
                              ? 'border-primary/60 shadow-[0_0_20px_rgba(192,193,255,0.2)]'
                              : selectedEntry
                                ? 'border-secondary/70 shadow-[0_0_20px_rgba(93,230,255,0.2)] bg-surface-container/60'
                                : 'border-white/5 hover:border-secondary/40'
                          }`}
                        >
                          {/* Edit toggle button */}
                          <button
                            onClick={() => isEditing ? cancelEditProduct(product._id) : startEditProduct(product)}
                            className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer border-none ${
                              isEditing ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-primary opacity-0 group-hover:opacity-100'
                            }`}
                            title={isEditing ? 'Cancel edit' : 'Edit product'}
                          >
                            <span className="material-symbols-outlined text-[15px]">{isEditing ? 'close' : 'edit'}</span>
                          </button>

                          {/* Delete button */}
                          {!isEditing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product._id); }}
                              className="absolute top-3 right-11 w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer border-none bg-white/5 text-on-surface-variant hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100"
                              title="Delete product"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          )}

                          <div className="flex items-start gap-4">
                            <div 
                              onClick={() => img && setPreviewImage({ url: img, name: product.name })}
                              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group/img ${
                                img ? 'cursor-pointer' : ''
                              }`}
                              title={img ? "Click to view full image" : ""}
                            >
                              {img ? (
                                <>
                                  <img src={img} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-white text-[22px]">zoom_in</span>
                                  </div>
                                </>
                              ) : null}
                              <span className="material-symbols-outlined text-outline text-[40px]" style={{ display: img ? 'none' : 'block' }}>{fallbackIcon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                /* ── Edit mode fields ── */
                                <div className="space-y-2">
                                  {/* Product Name */}
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">{t('productName', 'Product Name')}</label>
                                    <input
                                      type="text"
                                      value={edits.name || ''}
                                      onChange={(e) => setEditingProduct((prev) => ({ ...prev, [product._id]: { ...edits, name: e.target.value } }))}
                                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white font-bold text-sm outline-none focus:border-primary/60 transition-all"
                                      placeholder={t('productName', 'Product Name')}
                                    />
                                  </div>

                                  {/* Category */}
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">{t('categories', 'Category')}</label>
                                    <select
                                      value={edits.category}
                                      onChange={(e) => setEditingProduct((prev) => ({ ...prev, [product._id]: { ...edits, category: e.target.value } }))}
                                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary/60 transition-all"
                                    >
                                      {categories.filter(c => c.id !== 'all').map(c => (
                                        <option key={c.id} value={c.id} className="bg-[#0f1729]">{getCategoryLabel(c.id)}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {/* Price & Stock */}
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">{t('price', 'Price')} ({t('currency', 'DA')})</label>
                                      <input
                                        type="number" min="0"
                                        value={edits.price}
                                        onChange={(e) => setEditingProduct((prev) => ({ ...prev, [product._id]: { ...edits, price: e.target.value } }))}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-secondary font-mono font-bold text-sm outline-none focus:border-primary/60 transition-all"
                                      />
                                    </div>
                                    <div className="w-20">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">{t('stockLabel', 'Stock')}</label>
                                      <input
                                        type="number" min="0"
                                        value={edits.stock}
                                        onChange={(e) => setEditingProduct((prev) => ({ ...prev, [product._id]: { ...edits, stock: e.target.value } }))}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono font-bold text-sm outline-none focus:border-primary/60 transition-all"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* ── View mode ── */
                                <>
                                  <h3 className="font-bold text-base text-on-surface truncate pr-8 mb-2">{product.name}</h3>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-on-surface-variant inline-block">
                                      {getProductCategoryBadge(product.category)}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${
                                      (product.stock ?? 0) > 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (product.stock ?? 0) > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>{t('stockLabel', 'Stock')}: {product.stock ?? 0}</span>
                                  </div>
                                  <p className="text-xl font-bold font-mono text-secondary mt-2">{formatDA(product.price)}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            /* Save button */
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <button
                                onClick={() => saveEditProduct(product._id)}
                                disabled={edits.saving}
                                className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer border-none flex items-center justify-center gap-2"
                              >
                                {edits.saving ? (
                                  <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> {t('savingChanges', 'Saving...')}</>
                                ) : (
                                  <><span className="material-symbols-outlined text-[16px]">save</span> {t('saveChanges', 'Save Changes')}</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                              {selectedEntry ? (
                                <span className="text-sm font-bold text-secondary flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping" /> {selectedEntry.quantity} {t('selectedQty', 'selected')}
                                </span>
                              ) : (
                                <span className="text-xs text-on-surface-variant font-medium"></span>
                              )}
                              <button
                                onClick={() => addToCart(product)}
                                className="w-12 h-12 rounded-xl bg-secondary text-[#0b1326] flex items-center justify-center shadow-[0_0_15px_rgba(93,230,255,0.4)] hover:shadow-[0_0_25px_rgba(93,230,255,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-none shrink-0 ml-auto"
                                title="Add to cart"
                              >
                                <span className="material-symbols-outlined text-[26px] font-bold">add</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cart — fixed bottom sheet on mobile, fixed panel on desktop */}
              {/* Mobile floating cart button */}
              <div className="fixed bottom-6 right-4 z-30 lg:hidden">
                <button
                  onClick={() => setMobileCartOpen(true)}
                  className="relative flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm shadow-xl bg-primary text-white active:scale-95 transition-all cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                  {t('cart', 'Cart')}
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-secondary text-[#0b1326] text-[11px] font-bold flex items-center justify-center">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile cart overlay */}
              {mobileCartOpen && (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                  onClick={() => setMobileCartOpen(false)}
                />
              )}

              {/* Cart panel */}
              <div className={`
                fixed bottom-0 left-0 right-0 z-50 lg:static
                lg:w-96 lg:flex lg:flex-col lg:h-full
                bg-surface/90 lg:bg-surface/80 backdrop-blur-xl rounded-t-3xl lg:rounded-3xl
                border border-white/10 flex flex-col shadow-2xl overflow-hidden
                transition-transform duration-300 ease-in-out
                ${mobileCartOpen ? 'translate-y-0 max-h-[80vh]' : 'translate-y-full lg:translate-y-0'}
              `}>
                <div className={`p-4 border-b border-white/5 flex items-center justify-between ${posMode === 'sales' ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                  {/* drag handle on mobile */}
                  <div className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {posMode === 'sales' ? `🛒 ${t('currentSale', 'Current Sale')}` : `📦 ${t('restockPurchase', 'Restock Purchase')}`}
                  </h2>
                  <button onClick={() => setMobileCartOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-1">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 italic py-12">{t('cartIsEmpty', 'Cart is empty')}</div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product._id} className="bg-black/40 rounded-2xl p-4 border border-white/5 relative group">
                        <button onClick={() => removeCartItem(item.product._id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        <h4 className="font-semibold text-white truncate pr-4">{item.product.name}</h4>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center bg-black/60 rounded-lg overflow-hidden border border-white/10">
                            <button onClick={() => updateCartItem(item.product._id, 'quantity', item.quantity - 1)} className="px-3 py-1 hover:bg-white/10 text-gray-300">-</button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(item.product._id, 'quantity', Number(e.target.value))}
                              className="w-12 bg-transparent text-center font-mono text-sm text-white border-none outline-none focus:ring-0 focus:border-none focus:outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:margin-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:margin-0 [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => updateCartItem(item.product._id, 'quantity', item.quantity + 1)} className="px-3 py-1 hover:bg-white/10 text-gray-300">+</button>
                          </div>
                          <div className="flex-1 flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">{t('unitPrice', 'Unit Price')}</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateCartItem(item.product._id, 'unitPrice', Number(e.target.value))}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-right font-mono font-bold text-primary focus:border-primary/50 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 sm:p-6 bg-black/40 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 font-medium text-sm">
                      {posMode === 'sales' ? t('totalRevenue', 'Total Revenue') : t('totalCost', 'Total Cost')}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-right font-mono font-bold text-xl sm:text-2xl text-white outline-none w-36 sm:w-44 focus:border-primary/50"
                        placeholder="0"
                        value={customTotal !== null ? customTotal : cart.reduce((sum, item) => sum + item.totalPrice, 0)}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          setCustomTotal(val);
                        }}
                      />
                      <span className="text-lg font-bold text-gray-400">{t('currency', 'DA')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckoutPOS(customTotal)}
                    disabled={cart.length === 0 || submitting}
                    className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg text-white bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(var(--color-primary),0.3)] cursor-pointer border-none"
                  >
                    {submitting ? t('loading', 'Processing...') : posMode === 'sales' ? t('completeSale', 'Complete Sale') : t('confirmRestock', 'Confirm Restock')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NEW TRANSACTION */}
          {activeTab === 'new' && (
            <div className="max-w-lg mx-auto py-4">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(192,193,255,0.15)]">
                  <span className="material-symbols-outlined text-primary text-[32px]">receipt_long</span>
                </div>
                <h2 className="text-2xl font-bold text-white">New Transaction</h2>
                <p className="text-gray-400 text-sm mt-1">Record a manual income or expense</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Type Selector — two big cards */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'purchase' })}
                    className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 font-bold transition-all cursor-pointer ${
                      formData.type === 'purchase'
                        ? 'bg-primary/15 border-primary text-white shadow-[0_0_20px_rgba(192,193,255,0.25)]'
                        : 'bg-surface-container/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[28px] ${formData.type === 'purchase' ? 'text-primary' : 'text-gray-500'}`}>arrow_upward</span>
                    <span className="text-sm">Purchase</span>
                    <span className={`text-[10px] font-normal ${formData.type === 'purchase' ? 'text-primary/70' : 'text-gray-600'}`}>Money Out</span>
                    {formData.type === 'purchase' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'sale' })}
                    className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 font-bold transition-all cursor-pointer ${
                      formData.type === 'sale'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                        : 'bg-surface-container/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[28px] ${formData.type === 'sale' ? 'text-emerald-400' : 'text-gray-500'}`}>arrow_downward</span>
                    <span className="text-sm">Sale</span>
                    <span className={`text-[10px] font-normal ${formData.type === 'sale' ? 'text-emerald-400/70' : 'text-gray-600'}`}>Money In</span>
                    {formData.type === 'sale' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                      </span>
                    )}
                  </button>
                </div>

                {/* Description */}
                <div className="bg-surface-container/40 backdrop-blur rounded-2xl border border-white/8 p-4 space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary">notes</span>
                    Description
                  </label>
                  <input
                    required
                    placeholder={formData.type === 'purchase' ? 'e.g. Electricity bill, Supplier payment...' : 'e.g. Walk-in sale, Online order...'}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-600 pt-1"
                  />
                </div>

                {/* Amount */}
                <div className="bg-surface-container/40 backdrop-blur rounded-2xl border border-white/8 p-4 space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                    Total Amount
                  </label>
                  <div className="flex items-baseline gap-2 pt-1">
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.totalPrice}
                      onChange={e => setFormData({...formData, totalPrice: e.target.value})}
                      className="flex-1 bg-transparent border-none outline-none text-white font-mono font-bold text-3xl placeholder:text-gray-700"
                      placeholder="0"
                    />
                    <span className="text-gray-400 font-bold text-lg">DA</span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    formData.type === 'purchase'
                      ? 'bg-primary text-white shadow-[0_0_25px_rgba(192,193,255,0.3)] hover:shadow-[0_0_35px_rgba(192,193,255,0.5)]'
                      : 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {submitting ? 'hourglass_empty' : formData.type === 'purchase' ? 'add_circle' : 'check_circle'}
                  </span>
                  {submitting ? 'Recording...' : `Record ${formData.type === 'purchase' ? 'Purchase' : 'Sale'}`}
                </button>
              </form>
            </div>
          )}

          {/* TAB: LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              
              {/* Advanced Filter Panel */}
              <div className="bg-surface/50 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-3">
                {/* Row 1: Search — always full width */}
                <div className={`relative flex items-center rounded-xl px-3.5 py-2 border transition-all duration-300 group w-full ${
                  ledgerSearch ? 'bg-[#6366f1]/30 border-[#6366f1]/70 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white font-semibold' : 'bg-black/40 border-white/5 focus-within:border-primary/50'
                }`}>
                  <span className={`material-symbols-outlined transition-colors text-[18px] ${ledgerSearch ? 'text-white' : 'text-gray-500 group-focus-within:text-primary'}`}>search</span>
                  <input
                    className="bg-transparent border-none outline-none ml-2 w-full text-white text-sm placeholder:text-gray-500 pr-1"
                    placeholder="Search description..."
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                  />
                  {ledgerSearch && (
                    <button
                      type="button"
                      onClick={() => setLedgerSearch('')}
                      className="text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0.5 flex items-center justify-center shrink-0"
                      title="Clear search"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Row 2: Date, Type, Sync Mode, Clear All — 2 cols on mobile, inline on desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                  {/* Filter Date */}
                  <div className={`relative flex items-center rounded-xl px-3 py-2 border transition-all duration-300 sm:flex-1 sm:min-w-[170px] sm:max-w-[220px] ${
                    ledgerDate ? 'bg-[#6366f1]/30 border-[#6366f1]/70 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white font-semibold' : 'bg-black/40 border-white/5 focus-within:border-primary/50'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] mr-1.5 shrink-0 ${ledgerDate ? 'text-white' : 'text-gray-500'}`}>calendar_today</span>
                    <input
                      type="date"
                      className="bg-transparent border-none outline-none w-full text-white text-xs custom-date-picker min-w-0"
                      value={ledgerDate}
                      onChange={(e) => setLedgerDate(e.target.value)}
                    />
                    {ledgerDate && (
                      <button
                        type="button"
                        onClick={() => setLedgerDate('')}
                        className="text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0.5 flex items-center justify-center shrink-0 ml-0.5"
                        title="Clear date"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    )}
                  </div>

                  {/* Type Filter */}
                  <div className="relative flex items-center sm:flex-1 sm:min-w-[160px] sm:max-w-[200px]">
                    <select
                      className={`w-full border rounded-xl px-3 py-2 text-white text-xs outline-none transition-all duration-300 appearance-none ${
                        ledgerTypeFilter !== 'all' ? 'bg-[#6366f1]/30 border-[#6366f1]/70 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white font-semibold pr-7' : 'bg-black/40 border-white/5 focus:border-primary/50 pr-6'
                      }`}
                      value={ledgerTypeFilter}
                      onChange={(e) => setLedgerTypeFilter(e.target.value)}
                    >
                      <option value="all" className="bg-[#171f33]">All Types</option>
                      <option value="sale" className="bg-[#171f33]">Sales Only</option>
                      <option value="purchase" className="bg-[#171f33]">Purchases Only</option>
                      <option value="canceled" className="bg-[#171f33]">Canceled Only</option>
                    </select>
                    {ledgerTypeFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => setLedgerTypeFilter('all')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0.5 flex items-center justify-center"
                        title="Reset type filter"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    ) : (
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] pointer-events-none">expand_more</span>
                    )}
                  </div>

                  {/* Stock Sync Filter */}
                  <div className="relative flex items-center sm:flex-1 sm:min-w-[190px] sm:max-w-[240px]">
                    <select
                      className={`w-full border rounded-xl px-3 py-2 text-white text-xs outline-none transition-all duration-300 appearance-none ${
                        ledgerSyncFilter !== 'all' ? 'bg-[#6366f1]/30 border-[#6366f1]/70 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white font-semibold pr-7' : 'bg-black/40 border-white/5 focus:border-primary/50 pr-6'
                      }`}
                      value={ledgerSyncFilter}
                      onChange={(e) => setLedgerSyncFilter(e.target.value)}
                    >
                      <option value="all" className="bg-[#171f33]">All Sync Modes</option>
                      <option value="sync" className="bg-[#171f33]">Inventory Synced</option>
                      <option value="no_sync" className="bg-[#171f33]">General Expenses</option>
                    </select>
                    {ledgerSyncFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => setLedgerSyncFilter('all')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0.5 flex items-center justify-center"
                        title="Reset sync filter"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    ) : (
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] pointer-events-none">expand_more</span>
                    )}
                  </div>

                  {/* Clear All Filters */}
                  {(ledgerSearch || ledgerDate || ledgerTypeFilter !== 'all' || ledgerSyncFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setLedgerSearch('');
                        setLedgerDate('');
                        setLedgerTypeFilter('all');
                        setLedgerSyncFilter('all');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-500/20 border border-red-500/40 hover:bg-red-500/35 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:shrink-0 sm:ml-auto"
                    >
                      <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions List - mobile cards + desktop table */}
              <div className="bg-surface/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">

                {/* Mobile card view */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">No transactions match your current filters.</div>
                  ) : filteredTransactions.map((tx) => (
                    <div key={tx._id} className="p-4 flex flex-col gap-2 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          tx.type === 'sale'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'canceled'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>{tx.type.toUpperCase()}</span>
                        <span className={`font-mono font-bold text-base ${tx.type === 'sale' ? 'text-emerald-400' : tx.type === 'canceled' ? 'text-amber-400' : 'text-red-400'}`}>
                          {tx.type === 'sale' ? '+' : '-'}{formatDA(tx.totalPrice)}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm">{tx.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs font-mono" dir="ltr">{formatDate(tx.createdAt)}</span>
                        <div className="flex gap-2">
                          {tx.type !== 'canceled' && (
                            <button
                              onClick={() => handleCancelTransaction(tx)}
                              className="text-amber-500/60 hover:text-amber-500 text-xs font-bold px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-all"
                            >Cancel</button>
                          )}
                          <button
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="text-red-500/60 hover:text-red-500 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                          >Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/40 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                        <th className="p-5 font-semibold">{t('date', 'Date')}</th>
                        <th className="p-5 font-semibold">{t('type', 'Type')}</th>
                        <th className="p-5 font-semibold">{t('description', 'Description')}</th>
                        <th className="p-5 font-semibold">{t('quantity', 'Qty')}</th>
                        <th className="p-5 font-semibold text-right">{t('amount', 'Amount')}</th>
                        <th className="p-5 font-semibold text-center">{t('stockSync', 'Stock Sync')}</th>
                        <th className="p-5 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-12 text-center text-gray-500 italic">
                            No transactions match your current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-5 text-gray-300 text-sm font-mono" dir="ltr">{formatDate(tx.createdAt)}</td>
                            <td className="p-5">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                tx.type === 'sale'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : tx.type === 'canceled'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-5 text-white font-medium">{tx.description}</td>
                            <td className="p-5 text-gray-400 font-mono">{tx.updateStock ? tx.quantity : '-'}</td>
                            <td className={`p-5 font-mono font-bold text-right ${tx.type === 'sale' ? 'text-emerald-400' : tx.type === 'canceled' ? 'text-amber-400' : 'text-red-400'}`}>
                              {tx.type === 'sale' ? '+' : '-'}{formatDA(tx.totalPrice)}
                            </td>
                            <td className="p-5 text-center">
                              {tx.updateStock ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                {tx.type !== 'canceled' && (
                                  <button
                                    onClick={() => handleCancelTransaction(tx)}
                                    className="text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 px-3 py-1.5 rounded-xl transition-all text-xs font-bold"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTransaction(tx._id)}
                                  className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition-all text-xs font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Product Modal (Combined Create + Purchase) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-surface-container/90 border border-secondary/30 rounded-3xl p-6 lg:p-8 w-full max-w-2xl shadow-[0_0_50px_rgba(93,230,255,0.1)] overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display-sm text-2xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">add_circle</span>
                Add New Product to Inventory
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-white/5"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {createError && (
              <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Product Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                      placeholder="e.g. iPhone 13 Pro Max"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Category *
                    </label>
                    <select
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      {categories.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>{getCategoryLabel(cat.id)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                      Total Purchase Cost (DA) *
                    </label>
                    <p className="text-[10px] text-red-300/70 mb-2">How much did you pay for this initial batch?</p>
                    <input
                      required
                      type="number"
                      min="0"
                      className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-white font-mono font-bold text-xl focus:border-red-400 outline-none transition-all"
                      placeholder="e.g. 50000"
                      value={newProduct.purchaseCost}
                      onChange={(e) => setNewProduct({ ...newProduct, purchaseCost: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                 <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Selling Price (DA) (Optional - defaults to unit cost)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-surface-container-high border border-secondary/30 rounded-xl px-4 py-3 text-secondary font-mono font-bold text-lg focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                        placeholder="e.g. 65000"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Initial Stock Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-3 text-on-surface font-mono focus:border-secondary outline-none transition-all"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      />
                    </div>
                 </div>

                 <div className="flex flex-col">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Product Image (Optional)
                    </label>
                    <div className="flex-1 bg-surface-container-high border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group min-h-[120px]">
                      {newProduct.images ? (
                        <>
                          <img src={newProduct.images} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white mb-2">swap_horiz</span>
                            <span className="text-xs text-white font-bold">Change Image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-outline-variant text-[32px] mb-2 group-hover:text-secondary transition-colors">add_photo_alternate</span>
                          <span className="text-xs text-on-surface-variant font-medium group-hover:text-secondary transition-colors">Click to upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-8 py-3 rounded-xl bg-secondary text-[#0b1326] font-bold shadow-[0_0_20px_rgba(93,230,255,0.4)] hover:shadow-[0_0_30px_rgba(93,230,255,0.6)] transition-all cursor-pointer border-none disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProduct ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Create & Record Purchase
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[90vh] bg-surface-container/95 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title & Close */}
            <div className="w-full flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
              <h3 className="font-bold text-lg text-white truncate">{previewImage.name}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {/* Image display */}
            <div className="w-full flex-1 overflow-hidden flex items-center justify-center max-h-[70vh] rounded-2xl bg-black/50 p-2">
              <img 
                src={previewImage.url} 
                alt={previewImage.name} 
                className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
