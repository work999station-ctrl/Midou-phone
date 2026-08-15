import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminSales() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [submittingSales, setSubmittingSales] = useState(false);

  // Today's total sales (from backend)
  const [totalSalesToday, setTotalSalesToday] = useState(0);
  const [todayProductSales, setTodayProductSales] = useState({});

  // Current Selection (Cart/Order) list:
  // Each item: { product, quantity: number, customPrice: number }
  const [selectedItems, setSelectedItems] = useState([]);

  // Delete Product State
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [createError, setCreateError] = useState('');
  const [imageTab, setImageTab] = useState('file'); // 'file' or 'url'
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'phone',
    price: '',
    stock: 10,
    images: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Format currency in DA
  const formatDA = (num) => (num || 0).toLocaleString('en-US') + ' DA';

  // Fetch internal storage products for POS (fallback to public products if empty)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/internal-storage');
      if (!res.ok) throw new Error('Failed to fetch internal storage');
      let data = await res.json();

      // Fallback to public products catalog if internal storage is empty initially
      if (!data || data.length === 0) {
        const publicRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/products');
        if (publicRes.ok) {
          data = await publicRes.json();
        }
      }
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's sales from dashboard top-selling endpoint
  const fetchTodaySales = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/dashboard/top-selling');
      if (!res.ok) throw new Error('Failed to fetch sales');
      const salesData = await res.json();

      const salesMap = {};
      let totalRev = 0;
      salesData.forEach((item) => {
        salesMap[item._id] = {
          quantity: item.quantitySold,
          revenue: item.totalRevenue
        };
        totalRev += item.totalRevenue;
      });
      setTodayProductSales(salesMap);
      setTotalSalesToday(totalRev);
    } catch (err) {
      console.error('Error loading today sales:', err.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTodaySales();
  }, []);

  // Add product to current selection when clicking '+' on product card
  const handleSelectProduct = (product) => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product._id === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            customPrice: product.price
          }
        ];
      }
    });
  };

  // Update quantity of selected item
  const handleUpdateQuantity = (productId, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Set exact quantity
  const handleSetQuantity = (productId, qty) => {
    const parsed = parseInt(qty, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    setSelectedItems((prev) =>
      prev.map((item) => (item.product._id === productId ? { ...item, quantity: parsed } : item))
    );
  };

  // Update custom price of selected item before adding
  const handleUpdatePrice = (productId, newPrice) => {
    const parsed = parseFloat(newPrice);
    if (isNaN(parsed) || parsed < 0) return;
    setSelectedItems((prev) =>
      prev.map((item) => (item.product._id === productId ? { ...item, customPrice: parsed } : item))
    );
  };

  // Remove item from selection
  const handleRemoveItem = (productId) => {
    setSelectedItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  // Clear current selection
  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  // Calculate total of current selection
  const currentSelectionTotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.customPrice,
    0
  );

  // Submit current selection to backend & update Today Total Sales
  const handleConfirmAndAddSales = async () => {
    if (selectedItems.length === 0) return;
    setSubmittingSales(true);

    try {
      const payload = {
        items: selectedItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          price: item.customPrice
        }))
      };

      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/dashboard/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to submit sales');

      // Clear selection
      setSelectedItems([]);

      // Refresh today sales summary
      await fetchTodaySales();
    } catch (err) {
      console.error('Error confirming sale:', err.message);
    } finally {
      setSubmittingSales(false);
    }
  };

  // Handle Image File Selection from Device
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCreateError('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct((prev) => ({ ...prev, images: reader.result }));
      setCreateError('');
    };
    reader.readAsDataURL(file);
  };

  // Handle Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      setCreateError('Please enter product name and price.');
      return;
    }
    setSavingProduct(true);
    setCreateError('');

    try {
      // 1. Create in Internal Storage (Sales Page POS)
      const resInternal = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/internal-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category: newProduct.category,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock) || 10,
          images: newProduct.images.trim() ? [newProduct.images.trim()] : []
        })
      });

      if (!resInternal.ok) {
        const errData = await resInternal.json();
        throw new Error(errData.message || 'Failed to create product in internal storage');
      }

      const createdItem = await resInternal.json();

      // 2. Create in Public Shop Catalog (Product model for Shop Page)
      try {
        await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProduct.name.trim(),
            category: newProduct.category,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock) || 10,
            description: `${newProduct.name.trim()} - ${newProduct.category}`,
            images: newProduct.images.trim() ? [newProduct.images.trim()] : []
          })
        });
      } catch (e) {
        console.warn('Shop product sync warning:', e.message);
      }

      // 3. Record initial sale so product appears in Top Selling Products on Admin Dashboard
      try {
        await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/dashboard/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: createdItem._id,
            quantity: 1,
            price: Number(newProduct.price)
          })
        });
      } catch (e) {
        console.warn('Dashboard top selling sync warning:', e.message);
      }

      await fetchProducts();

      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: 'phone',
        price: '',
        stock: 10,
        images: ''
      });
    } catch (err) {
      console.error('Create product error:', err.message);
      setCreateError(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete Product Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Confirm Delete Product from Popup Modal
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const productId = productToDelete._id;
    setIsDeleting(true);
    try {
      // Attempt internal storage deletion first
      let res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/internal-storage/${productId}`, {
        method: 'DELETE'
      });
      // Fallback to public products catalog if not found in internal storage
      if (!res.ok) {
        res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/products/${productId}`, {
          method: 'DELETE'
        });
      }
      if (!res.ok) throw new Error('Failed to delete product');

      // Remove product from state
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setSelectedItems((prev) => prev.filter((item) => item.product._id !== productId));
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Categories list
  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'phone', label: 'Smartphones' },
    { id: 'tablet', label: 'Tablets' },
    { id: 'headphones', label: 'Audio & Headphones' },
    { id: 'charger', label: 'Chargers' },
    { id: 'cable', label: 'Cables' },
    { id: 'screen-protector', label: 'Screen Protectors' },
    { id: 'case', label: 'Cases & Covers' },
    { id: 'accessories', label: 'Accessories' }
  ];

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen relative overflow-hidden">
      {/* Sidebar Component */}
      <AdminSidebar />

      {/* Main Container */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 h-20 bg-[#0b1326]/80 backdrop-blur-[20px] border-b border-white/5 z-40 flex items-center justify-between px-4 lg:px-8">
          <div className="flex-1 max-w-xl hidden sm:block">
            <div className="relative flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30 focus-within:border-primary/50 transition-all group shadow-inner">
              <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">search</span>
              <input
                className="bg-transparent border-none outline-none ml-3 w-full text-on-surface text-label-md placeholder:text-outline-variant"
                placeholder="Search product name or category..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 ml-auto">
            {/* Add Product Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-[#0b1326] font-bold text-sm shadow-[0_0_15px_rgba(93,230,255,0.3)] hover:shadow-[0_0_25px_rgba(93,230,255,0.6)] hover:scale-105 transition-all cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              Add Product
            </button>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-white/10 hover:border-primary/50 text-on-surface transition-all cursor-pointer text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              Dashboard
            </button>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(192,193,255,0.3)] border-2 border-primary/20">
              <span className="material-symbols-outlined text-on-primary text-[24px]">person</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 space-y-8 animate-[fadeInUp_0.5s_ease-out]">
          {/* Top Title & Cards Area: Today Sales + Current Selection Total */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface tracking-tight">
                Quick Sales POS
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">
                Click <span className="text-secondary font-bold">+</span> to select products, edit quantity/price on the right, or click <span className="text-secondary font-bold">+ Add Product</span> to add new inventory.
              </p>
            </div>

            {/* Top Right Box Pair: Today Total Sales + Current Selection Total */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              {/* Today Total Sales Box */}
              <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-md flex-1 sm:flex-none">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Today Total Sales</p>
                  <p className="text-lg font-bold font-mono text-on-surface">{formatDA(totalSalesToday)}</p>
                </div>
              </div>

              {/* Current Selection Total Box (Top Right Beside Today Total Sales) */}
              <div className="bg-surface-container/80 backdrop-blur-xl border border-secondary/40 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_25px_rgba(93,230,255,0.2)] flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    Selected Total
                    {selectedItems.length > 0 && (
                      <span className="bg-secondary text-[#0b1326] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                        {selectedItems.reduce((acc, i) => acc + i.quantity, 0)} items
                      </span>
                    )}
                  </p>
                  <p className="text-xl font-bold font-mono text-secondary">{formatDA(currentSelectionTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout: Products Grid (Left) + Current Selection Editor Drawer/Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols (or full width if no items): Products Grid & Category Filter */}
            <div className={`${selectedItems.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
              {/* Categories Selector */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                        selectedCategory === cat.id
                          ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(192,193,255,0.4)]'
                          : 'bg-surface-container-high/50 text-on-surface-variant border-white/5 hover:bg-white/10 hover:text-on-surface'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Cards Grid: 3 COLUMNS PER LINE */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-surface-container/40 rounded-2xl p-5 border border-white/5 h-44 animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-surface-container/40 rounded-2xl p-12 border border-white/5 text-center flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">inventory_2</span>
                  <p className="text-on-surface text-base font-semibold">No products found</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-secondary text-[#0b1326] text-xs font-bold border-none cursor-pointer"
                  >
                    + Add First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const img = product.images && product.images.length > 0 ? product.images[0] : null;
                    const saleInfo = todayProductSales[product._id] || { quantity: 0, revenue: 0 };
                    const selectedEntry = selectedItems.find((item) => item.product._id === product._id);

                    const iconMap = {
                      phone: 'smartphone',
                      'feature-phone': 'phone_android',
                      tablet: 'tablet_mac',
                      headphones: 'headphones',
                      watch: 'watch',
                      charger: 'charger',
                      cable: 'cable',
                      'screen-protector': 'screen_lock_portrait',
                      case: 'phonelink_ring',
                      cover: 'phonelink_ring',
                      accessories: 'devices_other'
                    };
                    const fallbackIcon = iconMap[product.category] || 'inventory_2';

                    return (
                      <div
                        key={product._id}
                        className={`relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-300 group flex flex-col justify-between shadow-lg ${
                          selectedEntry
                            ? 'border-secondary/70 shadow-[0_0_20px_rgba(93,230,255,0.2)] bg-surface-container/60'
                            : 'border-white/5 hover:border-secondary/40'
                        }`}
                      >
                        {/* Delete Product Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 bg-transparent border-none cursor-pointer z-10"
                          title="Delete product item"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>

                        {/* Top Row: Photo + Product Info */}
                        <div className="flex items-start gap-4">
                          {/* Product Photo */}
                          <div className="w-20 h-20 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                            {img ? (
                              <img
                                src={img}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <span
                              className="material-symbols-outlined text-outline text-[32px]"
                              style={{ display: img ? 'none' : 'block' }}
                            >
                              {fallbackIcon}
                            </span>
                          </div>

                          {/* Product Name, Category & Stock Badge */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-on-surface-variant capitalize inline-block">
                                {product.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                                  (product.stock ?? 0) > 5
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : (product.stock ?? 0) > 0
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}
                              >
                                Stock: {product.stock ?? 0}
                              </span>
                            </div>
                            <h3 className="font-headline-sm text-base font-bold text-on-surface truncate group-hover:text-secondary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-lg font-bold font-mono text-secondary mt-1">
                              {formatDA(product.price)}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row: Plus Button & Sales Summary */}
                        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                          {/* Today summary or currently selected count */}
                          <div className="flex flex-col">
                            {selectedEntry ? (
                              <span className="text-xs font-bold text-secondary flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                                {selectedEntry.quantity} selected right now
                              </span>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant font-medium">
                                {saleInfo.quantity > 0 ? (
                                  <span className="text-on-surface-variant opacity-80">
                                    Today: {saleInfo.quantity} sold ({formatDA(saleInfo.revenue)})
                                  </span>
                                ) : (
                                  <span className="opacity-50">0 sold today</span>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Plus (+) Icon Button */}
                          <button
                            onClick={() => handleSelectProduct(product)}
                            className="w-11 h-11 rounded-xl bg-secondary text-[#0b1326] flex items-center justify-center shadow-[0_0_15px_rgba(93,230,255,0.4)] hover:shadow-[0_0_25px_rgba(93,230,255,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-none shrink-0"
                            title="Add to current selection (+1)"
                          >
                            <span className="material-symbols-outlined text-[26px] font-bold">add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Panel: Current Selection Editor Drawer */}
            {selectedItems.length > 0 && (
              <div className="lg:col-span-4 bg-surface-container/60 backdrop-blur-2xl border border-secondary/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(93,230,255,0.15)] sticky top-24 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[24px]">edit_note</span>
                    <h2 className="font-headline-sm text-lg font-bold text-on-surface">Current Selection</h2>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-on-surface-variant hover:text-error transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    Clear All
                  </button>
                </div>

                {/* Selected Items List */}
                <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {selectedItems.map((item) => {
                    const img = item.product.images && item.product.images.length > 0 ? item.product.images[0] : null;
                    const itemTotal = item.quantity * item.customPrice;

                    return (
                      <div
                        key={item.product._id}
                        className="bg-surface-container-high/60 border border-white/10 rounded-2xl p-4 space-y-3 relative group"
                      >
                        {/* Item Info Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-surface-container border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {img ? (
                              <img 
                                src={img} 
                                alt={item.product.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : (
                              <span className="material-symbols-outlined text-outline">inventory_2</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-on-surface truncate">{item.product.name}</h4>
                            <p className="text-xs text-on-surface-variant capitalize flex items-center gap-1.5">
                              <span>{item.product.category}</span>
                              <span className="opacity-40">•</span>
                              <span className="font-mono text-[10px]">Stock: {item.product.stock ?? 0}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product._id)}
                            className="text-on-surface-variant hover:text-error bg-transparent border-none cursor-pointer p-1 transition-colors"
                            title="Remove item"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>

                        {/* Editable Inputs: Unit Price & Quantity */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs">
                          {/* Unit Price Edit Input */}
                          <div className="flex items-center gap-1">
                            <span className="text-on-surface-variant">Price:</span>
                            <input
                              type="number"
                              className="w-24 bg-surface-container border border-white/20 focus:border-secondary rounded-lg px-2 py-1 text-on-surface font-mono text-xs outline-none"
                              value={item.customPrice}
                              onChange={(e) => handleUpdatePrice(item.product._id, e.target.value)}
                            />
                            <span className="text-on-surface-variant">DA</span>
                          </div>

                          {/* Quantity Counter */}
                          <div className="flex items-center border border-white/20 rounded-lg bg-surface-container overflow-hidden">
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-transparent border-none text-on-surface hover:bg-white/10 cursor-pointer font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className="w-10 text-center bg-transparent border-none text-on-surface font-mono font-bold text-xs outline-none"
                              value={item.quantity}
                              onChange={(e) => handleSetQuantity(item.product._id, e.target.value)}
                            />
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-transparent border-none text-on-surface hover:bg-white/10 cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right text-xs font-mono font-bold text-secondary">
                          Subtotal: {formatDA(itemTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary & Confirm Button */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-on-surface-variant">Current Selection Total</span>
                    <span className="text-2xl font-bold font-mono text-secondary">{formatDA(currentSelectionTotal)}</span>
                  </div>

                  <button
                    onClick={handleConfirmAndAddSales}
                    disabled={submittingSales}
                    className="w-full py-3.5 px-6 rounded-2xl bg-secondary text-[#0b1326] font-bold text-sm shadow-[0_0_20px_rgba(93,230,255,0.4)] hover:shadow-[0_0_30px_rgba(93,230,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    {submittingSales ? 'Adding Sales...' : `Add ${formatDA(currentSelectionTotal)} to Today's Sales`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add New Product Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]">add_box</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Add New Product</h3>
                  <p className="text-xs text-on-surface-variant">Add a product to catalog so it appears in POS</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Error banner if any */}
            {createError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {createError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 16 Pro Max 256GB"
                  className="w-full bg-surface-container border border-white/10 focus:border-secondary rounded-xl px-3.5 py-2.5 text-on-surface text-sm outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>

              {/* Grid: Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Category *</label>
                  <select
                    className="w-full bg-surface-container border border-white/10 focus:border-secondary rounded-xl px-3 py-2.5 text-on-surface text-xs outline-none capitalize"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="phone">Smartphones</option>
                    <option value="feature-phone">Feature Phone</option>
                    <option value="tablet">Tablets</option>
                    <option value="headphones">Audio & Headphones</option>
                    <option value="charger">Chargers</option>
                    <option value="cable">Cables</option>
                    <option value="screen-protector">Screen Protectors</option>
                    <option value="case">Cases</option>
                    <option value="cover">Covers</option>
                    <option value="watch">Smart Watch</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Price (DA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 15000"
                    className="w-full bg-surface-container border border-white/10 focus:border-secondary rounded-xl px-3.5 py-2.5 text-on-surface text-sm font-mono outline-none"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
              </div>

              {/* Initial Stock */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-surface-container border border-white/10 focus:border-secondary rounded-xl px-3.5 py-2.5 text-on-surface text-xs font-mono outline-none"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                />
              </div>

              {/* Product Image Selection: Device File Picker / URL */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-on-surface-variant font-medium">Product Image</label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageTab('file')}
                      className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer border-none ${
                        imageTab === 'file' ? 'bg-secondary text-[#0b1326] font-bold' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                      }`}
                    >
                      From Device
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer border-none ${
                        imageTab === 'url' ? 'bg-secondary text-[#0b1326] font-bold' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageTab === 'file' ? (
                  <div>
                    <input
                      type="file"
                      id="product-image-file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    {newProduct.images ? (
                      <div className="flex items-center gap-4 bg-surface-container p-3 rounded-2xl border border-secondary/40">
                        <img
                          src={newProduct.images}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-secondary truncate">Image selected from device</p>
                          <p className="text-[10px] text-on-surface-variant/60">Ready to save</p>
                        </div>
                        <label
                          htmlFor="product-image-file"
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-on-surface text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, images: '' })}
                          className="text-error hover:text-error/80 bg-transparent border-none cursor-pointer p-1"
                          title="Remove image"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="product-image-file"
                        className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-secondary/60 bg-surface-container/50 hover:bg-surface-container transition-all cursor-pointer group text-center"
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary border border-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[26px]">upload_file</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">
                            Click to select image from your device
                          </p>
                          <p className="text-[10px] text-on-surface-variant/60 mt-0.5">PNG, JPG, WEBP, GIF up to 5MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or web image link"
                      className="w-full bg-surface-container border border-white/10 focus:border-secondary rounded-xl px-3.5 py-2.5 text-on-surface text-xs outline-none"
                      value={newProduct.images}
                      onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                    />
                    {newProduct.images && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={newProduct.images} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                        <span className="text-[11px] text-secondary">URL Image Preview</span>
                      </div>
                    )}
                  </div>
                )}
              </div>



              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all text-xs font-semibold bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 rounded-xl bg-secondary text-[#0b1326] font-bold text-xs shadow-[0_0_15px_rgba(93,230,255,0.4)] hover:shadow-[0_0_25px_rgba(93,230,255,0.6)] transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">{savingProduct ? 'hourglass_empty' : 'add'}</span>
                  {savingProduct ? 'Saving Product...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Popup Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.2)] space-y-6 text-center relative overflow-hidden">
            {/* Header Icon */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-[32px]">delete_forever</span>
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="font-bold text-xl text-on-surface">Delete Product?</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Are you sure you want to delete <span className="text-on-surface font-bold">"{productToDelete.name}"</span>? This action will remove it from the Sales POS and cannot be undone.
              </p>
            </div>

            {/* Product Card Preview Pill */}
            <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-3 flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                {productToDelete.images && productToDelete.images.length > 0 ? (
                  <img src={productToDelete.images[0]} alt={productToDelete.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-outline">inventory_2</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-on-surface truncate">{productToDelete.name}</p>
                <p className="text-xs font-mono text-secondary">{formatDA(productToDelete.price)}</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all text-xs font-semibold bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">{isDeleting ? 'hourglass_empty' : 'delete'}</span>
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
