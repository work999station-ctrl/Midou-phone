import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import { cleanModelName } from '../data/devicesData';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RepairTrack() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { t, lang } = useLanguageStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchType, setSearchType] = useState('ticketId'); // 'ticketId' | 'phone'
  const [searchValue, setSearchValue] = useState('');
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [imageLightbox, setImageLightbox] = useState(null);

  const STAGES = [
    { label: 'In Progress', displayLabel: t('stageInProgress', 'In Progress'), desc: t('stageInProgressDesc', 'Device is being repaired') },
    { label: 'Ready for Pickup', displayLabel: t('stageReadyForPickup', 'Ready for Pickup'), desc: t('stageReadyForPickupDesc', 'Ready for collection') }
  ];

  // Helper for strict Day Month Year + Time formatting
  const formatDateWithTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const day = d.getDate();
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (lang === 'ar') {
        const arabicMonths = [
          'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
          'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        const monthName = arabicMonths[d.getMonth()];
        return `\u200E${day} \u200E${monthName} \u200E${year} في ${timeStr}`;
      } else {
        const enMonths = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = enMonths[d.getMonth()];
        return `${day} ${monthName} ${year} at ${timeStr}`;
      }
    } catch {
      return dateStr;
    }
  };

  const formatDateSimple = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const year = d.getFullYear();
      if (lang === 'ar') {
        const arabicMonths = [
          'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
          'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return `\u200E${day} \u200E${arabicMonths[d.getMonth()]} \u200E${year}`;
      } else {
        const enMonths = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${day} ${enMonths[d.getMonth()]} ${year}`;
      }
    } catch {
      return dateStr;
    }
  };

  const getIssueLabel = (iss) => {
    if (!iss) return '';
    const map = {
      'Screen & Display': t('issueScreenDisplay', 'Screen & Display'),
      'screen & display': t('issueScreenDisplay', 'Screen & Display'),
      'cracked screen': t('issueScreenDisplay', 'Screen & Display'),
      'Charging Port': t('issueChargingPort', 'Charging Port'),
      'charging port': t('issueChargingPort', 'Charging Port'),
      'Audio Output': t('issueAudioOutput', 'Audio Output'),
      'audio output': t('issueAudioOutput', 'Audio Output'),
      'Audio Input': t('issueAudioInput', 'Audio Input'),
      'audio input': t('issueAudioInput', 'Audio Input'),
      'Battery': t('issueBattery', 'Battery'),
      'battery': t('issueBattery', 'Battery'),
      'Camera': t('issueCamera', 'Camera'),
      'camera': t('issueCamera', 'Camera'),
      'Changing Cover': t('issueChangingCover', 'Changing Cover'),
      'changing cover': t('issueChangingCover', 'Changing Cover'),
      'Physical Buttons': t('issueButtons', 'Physical Buttons'),
      'buttons': t('issueButtons', 'Physical Buttons'),
      'Unknown Issue': t('issueUnknown', 'Unknown Issue'),
      'unknown issue': t('issueUnknown', 'Unknown Issue'),
      'Other': t('issueOther', 'Other'),
      'other': t('issueOther', 'Other')
    };
    return map[iss] || map[iss.toLowerCase()] || iss;
  };

  const getStatusLabel = (status) => {
    if (status === 'Completed') return t('statusCompleted', 'Completed');
    if (status === 'Cancelled') return t('statusCancelled', 'Cancelled');
    if (status === 'Ready for Pickup') return t('statusReadyForPickup', 'Ready for Pickup');
    return t('statusInProgress', 'In Progress');
  };

  // Auto-search if ticketId is passed in URL query
  useEffect(() => {
    const ticketIdParam = searchParams.get('ticketId');
    if (ticketIdParam) {
      setSearchType('ticketId');
      setSearchValue(ticketIdParam);
      handleSearch(ticketIdParam, 'ticketId');
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    handleSearch(searchValue.trim(), searchType);
  };

  const handleSearch = async (val, type) => {
    setIsLoading(true);
    setErrorMsg(null);
    setTickets([]);
    setActiveTicket(null);

    const queryParam = `query=${encodeURIComponent(val)}&${type === 'ticketId' ? 'ticketId' : 'customerPhone'}=${encodeURIComponent(val)}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/track?${queryParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch repair details.');
      }
      const data = await response.json();
      
      if (data && data.length > 0) {
        setTickets(data);
        setActiveTicket(data[0]); // default to first ticket
        // Update URL query parameters if it's a specific ticketId search
        if (data[0]?.ticketId) {
          setSearchParams({ ticketId: data[0].ticketId });
        }
      } else {
        setErrorMsg(t('noActiveTicketsFound', 'No active repair tickets found matching your query.'));
      }
    } catch (err) {
      setErrorMsg(t('failedToConnectServer', 'Failed to connect to the tracking server. Please check your connection and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse notes (separating email, protector cross-sell, and actual notes)
  const parseNotes = (notesStr) => {
    if (!notesStr) return { email: t('noneProvided', 'None Provided'), protector: 'No', text: t('noDiagnosticNotes', 'None') };
    const parts = notesStr.split('|').map(p => p.trim());
    const emailPart = parts.find(p => p.toLowerCase().startsWith('email:')) || '';
    const email = emailPart.split(':')[1]?.trim() || t('noneProvided', 'None Provided');
    
    const protectorPart = parts.find(p => p.toLowerCase().includes('screen protector:')) || '';
    const protector = protectorPart.split(':')[1]?.trim() || 'No';

    const notesPart = parts.find(p => p.toLowerCase().startsWith('notes:')) || '';
    const text = notesPart.split(':')[1]?.trim() || t('noDiagnosticNotes', 'None');

    return { email, protector, text };
  };

  // Calculate active line progress width for desktop horizontal line
  const getProgressWidthClass = (status) => {
    return ['Ready for Pickup', 'Completed'].includes(status) ? 'w-[calc(100%-48px)]' : 'w-0';
  };

  // Short-polling for the active ticket
  useEffect(() => {
    if (!activeTicket) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}//api/repairs/track?ticketId=${encodeURIComponent(activeTicket.ticketId)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const updatedTicket = data[0];
            // Only update if changes occurred
            if (
              updatedTicket.messages?.length !== activeTicket.messages?.length ||
              updatedTicket.status !== activeTicket.status ||
              updatedTicket.estimatedPrice !== activeTicket.estimatedPrice ||
              updatedTicket.notes !== activeTicket.notes
            ) {
              setActiveTicket(updatedTicket);
              setTickets(prev => prev.map(item => item._id === updatedTicket._id ? updatedTicket : item));
            }
          }
        }
      } catch (err) {
        console.error('Client polling error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [activeTicket?.ticketId]);

  return (
    <main className="flex-grow pt-32 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-12 relative z-10">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Header & Search Section */}
      <section className="flex flex-col items-center text-center max-w-2xl mx-auto w-full relative z-10">
        {isAuthenticated && (
          <div className="w-full mb-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-high border border-white/10 hover:border-secondary/50 text-on-surface hover:text-secondary text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t('dashboard', 'Dashboard')}
            </button>
            <div className="flex items-center gap-3">
              <LanguageSwitcher compact />
              <span className="text-xs text-on-surface-variant font-medium">{t('trackStatus', 'Track Status')}</span>
            </div>
          </div>
        )}

        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-stack-sm tracking-tight">
          {t('trackRepairTitle', 'Diagnostic Routing')}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg">
          {t('trackRepairSubtitle', 'Enter your credentials to access live kinetic telemetry for your device repair.')}
        </p>

        <div className="glass-panel w-full p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/10 rounded-full blur-[60px] pointer-events-none"></div>
          
          {/* Search Type Toggles */}
          <div className="flex justify-center gap-8 mb-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="searchType" 
                checked={searchType === 'ticketId'}
                onChange={() => { setSearchType('ticketId'); setSearchValue(''); }}
                className="form-radio text-secondary bg-surface-container border-outline-variant focus:ring-secondary focus:ring-offset-background w-4 h-4 cursor-pointer"
              />
              <span className={`font-label-md text-label-md transition-colors cursor-pointer ${searchType === 'ticketId' ? 'text-secondary font-bold' : 'text-on-surface-variant group-hover:text-secondary'}`}>
                {t('trackByTicketId', 'Ticket ID')}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="searchType" 
                checked={searchType === 'phone'}
                onChange={() => { setSearchType('phone'); setSearchValue(''); }}
                className="form-radio text-secondary bg-surface-container border-outline-variant focus:ring-secondary focus:ring-offset-background w-4 h-4 cursor-pointer"
              />
              <span className={`font-label-md text-label-md transition-colors cursor-pointer ${searchType === 'phone' ? 'text-secondary font-bold' : 'text-on-surface-variant group-hover:text-secondary'}`}>
                {t('trackByPhone', 'Phone Number')}
              </span>
            </label>
          </div>

          {/* Search Bar Input */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                {searchType === 'ticketId' ? 'qr_code' : 'phone'}
              </span>
              <input 
                type="text" 
                value={searchValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchValue(val);
                  if (val.trim().toUpperCase().startsWith('REP')) {
                    setSearchType('ticketId');
                  } else if (/^[0-9+\s()/-]+$/.test(val.trim()) && val.trim().replace(/\D/g, '').length >= 3) {
                    setSearchType('phone');
                  }
                }}
                placeholder={searchType === 'ticketId' ? t('trackInputPlaceholderTicket', 'e.g. REP-20260814-1234') : t('trackInputPlaceholderPhone', 'e.g. 0555123456')}
                className="w-full bg-surface-container-highest border border-white/5 rounded-lg py-4 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all shadow-inner"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading || !searchValue.trim()}
              className="bg-inverse-primary hover:bg-primary-container text-white px-8 py-4 rounded-lg font-label-md text-label-md transition-all shadow-[0_0_20px_rgba(73,75,214,0.3)] hover:shadow-[0_0_30px_rgba(128,131,255,0.5)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>{t('checkingStatus', 'Checking...')}</span>
              ) : (
                <>
                  <span>{t('trackStatusButton', 'Track Status')}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Error Message */}
      {errorMsg && (
        <div className="max-w-xl mx-auto w-full glass-panel border border-error/20 bg-error-container/10 p-6 rounded-xl text-center animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
          <span className="material-symbols-outlined text-error text-[40px] mb-2">warning</span>
          <p className="font-body-md text-body-md text-on-surface">{errorMsg}</p>
        </div>
      )}

      {/* Multi-Ticket Selector (If searching by phone results in multiple tickets) */}
      {!isLoading && tickets.length > 1 && (
        <section className="w-full max-w-4xl mx-auto relative z-10 animate-fade-in">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-4">{t('associatedTickets', 'Associated Repair Tickets')} ({tickets.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => setActiveTicket(ticket)}
                className={`glass-panel p-4 rounded-xl text-left border hover:border-secondary/50 transition-all cursor-pointer flex flex-col gap-2 ${
                  activeTicket?._id === ticket._id ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/30' : 'border-white/5 bg-white/2'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-label-sm text-label-sm text-secondary font-bold">{ticket.ticketId}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    ticket.status === 'Completed' ? 'bg-success/15 text-success border border-success/10' :
                    ticket.status === 'Cancelled' ? 'bg-error/15 text-error border border-error/10' :
                    ticket.status === 'Ready for Pickup' ? 'bg-secondary/15 text-secondary border border-secondary/10' :
                    'bg-white/10 text-on-surface-variant'
                  }`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
                <div>
                  <p className="font-body-sm text-body-sm text-on-surface font-medium capitalize">{ticket.deviceBrand} {cleanModelName(ticket.deviceModel)}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-xs mt-1">{t('bookedOn', 'Booked')}: <span dir="ltr">{formatDateSimple(ticket.createdAt)}</span></p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Simulated Active State (Assuming ticket is searched/active) */}
      {!isLoading && activeTicket && (
        <div className="animate-fade-in flex flex-col gap-12 relative z-10">
          
          {/* Stepper (Only show if ticket is not cancelled) */}
          {activeTicket.status !== 'Cancelled' ? (
            <section className="glass-panel p-8 md:p-12 rounded-2xl w-full relative overflow-hidden">
              {/* Stepper Container */}
              <div className="w-full max-w-md mx-auto flex flex-col md:flex-row items-start md:items-center relative justify-between gap-8 md:gap-0">
                {/* Connecting Line Background (Desktop) */}
                <div className="hidden md:block absolute top-6 left-6 right-6 h-[2px] bg-white/5 z-0"></div>
                {/* Active Line Progress (Desktop) */}
                <div className={`hidden md:block absolute top-6 left-6 h-[2px] bg-secondary z-0 shadow-[0_0_10px_rgba(93,230,255,0.5)] transition-all duration-500 ${getProgressWidthClass(activeTicket.status)}`}></div>

                {/* Steps Mapping */}
                {STAGES.map((stage, idx) => {
                  const isCompleted = idx === 0
                    ? activeTicket.status !== 'Cancelled'
                    : ['Ready for Pickup', 'Completed'].includes(activeTicket.status);

                  return (
                    <div key={stage.label} className="flex flex-row md:flex-col items-center gap-4 z-10 relative w-full md:w-auto">
                      {/* Mobile Connecting Line (Rendered above step for indices > 0) */}
                      {idx > 0 && (
                        <div className={`md:hidden absolute -top-8 left-6 w-[2px] h-8 z-0 ${
                          isCompleted ? 'bg-secondary' : 'bg-white/5'
                        }`}></div>
                      )}

                      {/* Circle Indicator */}
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCompleted 
                          ? 'bg-secondary border-secondary text-black shadow-[0_0_12px_rgba(93,230,255,0.3)]' 
                          : 'bg-surface border-outline-variant/50 text-on-surface-variant opacity-50'
                      }`}>
                        <span className={`material-symbols-outlined text-[20px] ${
                          isCompleted ? 'text-black font-bold' : 'text-on-surface-variant'
                        }`}>
                          {idx === 0 ? 'handyman' : 'check'}
                        </span>
                      </div>

                      {/* Labels and Details */}
                      <div className="text-left md:text-center">
                        <div className="flex items-center gap-2 justify-start md:justify-center">
                          {activeTicket.status === stage.label && <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>}
                          <h3 className={`font-label-md text-label-md ${
                            activeTicket.status === stage.label ? 'text-secondary font-bold' : isCompleted ? 'text-on-surface' : 'text-on-surface-variant opacity-50'
                          }`}>
                            {stage.displayLabel}
                          </h3>
                        </div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant text-xs mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            /* Cancelled Ticket Display */
            <section className="glass-panel p-8 md:p-12 rounded-2xl w-full border border-error/20 bg-error-container/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-error"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[24px]">cancel</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-error font-bold">{t('ticketCancelledTitle', 'Repair Ticket Cancelled')}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    {t('ticketCancelledDesc', 'This booking has been cancelled. Please reach out to customer support if you believe this was an error.')}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Ticket Details Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
            
            {/* Device Details Card */}
            <div className="glass-panel p-8 md:p-10 rounded-3xl flex flex-col gap-8 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
              
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-xl">
                  {activeTicket.deviceType === 'tablet' 
                    ? 'tablet_mac' 
                    : activeTicket.deviceType === 'feature-phone' 
                      ? 'dialpad' 
                      : 'smartphone'}
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('deviceProfile', 'Device Profile')}</h2>
              </div>
              
              <div className="flex flex-col-reverse lg:flex-row gap-8 items-center lg:items-start justify-between w-full">
                {/* Details Section */}
                <div className="flex-grow flex flex-col gap-5 w-full">
                  <div>
                    <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1">{t('brandAndModel', 'Brand & Model')}</p>
                    <p className="text-xl text-on-surface font-extrabold capitalize tracking-wide">{activeTicket.deviceBrand} {cleanModelName(activeTicket.deviceModel)}</p>
                  </div>
                  <div>
                    <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-2">{t('issueLabel', 'Issue')}</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(activeTicket.issue) ? (
                        activeTicket.issue.map((iss, i) => (
                          <div key={i} className="inline-block bg-error/10 text-error text-xs font-bold px-3 py-1.5 rounded-lg border border-error/25 uppercase tracking-wider whitespace-nowrap shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                            {getIssueLabel(iss)}
                          </div>
                        ))
                      ) : (
                        <div className="inline-block bg-error/10 text-error text-xs font-bold px-3 py-1.5 rounded-lg border border-error/25 uppercase tracking-wider whitespace-nowrap shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                          {getIssueLabel(activeTicket.issue)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1">{t('technicianNotes', 'Technician Notes & Specifications')}</p>
                    <p className="text-on-surface-variant bg-black/30 p-4 rounded-xl border border-white/5 text-sm whitespace-pre-line leading-relaxed shadow-inner">
                      {parseNotes(activeTicket.notes).text}
                    </p>
                  </div>
                </div>

                {/* Device Image Frame */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative group/img cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 opacity-30 pointer-events-none"></div>
                  {activeTicket.deviceImage ? (
                    <img 
                      src={activeTicket.deviceImage} 
                      alt="Device" 
                      onClick={() => setImageLightbox(activeTicket.deviceImage)}
                      className="w-full h-full object-contain p-2 relative z-10 transition-transform duration-500 group-hover/img:scale-105" 
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[64px] text-primary/40 relative z-10">
                      {activeTicket.deviceType === 'tablet' 
                        ? 'tablet_mac' 
                        : activeTicket.deviceType === 'feature-phone' 
                          ? 'dialpad' 
                          : 'smartphone'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Client Dossier & Billing Card */}
            <div className="glass-panel p-8 md:p-10 rounded-3xl flex flex-col gap-8 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full pointer-events-none"></div>
              
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2.5 rounded-xl">account_circle</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('clientDossier', 'Client Dossier')}</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full">
                <div>
                  <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">{t('nameLabel', 'Name')}</p>
                  <p className="text-lg text-on-surface font-semibold capitalize">{activeTicket.customerName || t('anonymousClient', 'Anonymous Client')}</p>
                </div>
                <div>
                  <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">{t('contactLabel', 'Contact')}</p>
                  <p className="text-lg text-on-surface font-semibold">{activeTicket.customerPhone || t('noneProvided', 'None Provided')}</p>
                </div>
                <div>
                  <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">{t('clientEmailLabel', 'Client Email')}</p>
                  <p className="text-lg text-on-surface font-semibold truncate">{parseNotes(activeTicket.notes).email}</p>
                </div>
                <div>
                  <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1.5">{t('bookingDateLabel', 'Booking Date')}</p>
                  <p className="text-lg text-on-surface font-semibold" dir="ltr">
                    {formatDateWithTime(activeTicket.createdAt)}
                  </p>
                </div>
                {parseNotes(activeTicket.notes).protector.toLowerCase().includes('yes') && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3.5 py-2 rounded-xl border border-secondary/25 font-bold shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                      <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
                      {t('includesScreenProtector', 'Includes Unbreakable Screen Protector (+15.00 DA)')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1">{t('estimatedCostLabel', 'Estimated Cost')}</p>
                <p className="font-headline-md text-headline-md text-secondary text-[32px] font-extrabold tracking-wide whitespace-nowrap" dir="ltr">
                  {(Number(activeTicket.estimatedPrice) || 0).toFixed(2)} {t('currency', 'DA')}
                </p>
              </div>
            </div>

          </section>
        </div>
      )}

      {imageLightbox && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in cursor-zoom-out"
          onClick={() => setImageLightbox(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={imageLightbox} alt="Device Full View" className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10" />
            <button 
              className="absolute -top-12 right-0 text-white hover:text-secondary flex items-center gap-1 text-sm font-semibold uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer border-none"
              onClick={() => setImageLightbox(null)}
            >
              <span className="material-symbols-outlined text-sm">close</span> {t('closeLightbox', 'Close')}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
