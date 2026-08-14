import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { cleanModelName } from '../data/devicesData';

export default function Admin() {
  const { isAuthenticated, adminToken, login, logout, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch tickets if authenticated
  useEffect(() => {
    if (isAuthenticated && adminToken) {
      fetchTickets();
    }
  }, [isAuthenticated, adminToken]);

  // Handle local search and filter
  useEffect(() => {
    let result = tickets;

    // Apply Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        result = result.filter(t => ['Booked', 'Waiting for Parts', 'In Progress'].includes(t.status));
      } else {
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
        t.deviceBrand.toLowerCase().includes(q)
      );
    }

    setFilteredTickets(result);
  }, [tickets, searchQuery, statusFilter]);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password) {
      setLoginError('Please enter both username and password.');
      return;
    }
    
    const success = await login(username.trim(), password);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setLoginError(useAuthStore.getState().error || 'Invalid username or password.');
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
    const parsed = parseNotes(ticket.notes);
    setEditNotesText(parsed.text);
    setUpdateSuccess(false);
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;
    setIsUpdating(true);
    setUpdateSuccess(false);

    // Reconstruct notes with the updated Notes part
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
          notes: combinedNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update ticket.');
      }

      setUpdateSuccess(true);
      // Refresh tickets in queue
      fetchTickets();
      // Keep active ticket state updated
      setActiveTicket(data.ticket);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
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
    active: tickets.filter(t => ['Booked', 'Waiting for Parts', 'In Progress'].includes(t.status)).length,
    ready: tickets.filter(t => t.status === 'Ready for Pickup').length,
    completed: tickets.filter(t => t.status === 'Completed').length,
    revenue: tickets.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.estimatedPrice, 0)
  };

  // ---------------- RENDERING LOGIN FORM ----------------
  if (!isAuthenticated) {
    return (
      <main className="flex-grow flex items-center justify-center pt-32 pb-stack-lg px-margin-mobile md:px-margin-desktop bg-background text-on-surface relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 animate-fade-in overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-secondary to-primary"></div>
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-4 border border-secondary/20 shadow-[0_0_15px_rgba(93,230,255,0.2)]">
              <span className="material-symbols-outlined text-secondary text-[24px]">terminal</span>
            </div>
            <h1 className="font-display-lg text-[28px] text-on-surface font-bold">Control Core</h1>
            <p className="font-body-sm text-on-surface-variant mt-1">Authorized technician intake access only.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block font-label-sm text-on-surface-variant mb-2 pl-1" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
                <input 
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/5 rounded-lg py-3.5 pl-11 pr-4 font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all placeholder:opacity-35"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-sm text-on-surface-variant mb-2 pl-1" htmlFor="password">
                Security Key
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/5 rounded-lg py-3.5 pl-11 pr-12 font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all placeholder:opacity-35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-error-container/10 border border-error/25 p-3 rounded-lg text-center animate-fade-in flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                <p className="font-label-sm text-error text-[13px]">{loginError}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-inverse-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-label-md font-semibold transition-all shadow-[0_4px_20px_rgba(73,75,214,0.35)] hover:shadow-[0_4px_30px_rgba(128,131,255,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? "Validating credentials..." : "Decrypt Intake"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ---------------- RENDERING ADMIN DASHBOARD ----------------
  return (
    <main className="flex-grow pt-32 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-8 relative z-10">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Header Info */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6 relative z-10">
        <div>
          <h1 className="font-display-lg text-3xl md:text-[36px] text-on-surface font-extrabold tracking-tight">
            Cybernetic Repair Board
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
            Diagnostic Telemetry Core • Logged in as <span className="text-secondary font-bold font-mono">{useAuthStore.getState().adminUser}</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="px-5 py-2.5 rounded-lg border border-error/50 text-error font-label-md hover:bg-error/15 hover:border-error transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
          System Logout
        </button>
      </header>

      {/* Telemetry Counter Cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
        {[
          { label: 'Intake Queue', val: stats.total, color: 'text-primary', icon: 'view_list' },
          { label: 'Pending Repairs', val: stats.active, color: 'text-amber-400', icon: 'build' },
          { label: 'Ready for Pickup', val: stats.ready, color: 'text-cyan-400', icon: 'mail' },
          { label: 'Completed Repairs', val: stats.completed, color: 'text-emerald-400', icon: 'check_circle' },
          { label: 'Revenue Generated', val: `$${stats.revenue}.00`, color: 'text-secondary font-mono font-bold', icon: 'payments', fullWidth: true }
        ].map((item, idx) => (
          <div 
            key={item.label}
            className={`glass-panel p-5 rounded-xl border border-white/5 flex flex-col gap-2 relative overflow-hidden group hover:border-white/15 transition-all ${
              item.fullWidth ? 'col-span-2 md:col-span-1 bg-secondary/5 border-secondary/10' : 'bg-surface-container/40'
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest">{item.label}</span>
              <span className={`material-symbols-outlined text-[20px] ${item.color.includes('text-') ? item.color.split(' ')[0] : 'text-on-surface-variant/40'}`}>
                {item.icon}
              </span>
            </div>
            <span className={`font-headline-md text-2xl md:text-3xl ${item.color}`}>{item.val}</span>
          </div>
        ))}
      </section>

      {/* Main Grid: List and Detail Editor */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start relative z-10">
        
        {/* Repair Tickets Table/Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Controls Bar */}
          <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center border border-white/5 bg-surface-container/30">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 bg-white/2 p-1 rounded-lg border border-white/5 w-full md:w-auto">
              {['All', 'Active', 'Booked', 'Waiting for Parts', 'In Progress', 'Ready for Pickup', 'Completed', 'Cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md font-label-sm text-xs cursor-pointer transition-all ${
                    statusFilter === tab 
                      ? 'bg-secondary text-black font-semibold shadow-[0_0_8px_rgba(34,211,238,0.4)]' 
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  }`}
                >
                  {tab === 'Active' ? 'Pending' : tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, client, phone..."
                className="w-full bg-surface-container-highest border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
              />
            </div>
          </div>

          {/* Ticket Queue List */}
          <div className="glass-panel rounded-xl border border-white/5 bg-surface-container/20 overflow-hidden min-h-[400px]">
            {dashboardLoading ? (
              <div className="flex flex-col items-center justify-center p-20 text-on-surface-variant gap-3">
                <span className="loading loading-spinner text-secondary"></span>
                <p className="font-label-md">Loading tickets...</p>
              </div>
            ) : dashboardError ? (
              <div className="flex flex-col items-center justify-center p-20 text-error gap-3 text-center max-w-sm mx-auto">
                <span className="material-symbols-outlined text-4xl">warning</span>
                <p className="font-body-md">{dashboardError}</p>
                <button onClick={fetchTickets} className="px-4 py-2 bg-error-container/20 border border-error/30 text-error rounded-md text-xs">Retry</button>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-on-surface-variant gap-3 text-center">
                <span className="material-symbols-outlined text-4xl opacity-30">inbox</span>
                <p className="font-body-md">No repair tickets found matching the filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="table-auto w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      <th className="py-4 px-6">Ticket ID</th>
                      <th className="py-4 px-6">Client</th>
                      <th className="py-4 px-6">Device</th>
                      <th className="py-4 px-6">Issue</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Estimate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2">
                    {filteredTickets.map((ticket) => {
                      const isSelected = activeTicket?._id === ticket._id;
                      return (
                        <tr 
                          key={ticket._id}
                          onClick={() => handleSelectTicket(ticket)}
                          className={`hover:bg-white/2 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-secondary/5 font-semibold text-secondary hover:bg-secondary/10' : 'text-on-surface'
                          }`}
                        >
                          <td className="py-4 px-6 font-mono font-bold text-xs">
                            {ticket.ticketId}
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm font-medium">{ticket.customerName}</div>
                            <div className="text-[10px] text-on-surface-variant">{ticket.customerPhone}</div>
                          </td>
                          <td className="py-4 px-6 text-xs capitalize">
                            {ticket.deviceBrand} {cleanModelName(ticket.deviceModel)}
                          </td>
                          <td className="py-4 px-6 text-xs max-w-[120px] truncate">
                            <span className="bg-error-container/20 text-error border border-error/10 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                              {ticket.issue}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block border px-2.5 py-1 rounded text-[10px] font-bold ${getStatusBadgeClass(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-xs font-mono">
                            ${ticket.estimatedPrice}.00
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Detail Editor / Side Drawer */}
        <div className="lg:col-span-1">
          {activeTicket ? (
            <div className="glass-panel p-6 rounded-xl border border-secondary/20 bg-surface-container/40 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <div>
                  <h3 className="font-label-sm text-[10px] text-secondary uppercase tracking-widest font-bold">Diagnostic File</h3>
                  <h2 className="font-headline-sm text-lg font-mono font-bold text-on-surface">{activeTicket.ticketId}</h2>
                </div>
                <button 
                  onClick={() => setActiveTicket(null)}
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateTicket} className="space-y-6">
                
                {/* Client File */}
                <div className="bg-white/2 p-4 rounded-lg border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    <span className="material-symbols-outlined text-[14px]">contact_page</span>
                    Client Details
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-on-surface-variant block mb-0.5">Name</span>
                      <span className="font-medium text-on-surface">{activeTicket.customerName}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block mb-0.5">Phone</span>
                      <span className="font-medium text-on-surface">{activeTicket.customerPhone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-on-surface-variant block mb-0.5">Email</span>
                      <span className="font-medium text-on-surface truncate block">{parseNotes(activeTicket.notes).email}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-on-surface-variant block mb-0.5">Device Type</span>
                      <span className="font-medium text-on-surface capitalize flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {activeTicket.deviceType === 'tablet' ? 'tablet_mac' : activeTicket.deviceType === 'feature-phone' ? 'dialpad' : 'smartphone'}
                        </span>
                        {activeTicket.deviceType} • {activeTicket.deviceBrand} {cleanModelName(activeTicket.deviceModel)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block font-label-sm text-on-surface-variant mb-2 pl-1" htmlFor="edit-status">
                    Modify Status
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">rule</span>
                    <select
                      id="edit-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-surface-container border border-white/5 rounded-lg py-3 pl-10 pr-10 text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none cursor-pointer"
                    >
                      {['Booked', 'Waiting for Parts', 'In Progress', 'Ready for Pickup', 'Completed', 'Cancelled'].map((status) => (
                        <option key={status} value={status} className="bg-[#171f33] text-on-surface">{status}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>

                {/* Estimated Price */}
                <div>
                  <label className="block font-label-sm text-on-surface-variant mb-2 pl-1" htmlFor="edit-price">
                    Estimated Price (DA)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">payments</span>
                    <input
                      id="edit-price"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full bg-surface-container border border-white/5 rounded-lg py-3 pl-10 pr-4 text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Notes/Tech Logs */}
                <div>
                  <label className="block font-label-sm text-on-surface-variant mb-2 pl-1" htmlFor="edit-notes">
                    Technician Telemetry Logs
                  </label>
                  <textarea
                    id="edit-notes"
                    value={editNotesText}
                    onChange={(e) => setEditNotesText(e.target.value)}
                    rows={4}
                    placeholder="Enter diagnostic details, parts used, repair progress..."
                    className="w-full bg-surface-container border border-white/5 rounded-lg p-3 text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all resize-y custom-scrollbar"
                  ></textarea>
                </div>

                {updateSuccess && (
                  <div className="bg-success/15 border border-success/20 p-3 rounded-lg text-center text-success font-label-sm flex items-center justify-center gap-1.5 animate-fade-in text-xs">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Intake file successfully updated!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-secondary hover:bg-secondary/90 text-black py-3 rounded-lg font-label-md font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {isUpdating ? "Transmitting logs..." : "Commit Changes"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-xl border border-white/5 bg-surface-container/20 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3 min-h-[350px]">
              <span className="material-symbols-outlined text-4xl opacity-30">info</span>
              <p className="font-body-md max-w-[200px] text-sm">Select a diagnostic ticket from the queue to view its active telemetry and modify status.</p>
            </div>
          )}
        </div>

      </section>
    </main>
  );
}
