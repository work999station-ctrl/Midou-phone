import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import { cleanModelName } from '../data/devicesData';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminRepairManagement() {
  const { isAuthenticated, adminToken, logout } = useAuthStore();
  const { t, lang } = useLanguageStore();
  const navigate = useNavigate();

  const getStatusFilterLabel = (status) => {
    switch (status) {
      case 'All': return t('all', 'All');
      case 'In Progress': return t('inProgress', 'In Progress');
      case 'Ready for Pickup': return t('readyForPickup', 'Ready for Pickup');
      case 'Completed': return t('completed', 'Completed');
      case 'Saved': return t('saved', 'Saved');
      case 'Cancelled': return t('cancelled', 'Cancelled');
      default: return status;
    }
  };

  const getIssueBadgeLabel = (issue) => {
    if (!issue) return '';
    const key = issue.toLowerCase().trim();
    if (key.includes('screen') || key.includes('display')) return lang === 'ar' ? 'الشاشة والعرض' : issue;
    if (key.includes('battery')) return lang === 'ar' ? 'البطارية والطاقة' : issue;
    if (key.includes('charging') || key.includes('charge') || key.includes('port')) return lang === 'ar' ? 'منفذ الشحن' : issue;
    if (key.includes('audio') || key.includes('speaker') || key.includes('mic') || key.includes('sound')) return lang === 'ar' ? 'الصوت والسماعات' : issue;
    if (key.includes('camera')) return lang === 'ar' ? 'الكاميرا' : issue;
    if (key.includes('water') || key.includes('liquid')) return lang === 'ar' ? 'أضرار الماء' : issue;
    if (key.includes('back') || key.includes('cover') || key.includes('housing') || key.includes('glass')) return lang === 'ar' ? 'الغطاء والزجاج' : issue;
    if (key.includes('button') || key.includes('key')) return lang === 'ar' ? 'الأزرار والمفاتيح' : issue;
    if (key.includes('software') || key.includes('system')) return lang === 'ar' ? 'النظام والسوفتوير' : issue;
    return issue;
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
      return `\u200E${d.getDate()} \u200E${monthsAr[d.getMonth()]} \u200E${d.getFullYear()}`;
    }
    return new Date(dStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Dashboard state
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTicket, setActiveTicket] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  // Edit ticket state inside drawer
  const [editStatus, setEditStatus] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editNotesText, setEditNotesText] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editDeviceBrand, setEditDeviceBrand] = useState('');
  const [editDeviceModel, setEditDeviceModel] = useState('');
  const [editIssue, setEditIssue] = useState('');
  const [editDeviceImage, setEditDeviceImage] = useState('');
  const [editScreenDisplayPrice, setEditScreenDisplayPrice] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const editImageInputRef = useRef(null);

  // Chat integration state
  const [activeTab, setActiveTab] = useState('diagnostics'); // 'chat' or 'diagnostics'
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Lightbox state
  const [imageModal, setImageModal] = useState(null);
  const [savedTickets, setSavedTickets] = useState(new Set());

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success', icon = null) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ticket to delete
  const [showAdminScreenPriceModal, setShowAdminScreenPriceModal] = useState(false);
  const [adminModalScreenPrice, setAdminModalScreenPrice] = useState('');

  // Search autocomplete state
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState(null);

  // Date filter — default to today
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState(todayStr);

  useEffect(() => {
    document.title = "Hanout - Available Repairs";
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tickets if authenticated
  useEffect(() => {
    if (isAuthenticated && adminToken) {
      fetchTickets();
    }
  }, [isAuthenticated, adminToken]);

  // Handle local search and filter
  useEffect(() => {
    let result = tickets;

    const isDefault = dateFilter === todayStr && statusFilter === 'All';

    if (isDefault) {
      result = result.filter(t => {
        const ticketDate = new Date(t.createdAt).toISOString().slice(0, 10);
        return ticketDate === todayStr || t.status === 'Ready for Pickup';
      });
    } else {
      // Apply Date Filter
      if (dateFilter) {
        result = result.filter(t => {
          const ticketDate = new Date(t.createdAt).toISOString().slice(0, 10);
          return ticketDate === dateFilter;
        });
      }

      // Apply Status Filter
      if (statusFilter === 'Saved') {
        result = result.filter(t => savedTickets.has(t._id));
      } else if (statusFilter !== 'All') {
        result = result.filter(t => t.status === statusFilter);
      }
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.ticketId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.toLowerCase().includes(q) ||
        t.deviceModel.toLowerCase().includes(q) ||
        t.deviceBrand.toLowerCase().includes(q) ||
        `${t.deviceBrand} ${t.deviceModel}`.toLowerCase().includes(q)
      );
    }

    setFilteredTickets(result);
  }, [tickets, searchQuery, statusFilter, dateFilter, savedTickets]);

  const fetchTickets = async () => {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/repairs/tickets', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to retrieve repair tickets.');
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Helper to parse notes
  const parseNotes = (notesStr) => {
    if (!notesStr) return { email: 'N/A', protector: 'No', text: '' };
    const parts = notesStr.split('|').map(p => p.trim());
    const emailPart = parts.find(p => p.toLowerCase().startsWith('email:')) || '';
    const email = emailPart.split(':')[1]?.trim() || 'N/A';
    
    const protectorPart = parts.find(p => p.toLowerCase().includes('screen protector:')) || '';
    const protector = protectorPart.split(':')[1]?.trim() || 'No';

    const notesPart = parts.find(p => p.toLowerCase().startsWith('notes:')) || '';
    const text = notesPart.split(':')[1]?.trim() || '';

    return { email, protector, text };
  };

  // Select ticket to edit in drawer
  const handleSelectTicket = (ticket) => {
    setActiveTicket(ticket);
    setEditStatus(ticket.status);
    setEditPrice(ticket.estimatedPrice);
    setEditCustomerName(ticket.customerName || '');
    setEditCustomerPhone(ticket.customerPhone || '');
    setEditDeviceBrand(ticket.deviceBrand || '');
    setEditDeviceModel(ticket.deviceModel || '');
    
    // Normalize issue to array
    const issueArray = Array.isArray(ticket.issue) 
      ? ticket.issue 
      : (ticket.issue ? [ticket.issue] : []);
    setEditIssue(issueArray);

    setEditDeviceImage(ticket.deviceImage || '');
    setEditScreenDisplayPrice(ticket.screenDisplayPrice || 0);
    const parsed = parseNotes(ticket.notes);
    setEditNotesText(parsed.text);
    setUpdateSuccess(false);
    setActiveTab('diagnostics');
  };

  const handleSaveAdminScreenPrice = (priceVal) => {
    const valNum = Number(priceVal) || 0;
    const oldPrice = editScreenDisplayPrice || 0;
    setEditScreenDisplayPrice(valNum);
    // Automatically add it with Estimated Repair Cost
    setEditPrice(prev => Math.max(0, (Number(prev) || 0) - oldPrice + valNum));
    setShowAdminScreenPriceModal(false);
  };

  // Advance ticket status: In Progress -> Ready for Pickup -> Completed
  const handleAdvanceStatus = async (e, ticket) => {
    e.stopPropagation();
    if (['Completed', 'Cancelled'].includes(ticket.status)) return;

    const nextStatus = ticket.status === 'Ready for Pickup' ? 'Completed' : 'Ready for Pickup';

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/tickets/${ticket._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update ticket status.');
      fetchTickets();
      if (activeTicket && activeTicket._id === ticket._id) {
        setActiveTicket(data.ticket);
        setEditStatus(data.ticket.status);
      }
      showToast(
        nextStatus === 'Completed' ? `Ticket marked as Completed` : `Ticket marked as Ready for Pickup`,
        'success',
        nextStatus === 'Completed' ? 'check_circle' : 'local_shipping'
      );
    } catch (err) { showToast(err.message, 'error', 'error'); }
  };

  // Delete a ticket — open confirmation modal
  const handleDeleteTicket = async (e, ticket) => {
    e.stopPropagation();
    setDeleteConfirm(ticket);
  };

  // Actual delete after confirmation
  const confirmDelete = async () => {
    const ticket = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/tickets/${ticket._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete ticket.');
      }
      if (activeTicket?._id === ticket._id) setActiveTicket(null);
      fetchTickets();
      showToast(`Ticket ${ticket.ticketId} deleted`, 'delete', 'delete');
    } catch (err) { showToast(err.message, 'error', 'error'); }
  };

  // Toggle saved state for a ticket
  const handleToggleSave = (e, ticket) => {
    e.stopPropagation();
    setSavedTickets(prev => {
      const next = new Set(prev);
      const wasSaved = next.has(ticket._id);
      if (wasSaved) {
        next.delete(ticket._id);
        showToast(`Ticket removed from saved`, 'save', 'bookmark_remove');
      } else {
        next.add(ticket._id);
        showToast(`Ticket saved to bookmarks`, 'save', 'bookmark_added');
      }
      return next;
    });
  };

  // Short-polling when a ticket is selected
  useEffect(() => {
    if (!activeTicket || !isAuthenticated || !adminToken) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/tickets/${activeTicket._id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        if (response.ok) {
          const updatedTicket = await response.json();
          // Only update if changes occurred
          if (
            updatedTicket.messages?.length !== activeTicket.messages?.length ||
            updatedTicket.status !== activeTicket.status ||
            updatedTicket.estimatedPrice !== activeTicket.estimatedPrice ||
            updatedTicket.notes !== activeTicket.notes
          ) {
            setActiveTicket(updatedTicket);
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [activeTicket?._id, isAuthenticated, adminToken]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    if (activeTab === 'chat' && activeTicket?.messages) {
      scrollToBottom();
    }
  }, [activeTicket?.messages, activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTicket) return;
    setIsSendingMessage(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/tickets/${activeTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          sender: 'admin',
          text: chatInput.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message.');
      }

      setChatInput('');
      setActiveTicket(data.ticket);
      setTickets(prev => prev.map(t => t._id === data.ticket._id ? data.ticket : t));
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;
    setIsUpdating(true);
    setUpdateSuccess(false);

    // Reconstruct notes preserving email and protector fields
    const parsed = parseNotes(activeTicket.notes);
    const combinedNotes = `Email: ${parsed.email} | Include screen protector: ${parsed.protector} | Notes: ${editNotesText}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/tickets/${activeTicket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: editStatus,
          estimatedPrice: Number(editPrice),
          notes: combinedNotes,
          customerName: editCustomerName,
          customerPhone: editCustomerPhone,
          deviceBrand: editDeviceBrand,
          deviceModel: editDeviceModel,
          issue: editIssue,
          deviceImage: editDeviceImage,
          screenDisplayPrice: Number(editScreenDisplayPrice)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update ticket.');
      }

      setUpdateSuccess(true);
      fetchTickets();
      setActiveTicket(data.ticket);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle image change in the diagnostics panel
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditDeviceImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Get status color badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Waiting for Parts':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'In Progress':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Ready for Pickup':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/10 text-white border-white/10';
    }
  };

  // Statistics counters
  const stats = {
    total: tickets.length,
    active: tickets.filter(t => t.status === 'In Progress').length,
    ready: tickets.filter(t => t.status === 'Ready for Pickup').length,
    completed: tickets.filter(t => t.status === 'Completed').length,
    revenue: tickets.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.estimatedPrice, 0)
  };

  // ---------------- ROUTE GUARD ----------------
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // ---------------- RENDERING ADMIN DASHBOARD ----------------
  return (
    <div className={`flex-grow pt-3 sm:pt-5 px-margin-mobile md:px-margin-desktop mx-auto w-full max-w-[1400px] flex flex-col relative z-10 overflow-x-hidden transition-all duration-500 ${
      activeTicket 
        ? 'h-screen overflow-hidden pb-2 gap-0' 
        : 'h-auto lg:h-[calc(100vh-60px)] lg:overflow-hidden gap-stack-md pb-stack-lg'
    }`}>
      <style>{`
        footer {
          display: none !important;
        }
      `}</style>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Header Info */}
      <header className={`flex flex-row justify-between items-center gap-3 pb-2 flex-shrink-0 border-b border-white/5 relative z-10 ${
        activeTicket ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-1.5 rounded-xl border border-white/10 text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 bg-surface-container/40"
            title="Return to Admin Dashboard"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-bold hidden sm:inline">{t('dashboard', 'Dashboard')}</span>
          </button>

          <h1 className="text-base font-bold tracking-tight text-on-surface flex items-center gap-2">
            {t('availableRepairs', 'Available Repairs')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* Main Grid / Dashboard View */}
      <div className={`flex flex-col lg:flex-row w-full items-start min-h-0 min-w-0 max-w-full relative z-10 transition-all duration-500 ease-in-out ${
        activeTicket ? 'gap-0 h-full pb-0' : 'gap-stack-md h-auto lg:h-full pb-8'
      }`}>
        
        {/* Left Side: Table Area */}
        <div 
          className={`flex flex-col gap-stack-md h-auto lg:h-full min-h-0 min-w-0 max-w-full transition-all duration-500 ease-in-out ${
            activeTicket 
              ? 'w-0 h-0 opacity-0 pointer-events-none overflow-hidden p-0 border-0 m-0' 
              : 'w-full lg:w-full h-full opacity-100'
          }`}
        >
          
          {/* Filters & Search */}
          <div className="glass-panel rounded-xl p-stack-sm flex flex-col gap-2 flex-shrink-0">
            {/* Row 1: Status tabs + Date picker */}
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex flex-wrap gap-1.5 items-center font-label-sm text-label-sm">
                {['All', 'In Progress', 'Ready for Pickup', 'Completed'].map((tab) => {
                  const isActive = statusFilter === tab;
                  const count = tab === 'All'
                    ? tickets.length
                    : tickets.filter(t => t.status === tab).length;
                  return (
                    <button
                      key={tab}
                      id={`filter-btn-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => {
                        setStatusFilter(tab);
                        // 'All' clears date filter to show every ticket
                        if (tab === 'All') setDateFilter('');
                      }}
                      className={`px-3 py-1.5 rounded-full transition-all font-semibold text-xs cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#6366f1] text-white border border-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {getStatusFilterLabel(tab)}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-on-surface-variant'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
                {/* Saved filter tab */}
                <button
                  id="filter-btn-saved"
                  onClick={() => {
                    setStatusFilter(prev => prev === 'Saved' ? 'All' : 'Saved');
                    setDateFilter(''); // Saved view shows all dates
                  }}
                  className={`px-3 py-1.5 rounded-full transition-all font-semibold text-xs cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'Saved'
                      ? 'bg-amber-500 text-white border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'text-on-surface-variant hover:text-amber-400 hover:bg-amber-500/10 border border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">bookmark</span>
                  {t('saved', 'Saved')}
                  {savedTickets.size > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      statusFilter === 'Saved' ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-on-surface-variant'
                    }`}>
                      {savedTickets.size}
                    </span>
                  )}
                </button>
              </div>

              {/* Date filter — active when value set, neutral when cleared */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <span
                    className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none transition-colors"
                    style={{ color: dateFilter ? '#ffffff' : 'rgba(218,226,253,0.4)' }}
                  >calendar_today</span>
                  <input
                    id="date-filter-input"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      // Selecting a date de-activates the 'All' clear state
                      if (statusFilter === 'All') setStatusFilter('All');
                    }}
                    className={`rounded-lg py-1.5 pl-8 pr-3 font-label-sm text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                      dateFilter
                        ? 'bg-[#6366f1] border border-[#6366f1] text-white shadow-lg'
                        : 'bg-black/20 border border-white/10 text-on-surface-variant focus:border-[#6366f1]'
                    }`}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                {/* Show Today button whenever date is not today (including when empty) */}
                {dateFilter !== todayStr && (
                  <button
                    onClick={() => { setDateFilter(todayStr); setStatusFilter('All'); }}
                    className="text-[10px] font-semibold text-secondary hover:underline cursor-pointer whitespace-nowrap"
                    title="Filter by today"
                  >
                    {t('today', 'Today')}
                  </button>
                )}
              </div>
            </div>

            <div className="relative w-full md:w-auto min-w-[260px]" ref={searchContainerRef}>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] z-10">search</span>
              <input
                id="search-input-field"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length >= 1) {
                    const q = val.toLowerCase();
                    // Build unique device names from actual tickets in the database
                    const uniqueDevices = [...new Set(
                      tickets.map(t => `${t.deviceBrand} ${cleanModelName(t.deviceModel)}`)
                    )];
                    const matches = uniqueDevices
                      .filter(d => d.toLowerCase().includes(q))
                      .slice(0, 7);
                    setSearchSuggestions(matches);
                    if (matches.length > 0) {
                      const rect = searchInputRef.current?.getBoundingClientRect();
                      if (rect) setDropdownRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
                      setShowSuggestions(true);
                    } else {
                      setShowSuggestions(false);
                    }
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (searchSuggestions.length > 0 && searchQuery.trim()) {
                    const rect = searchInputRef.current?.getBoundingClientRect();
                    if (rect) setDropdownRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
                    setShowSuggestions(true);
                  }
                }}
                placeholder={t('searchRepairPlaceholder', 'Search ticket, client, phone, device...')}
                className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-10 pr-9 font-label-sm text-label-sm text-on-surface focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Data Table Container */}
          <div className="glass-panel rounded-xl overflow-hidden w-full flex-grow flex flex-col min-h-0">
            {dashboardLoading ? (
              <div className="flex flex-col items-center justify-center p-20 text-on-surface-variant gap-3 flex-grow">
                <span className="loading loading-spinner text-secondary"></span>
                <p className="font-label-md">{t('loading', 'Loading tickets...')}</p>
              </div>
            ) : dashboardError ? (
              <div className="flex flex-col items-center justify-center p-20 text-error gap-3 text-center max-w-sm mx-auto flex-grow">
                <span className="material-symbols-outlined text-4xl">warning</span>
                <p className="font-body-md">{dashboardError}</p>
                <button onClick={fetchTickets} className="px-4 py-2 bg-error-container/20 border border-error/30 text-error rounded-md text-xs">Retry</button>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-on-surface-variant gap-3 text-center flex-grow">
                <span className="material-symbols-outlined text-4xl opacity-30">inbox</span>
                <p className="font-body-md">No repair tickets found matching the filter criteria.</p>
              </div>
            ) : (
              <>
                {/* Mobile View: Ticket Cards List */}
                <div className="block md:hidden overflow-y-auto flex-grow custom-scrollbar overflow-x-hidden w-full max-w-full min-h-0 p-3 space-y-3">
                  {filteredTickets.map((ticket) => {
                    const isSelected = activeTicket?._id === ticket._id;
                    const isSaved = savedTickets.has(ticket._id);
                    const shortId = ticket.ticketId.replace(/^REP-/, '');
                    const isPickupOrDone = ticket.status === 'Ready for Pickup' || ticket.status === 'Completed';
                    const isCancelled = ticket.status === 'Cancelled';

                    return (
                      <div
                        key={ticket._id}
                        id={`ticket-card-${ticket.ticketId}`}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`rounded-2xl border transition-all cursor-pointer relative overflow-hidden glass-panel active:scale-[0.99] ${
                          isSelected
                            ? 'bg-[#6366f1]/5 border-[#6366f1]/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                            : 'bg-white/[0.01] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Main row: image + content */}
                        <div className="flex gap-0">
                          {/* Left: Device Image */}
                          <div
                            className="flex-shrink-0 w-[110px] flex flex-col items-center justify-center gap-2 py-4 px-2"
                            style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            {ticket.deviceImage ? (
                              <img
                                src={ticket.deviceImage}
                                alt={cleanModelName(ticket.deviceModel)}
                                className="w-20 h-24 object-contain rounded-xl"
                                style={{ filter: 'drop-shadow(0 6px 16px rgba(93,230,255,0.2))' }}
                              />
                            ) : (
                              <div
                                className="w-20 h-24 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
                              >
                                <span className="material-symbols-outlined text-[40px]"
                                  style={{ color: 'rgba(218,226,253,0.2)', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
                                >smartphone</span>
                              </div>
                            )}
                            {/* Device name under image */}
                            <p className="text-[10px] font-bold text-center leading-tight text-on-surface-variant/70 truncate w-full px-1">
                              {ticket.deviceBrand}<br/>
                              <span className="text-secondary/90">{cleanModelName(ticket.deviceModel)}</span>
                            </p>
                          </div>

                          {/* Right: Content */}
                          <div className="flex-1 min-w-0 p-3.5 flex flex-col gap-2.5">
                            {/* Booking Date + Status */}
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-on-surface-variant/60 flex items-center gap-1" dir="ltr">
                                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>calendar_today</span>
                                {formatDate(ticket.createdAt)}
                              </span>
                              <span className={`inline-block border text-[9px] px-2 py-0.5 rounded-full font-bold ${getStatusBadgeClass(ticket.status)}`}>
                                {getStatusFilterLabel(ticket.status)}
                              </span>
                            </div>

                            {/* Customer */}
                            <div>
                              <div className="font-bold text-on-surface text-base leading-tight truncate">{ticket.customerName}</div>
                              <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">{ticket.customerPhone}</div>
                            </div>

                            {/* Price */}
                            <div className="text-base text-secondary font-mono font-extrabold">
                              {ticket.estimatedPrice}.00 <span className="text-[11px] font-semibold text-on-surface-variant">{t('currency', 'DA')}</span>
                            </div>

                            {/* Issues */}
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(ticket.issue) ? (
                                ticket.issue.map((iss, i) => (
                                  <span key={i} className="inline-block bg-error-container/20 text-error border border-error/25 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">
                                    {getIssueBadgeLabel(iss)}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-block bg-error-container/20 text-error border border-error/25 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">
                                  {getIssueBadgeLabel(ticket.issue)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action strip at bottom */}
                        <div
                          className="flex items-center gap-2 px-3.5 py-2.5 border-t border-white/5"
                          style={{ background: 'rgba(255,255,255,0.015)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Lifecycle action button: In Progress -> Ready for Pickup -> Complete -> Completed (Disabled) */}
                          {ticket.status === 'Completed' ? (
                            <button
                              disabled
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-400/50 border border-emerald-500/20 cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[14px]">done_all</span>
                              {t('completed', 'Completed')}
                            </button>
                          ) : ticket.status === 'Ready for Pickup' ? (
                            <button
                              id={`complete-btn-mobile-${ticket.ticketId}`}
                              onClick={(e) => handleAdvanceStatus(e, ticket)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              {t('complete', 'Complete')}
                            </button>
                          ) : ticket.status === 'Cancelled' ? (
                            <button
                              disabled
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-red-500/10 text-red-400/50 border border-red-500/20 cursor-not-allowed"
                            >
                              {t('statusCancelled', 'Cancelled')}
                            </button>
                          ) : (
                            <button
                              id={`ready-btn-mobile-${ticket.ticketId}`}
                              onClick={(e) => handleAdvanceStatus(e, ticket)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                              {t('readyForPickup', 'Ready for Pickup')}
                            </button>
                          )}

                          {/* Save / Bookmark button */}
                          <button
                            id={`save-btn-mobile-${ticket.ticketId}`}
                            onClick={(e) => handleToggleSave(e, ticket)}
                            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                              isSaved
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-white/5 border-white/10 text-on-surface-variant hover:text-amber-400 hover:border-amber-500/30'
                            }`}
                            title={isSaved ? 'Remove from saved' : 'Save ticket'}
                          >
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
                              bookmark
                            </span>
                          </button>

                          {/* Delete button */}
                          <button
                            id={`delete-btn-mobile-${ticket.ticketId}`}
                            onClick={(e) => handleDeleteTicket(e, ticket)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 transition-all active:scale-95 cursor-pointer"
                            title="Delete ticket"
                          >
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Ticket Data Table */}
                <div className="hidden md:block overflow-x-auto w-full flex-grow custom-scrollbar overflow-y-auto min-h-0">
                  <table className="w-full text-left font-label-sm text-label-sm relative border-collapse">
                    <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-label-md sticky top-0 bg-surface/90 backdrop-blur z-10">
                      <tr>
                        <th className="w-6 hidden md:table-cell"></th>
                        <th className="px-stack-md py-4 font-semibold hidden md:table-cell">{t('image', 'Image')}</th>
                        <th className="px-stack-md py-4 font-semibold">{t('client', 'Client')}</th>
                        <th className="px-stack-md py-4 font-semibold">{t('device', 'Device')}</th>
                        <th className="px-stack-md py-4 font-semibold">{t('issue', 'Issue')}</th>
                        <th className="px-stack-md py-4 font-semibold text-center">{t('status', 'Status')}</th>
                        <th className="px-stack-md py-4 font-semibold text-right hidden md:table-cell">{t('estimate', 'Estimate')}</th>
                        <th className="px-stack-md py-4 font-semibold hidden md:table-cell">{t('date', 'Date')}</th>
                        <th className="px-stack-md py-4 font-semibold text-right">{t('actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-body-md">
                      {filteredTickets.map((ticket) => {
                        const isSelected = activeTicket?._id === ticket._id;
                        const idx = ticket.ticketId.lastIndexOf('-');
                        const part1 = idx !== -1 ? ticket.ticketId.slice(0, idx + 1) : ticket.ticketId;
                        const part2 = idx !== -1 ? ticket.ticketId.slice(idx + 1) : '';

                        return (
                          <tr 
                            key={ticket._id}
                            id={`ticket-row-${ticket.ticketId}`}
                            onClick={() => handleSelectTicket(ticket)}
                            className={`hover:bg-white/5 transition-colors cursor-pointer group ${
                              isSelected 
                                ? 'bg-[#6366f1]/5 border-l-2 border-[#6366f1]' 
                                : 'bg-white/[0.02] border-l-2 border-transparent'
                            }`}
                          >
                            {/* Hover action circles — left side */}
                            <td className="pl-3 pr-0 py-4 hidden md:table-cell w-6" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {/* Advance / Complete */}
                                <button
                                  title={ticket.status === 'Ready for Pickup' ? 'Mark as Completed' : 'Mark as Ready for Pickup'}
                                  onClick={(e) => handleAdvanceStatus(e, ticket)}
                                  disabled={['Completed','Cancelled'].includes(ticket.status)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                                    ticket.status === 'Ready for Pickup'
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400'
                                      : 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[13px]">
                                    {ticket.status === 'Ready for Pickup' ? 'check' : 'local_shipping'}
                                  </span>
                                </button>
                                {/* Save */}
                                <button
                                  title={savedTickets.has(ticket._id) ? 'Unsave' : 'Save ticket'}
                                  onClick={(e) => handleToggleSave(e, ticket)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                    savedTickets.has(ticket._id)
                                      ? 'bg-amber-500/30 text-amber-400'
                                      : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-400'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[13px]">{savedTickets.has(ticket._id) ? 'bookmark' : 'bookmark'}</span>
                                </button>
                                {/* Delete */}
                                <button
                                  title="Delete ticket"
                                  onClick={(e) => handleDeleteTicket(e, ticket)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/15 hover:bg-red-500/30 text-red-400 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[13px]">delete</span>
                                </button>
                              </div>
                            </td>
                            <td className="px-stack-md py-4 hidden md:table-cell">
                              <div
                                className="w-16 h-16 rounded-lg overflow-hidden border border-white/5 bg-white/3 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-secondary/50 transition-all"
                                onClick={(e) => { if (ticket.deviceImage) { e.stopPropagation(); setImageModal(ticket.deviceImage); } }}
                                title={ticket.deviceImage ? 'Click to view full image' : ''}
                              >
                                {ticket.deviceImage ? (
                                  <img src={ticket.deviceImage} alt="Device" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[26px]">
                                    {ticket.deviceType === 'tablet' ? 'tablet_mac' : ticket.deviceType === 'feature-phone' ? 'dialpad' : 'smartphone'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-stack-md py-4">
                              <div className="font-semibold text-on-surface text-body-lg">{ticket.customerName}</div>
                              <div className="text-[10px] text-on-surface-variant">{ticket.customerPhone}</div>
                            </td>
                            <td className="px-stack-md py-4 text-on-surface-variant">
                              {ticket.deviceBrand} {cleanModelName(ticket.deviceModel)}
                            </td>
                            <td className="px-stack-md py-4">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(ticket.issue) ? (
                                  ticket.issue.map((iss, i) => (
                                    <span key={i} className="inline-block bg-error-container/20 text-error border border-error/30 text-[9px] uppercase px-2 py-0.5 rounded whitespace-nowrap">
                                      {getIssueBadgeLabel(iss)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-block bg-error-container/20 text-error border border-error/30 text-[9px] uppercase px-2 py-0.5 rounded whitespace-nowrap">
                                    {getIssueBadgeLabel(ticket.issue)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-stack-md py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusBadgeClass(ticket.status)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  ticket.status === 'Completed'
                                    ? 'bg-emerald-400'
                                    : ticket.status === 'Ready for Pickup'
                                      ? 'bg-cyan-400 animate-pulse'
                                      : ticket.status === 'In Progress'
                                        ? 'bg-orange-400'
                                        : 'bg-red-400'
                                }`} />
                                {getStatusFilterLabel(ticket.status)}
                              </span>
                            </td>
                            <td className="px-stack-md py-4 text-right font-mono text-on-surface hidden md:table-cell">
                              {ticket.estimatedPrice}.00 {t('currency', 'DA')}
                            </td>
                            <td className="px-stack-md py-4 text-on-surface-variant font-mono text-sm hidden md:table-cell" dir="ltr">
                               {formatDate(ticket.createdAt)}
                            </td>
                            <td className="px-stack-md py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              {ticket.status === 'Completed' ? (
                                <button
                                  disabled
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400/60 border border-emerald-500/20 cursor-not-allowed flex items-center justify-center gap-1 ml-auto min-w-[100px]"
                                >
                                  <span className="material-symbols-outlined text-[13px]">done_all</span>
                                  {t('completed', 'Completed')}
                                </button>
                              ) : ticket.status === 'Ready for Pickup' ? (
                                <button
                                  id={`complete-btn-${ticket.ticketId}`}
                                  onClick={(e) => handleAdvanceStatus(e, ticket)}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 ml-auto min-w-[100px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                >
                                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                  {t('complete', 'Complete')}
                                </button>
                              ) : ticket.status === 'Cancelled' ? (
                                <button
                                  disabled
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-400/60 border border-red-500/20 cursor-not-allowed flex items-center justify-center gap-1 ml-auto min-w-[100px]"
                                >
                                  {t('statusCancelled', 'Cancelled')}
                                </button>
                              ) : (
                                <button
                                  id={`ready-btn-${ticket.ticketId}`}
                                  onClick={(e) => handleAdvanceStatus(e, ticket)}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 ml-auto min-w-[100px] bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)] whitespace-nowrap"
                                >
                                  <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                                  {t('readyForPickup', 'Ready for Pickup')}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Details Panel */}
        <div 
          className={`glass-modal rounded-xl border border-white/10 flex flex-col p-stack-md shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden flex-shrink-0 min-h-0 transition-all duration-500 ease-in-out ${
            activeTicket 
              ? 'w-full h-full opacity-100 translate-x-0' 
              : 'w-0 h-0 opacity-0 translate-x-4 pointer-events-none p-0 border-0 shadow-none'
          }`}
        >
          {activeTicket ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#6366f1]/5 pointer-events-none"></div>
              <div className="flex flex-col h-full w-full relative z-10 min-h-0">
                
                {/* Panel Header */}
                <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-start flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button 
                      id="back-to-list-btn"
                      onClick={() => setActiveTicket(null)}
                      className="text-on-surface-variant hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-white/5"
                      title="Back to list"
                    >
                      <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-primary">{activeTicket.ticketId}</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Client: {activeTicket.customerName} • {activeTicket.customerPhone}
                      </p>
                    </div>
                  </div>
                  <button 
                    id="close-detail-panel-btn"
                    onClick={() => setActiveTicket(null)}
                    className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-grow overflow-y-auto min-h-0 relative z-10 custom-scrollbar pr-1 flex flex-col">
                  {/* Diagnostics Tab Form — Full Ticket Editor */}
                  <form onSubmit={handleUpdateTicket} className="flex-grow flex flex-col justify-between min-h-0">
                      <div className="space-y-5 flex-grow overflow-y-auto custom-scrollbar pr-1 pb-4">

                        {/* === Device Image & Information Side-by-Side === */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Device Image Card */}
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 flex flex-col justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">photo_camera</span>Device Image
                            </p>
                            <input type="file" accept="image/*" ref={editImageInputRef} onChange={handleEditImageChange} className="hidden" id="admin-edit-image" />
                            <label
                              htmlFor="admin-edit-image"
                              className="flex flex-col items-center justify-center gap-2 w-full border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-secondary/60 hover:bg-white/3 transition-all py-4 px-3 group flex-grow"
                            >
                              {editDeviceImage ? (
                                <>
                                  <div className="relative w-full max-w-[180px] h-32 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                      <span className="material-symbols-outlined text-white text-2xl">edit</span>
                                    </div>
                                    <img src={editDeviceImage} alt="Device" className="w-full h-full object-contain" />
                                  </div>
                                  <span className="text-[10px] text-on-surface-variant">Click to change image</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[28px] text-on-surface-variant/50 group-hover:text-secondary transition-colors">add_a_photo</span>
                                  <span className="text-[10px] text-on-surface-variant">Upload device image</span>
                                </>
                              )}
                            </label>
                          </div>

                          {/* Right: Device Information Card */}
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 space-y-3 flex flex-col justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">smartphone</span>Device Information
                            </p>
                            <div className="space-y-3 flex-grow justify-center flex flex-col">
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1 pl-0.5" htmlFor="edit-device-brand">Brand</label>
                                <div className="relative">
                                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px]">business</span>
                                  <input
                                    id="edit-device-brand"
                                    type="text"
                                    value={editDeviceBrand}
                                    onChange={(e) => setEditDeviceBrand(e.target.value)}
                                    className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1 pl-0.5" htmlFor="edit-device-model">Model</label>
                                <div className="relative">
                                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px]">devices</span>
                                  <input
                                    id="edit-device-model"
                                    type="text"
                                    value={editDeviceModel}
                                    onChange={(e) => setEditDeviceModel(e.target.value)}
                                    className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* === Reported Issues === */}
                        <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 space-y-3">
                          {/* Issue Checkboxes */}
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1.5 pl-0.5">Reported Issue(s)</label>
                            <div className="grid grid-cols-2 gap-2 bg-black/20 border border-white/[0.04] rounded-lg p-3">
                              {['charging port', 'buttons', 'audio output', 'other', 'unknown issue', 'audio input', 'screen & display', 'battery', 'changing cover', 'camera'].map((iss) => {
                                const isChecked = Array.isArray(editIssue)
                                  ? editIssue.includes(iss)
                                  : editIssue === iss;
                                return (
                                  <label key={iss} className="flex items-center gap-2 cursor-pointer text-xs text-on-surface select-none hover:text-secondary transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        let current = Array.isArray(editIssue) ? [...editIssue] : (editIssue ? [editIssue] : []);
                                        if (e.target.checked) {
                                          if (!current.includes(iss)) current.push(iss);
                                          setEditIssue(current);
                                          if (iss === 'screen & display') {
                                            setAdminModalScreenPrice(editScreenDisplayPrice || '');
                                            setShowAdminScreenPriceModal(true);
                                          }
                                        } else {
                                          current = current.filter(x => x !== iss);
                                          setEditIssue(current);
                                          if (iss === 'screen & display') {
                                            const prevVal = editScreenDisplayPrice || 0;
                                            setEditScreenDisplayPrice(0);
                                            setEditPrice(prev => Math.max(0, (Number(prev) || 0) - prevVal));
                                          }
                                        }
                                      }}
                                      className="form-checkbox rounded border-white/20 bg-surface-container text-secondary focus:ring-secondary focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="capitalize">{iss}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Screen & Display Price Field (Conditional) */}
                          {((Array.isArray(editIssue) && editIssue.includes('screen & display')) || editIssue === 'screen & display') && (
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1.5 pl-0.5" htmlFor="edit-screen-display-price">Screen &amp; Display Price (DA)</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono font-bold text-[10px] select-none">DA</span>
                                <input
                                  id="edit-screen-display-price"
                                  type="number"
                                  value={editScreenDisplayPrice}
                                  onChange={(e) => {
                                    const valNum = Number(e.target.value) || 0;
                                    const oldPrice = editScreenDisplayPrice || 0;
                                    setEditScreenDisplayPrice(valNum);
                                    setEditPrice(prev => Math.max(0, (Number(prev) || 0) - oldPrice + valNum));
                                  }}
                                  className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all"
                                  min="0"
                                  />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* === Client Information === */}
                        <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 space-y-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">person</span>Client Information
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1 pl-0.5" htmlFor="edit-customer-name">Full Name</label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px]">person</span>
                                <input
                                  id="edit-customer-name"
                                  type="text"
                                  value={editCustomerName}
                                  onChange={(e) => setEditCustomerName(e.target.value)}
                                  className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1 pl-0.5" htmlFor="edit-customer-phone">Phone Number</label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px]">phone</span>
                                <input
                                  id="edit-customer-phone"
                                  type="text"
                                  value={editCustomerPhone}
                                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                                  className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1 pl-0.5">Email</label>
                            <p className="text-xs text-on-surface-variant bg-black/10 rounded-lg px-3 py-2 border border-white/5">{parseNotes(activeTicket.notes).email}</p>
                          </div>
                        </div>

                        {/* === Repair Status & Pricing === */}
                        <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 space-y-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">tune</span>Status &amp; Pricing
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Status */}
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1.5 pl-0.5" htmlFor="diagnostics-status-select">Status</label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px]">rule</span>
                                <select
                                  id="diagnostics-status-select"
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-8 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all appearance-none cursor-pointer"
                                >
                                  {['In Progress', 'Ready for Pickup', 'Completed'].map((s) => (
                                    <option key={s} value={s} className="bg-[#171f33]">{s}</option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[14px]">keyboard_arrow_down</span>
                              </div>
                            </div>
                            {/* Price */}
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant/70 mb-1.5 pl-0.5" htmlFor="edit-price">Estimated Price (DA)</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono font-bold text-[10px] select-none">DA</span>
                                <input
                                  id="edit-price"
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number(e.target.value))}
                                  className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* === Technician Notes === */}
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-1.5" htmlFor="edit-notes">
                            <span className="material-symbols-outlined text-[14px]">edit_note</span>Technician Notes
                          </label>
                          <textarea
                            id="edit-notes"
                            value={editNotesText}
                            onChange={(e) => setEditNotesText(e.target.value)}
                            rows={4}
                            placeholder="Diagnostic details, parts used, repair progress..."
                            className="w-full bg-black/20 border border-white/[0.04] rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all resize-y custom-scrollbar"
                          />
                        </div>
                      </div>

                      {/* Commit Actions */}
                      <div className="space-y-2 mt-3 flex-shrink-0 pt-3 border-t border-white/5">
                        {updateSuccess && (
                          <div className="bg-success/15 border border-success/20 p-2.5 rounded-lg text-center text-success font-label-sm flex items-center justify-center gap-1.5 animate-fade-in text-xs">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            All changes saved successfully!
                          </div>
                        )}
                        <button
                          id="diagnostics-commit-btn"
                          type="submit"
                          disabled={isUpdating}
                          className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                        >
                          <span className="material-symbols-outlined text-[16px]">{isUpdating ? 'sync' : 'save'}</span>
                          {isUpdating ? 'Saving Changes...' : 'Save All Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full w-full relative z-10 items-center justify-center text-center text-on-surface-variant/40 p-4 gap-3 min-h-[350px]">
              <span className="material-symbols-outlined text-4xl opacity-30">info</span>
              <p className="font-body-md text-xs leading-relaxed max-w-[150px]">
                Select a diagnostic ticket from the queue to view its active telemetry and modify status.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Image Lightbox Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setImageModal(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={imageModal} alt="Device Full View" className="max-w-[85vw] max-h-[85vh] object-contain block" />
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
      {/* Search Suggestions Dropdown — fixed position to escape overflow:hidden parents */}
      {showSuggestions && dropdownRect && (
        <ul
          style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
          className="bg-[#1a2236] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50"
        >
          {searchSuggestions.map((suggestion, i) => (
            <li
              key={i}
              onMouseDown={() => {
                setSearchQuery(suggestion);
                setShowSuggestions(false);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-on-surface hover:bg-[#6366f1]/15 hover:text-secondary cursor-pointer transition-colors border-b border-white/5 last:border-0"
            >
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/50">smartphone</span>
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {/* Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => {
          const styles = {
            success: { bg: 'bg-emerald-950/90 border-emerald-500/30', icon: 'text-emerald-400', bar: 'bg-emerald-500' },
            save:    { bg: 'bg-amber-950/90 border-amber-500/30',   icon: 'text-amber-400',   bar: 'bg-amber-500'   },
            delete:  { bg: 'bg-red-950/90 border-red-500/30',       icon: 'text-red-400',     bar: 'bg-red-500'     },
            error:   { bg: 'bg-red-950/90 border-red-500/40',       icon: 'text-red-400',     bar: 'bg-red-600'     },
          }[toast.type] || { bg: 'bg-surface/90 border-white/10', icon: 'text-on-surface', bar: 'bg-white' };

          return (
            <div
              key={toast.id}
              className={`relative overflow-hidden pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/40 min-w-[280px] max-w-[360px] ${styles.bg}`}
              style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
            >
              <span className={`material-symbols-outlined text-[22px] shrink-0 ${styles.icon}`}>
                {toast.icon || 'info'}
              </span>
              <p className="text-sm text-on-surface font-medium flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
              {/* Auto-dismiss progress bar */}
              <div
                className={`absolute bottom-0 left-0 h-[3px] rounded-b-2xl ${styles.bar} opacity-40`}
                style={{ animation: 'shrinkBar 3.5s linear forwards' }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ animation: 'fadeInBg 0.2s ease both' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-sm bg-[#141b2d] border border-red-500/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{ animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {/* Red glow top strip */}
            <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

            <div className="p-6 flex flex-col items-center gap-4 text-center">
              {/* Warning icon */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-[34px]">delete_forever</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface mb-1">Delete Ticket?</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  You're about to permanently delete
                </p>
                <p className="font-mono text-sm font-bold text-red-400 mt-1">{deleteConfirm.ticketId}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {deleteConfirm.customerName} • {deleteConfirm.deviceBrand} {cleanModelName(deleteConfirm.deviceModel)}
                </p>
              </div>

              <div className="w-full rounded-xl bg-red-500/5 border border-red-500/15 px-4 py-2.5 flex items-start gap-2">
                <span className="material-symbols-outlined text-red-400/70 text-[16px] mt-0.5 shrink-0">warning</span>
                <p className="text-xs text-red-300/70 text-left">This action cannot be undone. All data including chat messages will be permanently removed.</p>
              </div>

              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/5 text-sm font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Screen Price Custom Admin Modal ── */}
      {showAdminScreenPriceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in bg-black/70 backdrop-blur-sm">
          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-sm bg-[#141b2d] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4" style={{ animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">smartphone</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Screen Price</h3>
            </div>
            
            <p className="font-body-md text-body-md text-on-surface-variant">
              Please enter the repair cost for the screen replacement.
            </p>

            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono font-bold text-xs select-none">DA</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 12000"
                value={adminModalScreenPrice}
                onChange={(e) => setAdminModalScreenPrice(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-black/20 border border-white/[0.04] rounded-lg py-2 pl-8 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary/60 transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  handleSaveAdminScreenPrice(0);
                }}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-label-md text-xs transition-all cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  handleSaveAdminScreenPrice(adminModalScreenPrice);
                }}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-black font-label-md text-xs font-bold hover:bg-secondary/90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(34,211,238,0.25)]"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes shrinkBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes fadeInBg {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
