import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import AdminSidebar from '../components/AdminSidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminDebts() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Product suggestions list for auto-fill in modal
  const [products, setProducts] = useState([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingDebt, setSavingDebt] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newDebt, setNewDebt] = useState({
    personName: '',
    productName: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Unpaid'
  });

  // Action loading states
  const [actionId, setActionId] = useState(null);

  // Inline Price Editing state: { debtId, value }
  const [editingPrice, setEditingPrice] = useState(null);
  const [savingPriceId, setSavingPriceId] = useState(null);

  // Save updated debt price
  const handleSavePrice = async (debtId) => {
    const newVal = parseFloat(editingPrice?.value);
    if (isNaN(newVal) || newVal < 0) {
      setEditingPrice(null);
      return;
    }
    setSavingPriceId(debtId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/debts/${debtId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newVal })
      });
      if (!res.ok) throw new Error('Failed to update price');

      setDebts((prev) =>
        prev.map((d) => (d._id === debtId ? { ...d, price: newVal } : d))
      );
    } catch (err) {
      console.error('Error updating debt price:', err.message);
    } finally {
      setSavingPriceId(null);
      setEditingPrice(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Format DA currency
  const formatDA = (num) => (num || 0).toLocaleString('en-US') + ' ' + t('currency', 'DA');

  // Format Date cleanly (strict Day Month Year order)
  const formatDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return '';
    if (lang === 'ar') {
      const monthsAr = [
        'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
        'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return `\u200E${d.getDate()} \u200E${monthsAr[d.getMonth()]} \u200E${d.getFullYear()}`;
    }
    return new Date(dStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Fetch debts from API
  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/debts');
      if (!res.ok) throw new Error('Failed to fetch debts');
      const data = await res.json();
      setDebts(data);
    } catch (err) {
      console.error('Error loading debts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for quick dropdown selection
  const fetchProducts = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/internal-storage');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading product list:', err.message);
    }
  };

  useEffect(() => {
    fetchDebts();
    fetchProducts();
  }, []);

  // Submit New Debt
  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (!newDebt.personName || !newDebt.productName || !newDebt.price) {
      setCreateError('Please fill in person name, product name, and price.');
      return;
    }
    setSavingDebt(true);
    setCreateError('');

    try {
      const payload = {
        personName: newDebt.personName.trim(),
        productName: newDebt.productName.trim(),
        price: Number(newDebt.price),
        date: newDebt.date ? new Date(newDebt.date) : new Date(),
        status: newDebt.status || 'Unpaid'
      };

      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to register debt');
      }

      await fetchDebts();
      setShowAddModal(false);
      setNewDebt({
        personName: '',
        productName: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Unpaid'
      });
    } catch (err) {
      console.error('Create debt error:', err.message);
      setCreateError(err.message);
    } finally {
      setSavingDebt(false);
    }
  };

  // Toggle Debt Status (Unpaid <-> Paid)
  const handleToggleStatus = async (debt) => {
    setActionId(debt._id);
    const newStatus = debt.status === 'Unpaid' ? 'Paid' : 'Unpaid';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/debts/${debt._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');

      setDebts((prev) =>
        prev.map((d) => (d._id === debt._id ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      console.error('Error updating status:', err.message);
    } finally {
      setActionId(null);
    }
  };

  // Delete Debt Record
  const handleDeleteDebt = async (debtId) => {
    if (!window.confirm('Are you sure you want to delete this debt record?')) return;
    setActionId(debtId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/debts/${debtId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete debt');

      setDebts((prev) => prev.filter((d) => d._id !== debtId));
    } catch (err) {
      console.error('Error deleting debt:', err.message);
    } finally {
      setActionId(null);
    }
  };

  // Quick Select product in modal
  const handleSelectSuggestedProduct = (p) => {
    setNewDebt((prev) => ({
      ...prev,
      productName: p.name,
      price: p.price
    }));
  };

  // Calculations for metric summary cards
  const totalUnpaidAmount = debts
    .filter((d) => d.status === 'Unpaid')
    .reduce((sum, d) => sum + (d.price || 0), 0);

  const unpaidCount = debts.filter((d) => d.status === 'Unpaid').length;
  const paidCount = debts.filter((d) => d.status === 'Paid').length;

  // Filtered debts list
  const filteredDebts = debts.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      d.personName.toLowerCase().includes(search.toLowerCase()) ||
      d.productName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const { t, lang } = useLanguageStore();

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
                placeholder={t('search', 'Search by person name or product...')}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-4 ml-auto">
            <LanguageSwitcher compact />
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-[#0b1326] font-bold text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:scale-105 transition-all cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[18px]">post_add</span>
              {t('registerDebt', 'Register Debt')}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 space-y-8 animate-[fadeInUp_0.5s_ease-out]">
          {/* Top Title & Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface tracking-tight">
                {t('debtsRegister', 'Debts Register')}
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">
                {t('debtsSubtitle', 'Track customer debts, person names, products, and payment status.')}
              </p>
            </div>
          </div>

          {/* Metric Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1: Total Unpaid Amount */}
            <div className="relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-red-400/30 transition-all duration-300 group overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <span className="material-symbols-outlined text-[24px]">credit_card_off</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {unpaidCount} {t('pending', 'Pending')}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">{t('totalUnpaidDebts', 'Total Unpaid Debts')}</p>
              <h3 className="text-2xl font-bold font-mono text-red-400">{formatDA(totalUnpaidAmount)}</h3>
            </div>

            {/* Card 2: Total Registered Debts */}
            <div className="relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-all duration-300 group overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {t('total', 'Total')}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">{t('totalRegisteredDebts', 'Total Debts Registered')}</p>
              <h3 className="text-2xl font-bold font-mono text-on-surface">{debts.length} {t('records', 'Records')}</h3>
            </div>
          </div>

          {/* Filter Pills & Search Container */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex gap-2">
              {[
                { id: 'all', label: t('allRecords', 'All Records') },
                { id: 'unpaid', label: t('unpaidOnly', 'Unpaid Only') },
                { id: 'paid', label: t('paidOnly', 'Paid Only') }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    statusFilter === filter.id
                      ? 'bg-amber-400 text-[#0b1326] border-amber-400 font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                      : 'bg-surface-container-high/50 text-on-surface-variant border-white/5 hover:bg-white/10 hover:text-on-surface'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Debts Table */}
          <div className="bg-surface-container/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl overflow-hidden">

            {/* ── MOBILE CARD VIEW ── */}
            <div className="block sm:hidden divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="p-4 animate-pulse space-y-2">
                    <div className="h-4 bg-white/5 rounded-lg w-3/4" />
                    <div className="h-3 bg-white/5 rounded-lg w-1/2" />
                  </div>
                ))
              ) : filteredDebts.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] opacity-30">content_paste_off</span>
                    <p className="text-sm">{t('noDebtRecords', 'No debt records found')}</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-1 px-4 py-2 rounded-xl bg-amber-400 text-[#0b1326] text-xs font-bold border-none cursor-pointer"
                    >
                      + {t('registerDebt', 'Register Debt')}
                    </button>
                  </div>
                </div>
              ) : (
                filteredDebts.map((item) => {
                  const isWorking = actionId === item._id;
                  const isPaid = item.status === 'Paid';
                  return (
                    <div key={item._id} className="p-4 flex flex-col gap-2 hover:bg-white/[0.02] transition-colors">
                      {/* Top row: status badge + amount */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {isPaid ? t('paid', 'Paid') : t('unpaid', 'Unpaid')}
                        </span>
                        {/* Price — click to edit */}
                        {editingPrice && editingPrice.debtId === item._id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              className="w-24 bg-surface-container border border-amber-400 rounded-xl px-2 py-1 text-xs font-mono text-on-surface outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={editingPrice.value}
                              onChange={(e) => setEditingPrice({ ...editingPrice, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePrice(item._id);
                                if (e.key === 'Escape') setEditingPrice(null);
                              }}
                              autoFocus
                            />
                            <button type="button" onClick={() => handleSavePrice(item._id)} disabled={savingPriceId === item._id} className="p-1 rounded-lg bg-amber-400 text-[#0b1326] border-none cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">{savingPriceId === item._id ? 'hourglass_empty' : 'check'}</span>
                            </button>
                            <button type="button" onClick={() => setEditingPrice(null)} className="p-1 rounded-lg bg-white/10 text-on-surface-variant border-none cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingPrice({ debtId: item._id, value: item.price })}
                            className="flex items-center gap-1 cursor-pointer group/price"
                            title="Tap to edit price"
                          >
                            <span className="font-mono font-bold text-base text-on-surface group-hover/price:text-amber-400 transition-colors">{formatDA(item.price)}</span>
                            <span className="material-symbols-outlined text-[14px] text-amber-400/60">edit</span>
                          </div>
                        )}
                      </div>

                      {/* Person + Product */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                          {item.personName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{item.personName}</p>
                          <p className="text-on-surface-variant text-xs truncate">{item.productName}</p>
                        </div>
                      </div>

                      {/* Bottom row: date + actions */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-500 text-xs font-mono" dir="ltr">{formatDate(item.date)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={isWorking}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                              isPaid
                                ? 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                          >
                            {isWorking ? '...' : isPaid ? t('markUnpaid', 'Mark Unpaid') : t('markPaid', 'Mark Paid')}
                          </button>
                          <button
                            onClick={() => handleDeleteDebt(item._id)}
                            disabled={isWorking}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── DESKTOP TABLE VIEW ── */}
            <div className="hidden sm:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 text-on-surface-variant font-label-md text-label-md text-xs">
                    <th className="pb-4 pt-5 px-6 font-normal">#</th>
                    <th className="pb-4 pt-5 font-normal">{t('personName', 'Person Name')}</th>
                    <th className="pb-4 pt-5 font-normal">{t('productName', 'Product Name')}</th>
                    <th className="pb-4 pt-5 font-normal">{t('price', 'Price')} ({t('currency', 'DA')})</th>
                    <th className="pb-4 pt-5 font-normal">{t('date', 'Date')}</th>
                    <th className="pb-4 pt-5 font-normal">{t('status', 'Status')}</th>
                    <th className="pb-4 pt-5 pr-6 font-normal text-right">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm text-on-surface divide-y divide-white/5">
                  {loading ? (
                    [1, 2, 3, 4].map((n) => (
                      <tr key={n} className="animate-pulse">
                        <td colSpan={7} className="py-4 px-6">
                          <div className="h-6 bg-white/5 rounded-lg w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredDebts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[40px] opacity-30">content_paste_off</span>
                          <p className="text-sm">{t('noDebtRecords', 'No debt records found')}</p>
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-1 px-4 py-2 rounded-xl bg-amber-400 text-[#0b1326] text-xs font-bold border-none cursor-pointer"
                          >
                            + {t('registerDebt', 'Register Debt')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDebts.map((item, idx) => {
                      const isWorking = actionId === item._id;
                      const isPaid = item.status === 'Paid';

                      return (
                        <tr key={item._id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4 pl-6 text-on-surface-variant/50 text-xs font-mono">{idx + 1}</td>
                          {/* Person Name */}
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                                {item.personName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-on-surface text-sm group-hover:text-amber-400 transition-colors">
                                {item.personName}
                              </span>
                            </div>
                          </td>

                          {/* Product Name */}
                          <td className="py-4 font-medium text-on-surface-variant">
                            {item.productName}
                          </td>

                          {/* Price (Editable) */}
                          <td className="py-4 font-mono font-bold text-on-surface">
                            {editingPrice && editingPrice.debtId === item._id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  className="w-28 bg-surface-container border border-amber-400 rounded-xl px-2.5 py-1 text-xs font-mono text-on-surface outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={editingPrice.value}
                                  onChange={(e) => setEditingPrice({ ...editingPrice, value: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePrice(item._id);
                                    if (e.key === 'Escape') setEditingPrice(null);
                                  }}
                                  autoFocus
                                />
                                <button type="button" onClick={() => handleSavePrice(item._id)} disabled={savingPriceId === item._id} className="p-1 rounded-lg bg-amber-400 text-[#0b1326] hover:bg-amber-300 border-none cursor-pointer text-xs font-bold" title="Save price">
                                  <span className="material-symbols-outlined text-[14px]">{savingPriceId === item._id ? 'hourglass_empty' : 'check'}</span>
                                </button>
                                <button type="button" onClick={() => setEditingPrice(null)} className="p-1 rounded-lg bg-white/10 text-on-surface-variant hover:bg-white/20 border-none cursor-pointer text-xs" title="Cancel">
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => setEditingPrice({ debtId: item._id, value: item.price })}
                                className="flex items-center gap-1.5 cursor-pointer group/price hover:text-amber-400 transition-colors"
                                title="Click to edit debt price"
                              >
                                <span>{formatDA(item.price)}</span>
                                <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/price:opacity-100 transition-opacity text-amber-400">edit</span>
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-4 text-xs font-mono text-on-surface-variant/70" dir="ltr">
                            {formatDate(item.date)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {isPaid ? t('paid', 'Paid') : t('unpaid', 'Unpaid')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(item)}
                                disabled={isWorking}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border border-none ${
                                  isPaid
                                    ? 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                }`}
                              >
                                {isWorking ? '...' : isPaid ? t('markUnpaid', 'Mark Unpaid') : t('markPaid', 'Mark Paid')}
                              </button>
                              <button
                                onClick={() => handleDeleteDebt(item._id)}
                                disabled={isWorking}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors"
                                title="Delete debt record"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Register Debt Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[24px]">post_add</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Register New Debt</h3>
                  <p className="text-xs text-on-surface-variant">Record a debt for a person and product</p>
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
            <form onSubmit={handleCreateDebt} className="space-y-4 text-xs">
              {/* Person Name */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Karim"
                  className="w-full bg-surface-container border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-on-surface text-sm outline-none"
                  value={newDebt.personName}
                  onChange={(e) => setNewDebt({ ...newDebt, personName: e.target.value })}
                />
              </div>

              {/* Product Name (with quick suggest chips if available) */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Poco X3 Pro or Charger cable"
                  className="w-full bg-surface-container border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-on-surface text-sm outline-none"
                  value={newDebt.productName}
                  onChange={(e) => setNewDebt({ ...newDebt, productName: e.target.value })}
                />

                {/* Quick product chips */}
                {products.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-on-surface-variant/70 mb-1">Quick select from inventory:</p>
                    <div className="flex gap-1.5 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                      {products.slice(0, 6).map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => handleSelectSuggestedProduct(p)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-amber-400/20 text-on-surface text-[11px] border border-white/5 hover:border-amber-400/40 transition-colors cursor-pointer"
                        >
                          {p.name} ({formatDA(p.price)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Price (DA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 12000"
                    className="w-full bg-surface-container border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-on-surface text-sm font-mono outline-none"
                    value={newDebt.price}
                    onChange={(e) => setNewDebt({ ...newDebt, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-on-surface text-xs font-mono outline-none"
                    value={newDebt.date}
                    onChange={(e) => setNewDebt({ ...newDebt, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Initial Status</label>
                <select
                  className="w-full bg-surface-container border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2.5 text-on-surface text-xs outline-none"
                  value={newDebt.status}
                  onChange={(e) => setNewDebt({ ...newDebt, status: e.target.value })}
                >
                  <option value="Unpaid">Unpaid (Pending)</option>
                  <option value="Paid">Paid (Cleared)</option>
                </select>
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
                  disabled={savingDebt}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-[#0b1326] font-bold text-xs shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">{savingDebt ? 'hourglass_empty' : 'post_add'}</span>
                  {savingDebt ? 'Saving Debt...' : 'Register Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
