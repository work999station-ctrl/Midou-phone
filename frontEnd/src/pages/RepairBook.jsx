import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useRepairStore } from '../features/repairs/store/useRepairStore';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import { brandModels, cleanModelName } from '../data/devicesData';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getApiUrl } from '../config/api';

// Flatten all devices for quick search lookup
const allDevicesList = [];
for (const [brand, categories] of Object.entries(brandModels)) {
  if (brand === 'Other') continue;
  for (const [category, models] of Object.entries(categories)) {
    let deviceType = 'phone';
    if (category.toLowerCase().includes('tablet') || category.toLowerCase().includes('ipad') || category.toLowerCase().includes('tab')) {
      deviceType = 'tablet';
    } else if (category.toLowerCase().includes('feature') || category.toLowerCase().includes('retro') || category.toLowerCase().includes('classic') || category.toLowerCase().includes('modern feature')) {
      deviceType = 'feature-phone';
    }
    
    for (const model of models) {
      allDevicesList.push({
        brand,
        model,
        deviceType,
        category
      });
    }
  }
}

export default function RepairBook() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { step, bookingData, setBookingData, nextStep, prevStep, setStep, resetBooking } = useRepairStore();
  const { t, lang } = useLanguageStore();

  const getComponentLabel = (id) => {
    switch (id) {
      case 'Screen & Display': return t('compScreenDisplay', 'Screen & Display');
      case 'Battery': return t('compBattery', 'Battery');
      case 'Camera': return t('compCamera', 'Camera');
      case 'Audio Output': return t('compAudioOutput', 'Audio Output');
      case 'Audio Input': return t('compAudioInput', 'Audio Input');
      case 'Physical Buttons': return t('compButtons', 'Physical Buttons');
      case 'Charging Port': return t('compChargingPort', 'Charging Port');
      case 'Changing Cover': return t('compChangingCover', 'Changing Cover');
      case 'Unknown Issue': return t('compUnknownIssue', 'Unknown Issue');
      case 'Other': return t('compOther', 'Other');
      default: return id;
    }
  };

  // Access check
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const [email, setEmail] = useState('');
  const [addProtection, setAddProtection] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  const [errors, setErrors] = useState({});
  const [showScreenPriceModal, setShowScreenPriceModal] = useState(false);
  const [modalScreenPrice, setModalScreenPrice] = useState('');

  // Autocomplete state
  const [modelSearch, setModelSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Direct model search state
  const [directSearchQuery, setDirectSearchQuery] = useState('');
  const [isDirectDropdownOpen, setIsDirectDropdownOpen] = useState(false);
  const directSearchRef = useRef(null);

  // AI Image Recognition State
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const imageInputRef = useRef(null);


  // Fetch pricing matrix from backend
  useEffect(() => {
    fetch(getApiUrl() + '/api/repairs/prices')
      .then((res) => res.json())
      .then((data) => setPricing(data))
      .catch(() => {
        // Fallback pricing matrix
        setPricing({
          phone: {
            'charging port': 49,
            'buttons': 39,
            'audio output': 49,
            'other': 29,
            'multipel issues': 99,
            'unknown issue': 39,
            'audio input': 49,
            'screen & display': 79
          },
          tablet: {
            'charging port': 59,
            'buttons': 49,
            'audio output': 59,
            'other': 39,
            'multipel issues': 129,
            'unknown issue': 49,
            'audio input': 59,
            'screen & display': 119
          },
          'feature-phone': {
            'charging port': 29,
            'buttons': 25,
            'audio output': 25,
            'other': 19,
            'multipel issues': 49,
            'unknown issue': 25,
            'audio input': 25,
            'screen & display': 39
          }
        });
      });
  }, []);

  // Removed automatic price calculation

  const handleDeviceSelect = (type) => {
    setBookingData({ deviceType: type });
    setErrors((prev) => ({ ...prev, deviceType: null }));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (directSearchRef.current && !directSearchRef.current.contains(event.target)) {
        setIsDirectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync model search text if selected model changes externally
  useEffect(() => {
    setModelSearch(bookingData.model || '');
    setDirectSearchQuery(bookingData.model || '');
  }, [bookingData.model]);

  const handleBrandChange = (e) => {
    setBookingData({ brand: e.target.value, model: '' }); // Clear model when brand changes
    setModelSearch('');
    setErrors((prev) => ({ ...prev, brand: null, model: null }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBookingData({ deviceImage: event.target.result });
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleModelChange = (e) => {
    setBookingData({ model: e.target.value });
    setErrors((prev) => ({ ...prev, model: null }));
  };

  const handleSaveScreenPrice = (priceVal) => {
    const screenPriceNum = Number(priceVal) || 0;
    setBookingData({
      screenDisplayPrice: screenPriceNum,
      estimatedPrice: (bookingData.estimatedPrice || 0) + screenPriceNum
    });
    setShowScreenPriceModal(false);
  };

  const handleIssueSelect = (issueName) => {
    let currentIssues = Array.isArray(bookingData.issue) ? [...bookingData.issue] : (bookingData.issue ? [bookingData.issue] : []);

    if (currentIssues.includes(issueName)) {
      currentIssues = currentIssues.filter(item => item !== issueName);
      setBookingData({ issue: currentIssues });
      setErrors((prev) => ({ ...prev, issue: null }));
      
      // If Screen & Display is deselected, subtract screenDisplayPrice
      if (issueName === 'Screen & Display') {
        const prevScreenPrice = bookingData.screenDisplayPrice || 0;
        setBookingData({
          screenDisplayPrice: 0,
          estimatedPrice: Math.max(0, (bookingData.estimatedPrice || 0) - prevScreenPrice),
          issue: currentIssues
        });
      }
    } else {
      currentIssues.push(issueName);
      setBookingData({ issue: currentIssues });
      setErrors((prev) => ({ ...prev, issue: null }));

      // If Screen & Display is selected, open custom modal
      if (issueName === 'Screen & Display') {
        setModalScreenPrice(bookingData.screenDisplayPrice || '');
        setShowScreenPriceModal(true);
      }
    }
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!bookingData.deviceType) newErrors.deviceType = 'Please select a device type.';
      if (!bookingData.brand) newErrors.brand = 'Please select a manufacturer.';
      if (!bookingData.model) newErrors.model = 'Please select your device model.';
    } else if (step === 2) {
      const issueSelected = Array.isArray(bookingData.issue) ? bookingData.issue.length > 0 : !!bookingData.issue;
      if (!issueSelected) newErrors.issue = 'Please select the issue component.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Build combined notes containing email and protection detail
    const protectionNote = addProtection ? 'Include unbreakable screen protector: Yes (+$15.00)' : 'Include unbreakable screen protector: No';
    const combinedNotes = `Email: ${email || 'N/A'} | ${protectionNote} | Notes: ${bookingData.notes || 'None'}`;
    
    const finalPrice = addProtection ? (bookingData.estimatedPrice || 0) + 15 : (bookingData.estimatedPrice || 0);

    const mapIssueToBackend = (issueName) => {
      switch (issueName) {
        case 'Screen & Display': return 'screen & display';
        case 'Battery': return 'battery';
        case 'Camera': return 'camera';
        case 'Audio Output': return 'audio output';
        case 'Audio Input': return 'audio input';
        case 'Physical Buttons': return 'buttons';
        case 'Charging Port': return 'charging port';
        case 'Changing Cover': return 'changing cover';
        case 'Unknown Issue': return 'unknown issue';
        case 'Other': return 'other';
        default: return issueName.toLowerCase();
      }
    };

    const selectedIssuesArray = Array.isArray(bookingData.issue)
      ? bookingData.issue
      : (bookingData.issue ? [bookingData.issue] : []);
    
    const mappedIssues = selectedIssuesArray.map(mapIssueToBackend);

    const bookingPayload = {
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      deviceType: bookingData.deviceType,
      deviceBrand: bookingData.brand,
      deviceModel: cleanModelName(bookingData.model),
      deviceImage: bookingData.deviceImage || '',
      issue: mappedIssues,
      notes: combinedNotes,
      estimatedPrice: finalPrice,
      status: 'In Progress',
      screenDisplayPrice: bookingData.screenDisplayPrice || 0
    };

    try {
      const response = await fetch(getApiUrl() + '/api/repairs/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessTicket(data.ticket);
        resetBooking();
      } else {
        alert(data.message || 'Error booking repair');
      }
    } catch (err) {
      alert('Failed to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successTicket) {
    return (
      <main className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop pt-36 md:pt-44 pb-24 md:pb-32 relative z-10">
        <div className="w-full max-w-2xl bg-surface-container/60 glass-panel rounded-xl p-8 md:p-12 text-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
          
          <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(93,230,255,0.3)]">
            <span className="material-symbols-outlined text-[40px] text-secondary">check_circle</span>
          </div>

          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-stack-sm">
            {t('bookingConfirmedTitle', 'Booking Confirmed!')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-md mx-auto">
            {t('bookingConfirmedDesc', 'Your repair request has been logged successfully. Please bring your device to our shop for physical inspection.')}
          </p>

          <div className="p-stack-md rounded-lg bg-white/5 border border-white/10 mb-8 max-w-sm mx-auto">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">{t('yourTicketId', 'Your Ticket ID')}</span>
            <span className="font-headline-md text-secondary tracking-wide select-all font-bold block" dir="ltr">{successTicket.ticketId}</span>
            <span className="font-body-sm text-label-sm text-on-surface-variant block mt-2">{t('useTicketIdNotice', 'Use this ID to track your repair status.')}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-stack-md justify-center">
            <button 
              onClick={() => navigate(`/repair/track?ticketId=${successTicket.ticketId}`)}
              className="px-6 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(128,131,255,0.25)]"
            >
              {t('trackRepairStatusBtn', 'Track Repair Status')}
            </button>
            <button 
              onClick={() => { setSuccessTicket(null); navigate('/'); }}
              className="px-6 py-3 rounded-lg border border-outline text-on-surface hover:bg-white/5 hover:border-white transition-all font-label-md text-label-md cursor-pointer"
            >
              {t('backToHome', 'Back to Home')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const getFilteredGlobalGroups = () => {
    const query = modelSearch.toLowerCase().trim();
    if (!query) {
      if (!bookingData.brand || !brandModels[bookingData.brand]) return [];
      return Object.entries(brandModels[bookingData.brand]);
    }
    
    const searchTerms = query.split(/\s+/);
    const matched = allDevicesList.filter(device => {
      const brandLower = device.brand.toLowerCase();
      const modelLower = device.model.toLowerCase();
      const categoryLower = device.category.toLowerCase();
      const fullName = `${brandLower} ${modelLower} ${categoryLower}`;
      
      return searchTerms.every(term => fullName.includes(term));
    });

    const grouped = {};
    for (const device of matched) {
      if (!grouped[device.brand]) {
        grouped[device.brand] = [];
      }
      grouped[device.brand].push(device);
    }
    return Object.entries(grouped).slice(0, 15);
  };

  const filteredGlobalGroups = getFilteredGlobalGroups();

  const getFilteredDirectSuggestions = () => {
    const query = directSearchQuery.toLowerCase().trim();
    if (!query) return [];
    
    const searchTerms = query.split(/\s+/);
    return allDevicesList.filter(device => {
      if (bookingData.brand && device.brand.toLowerCase() !== bookingData.brand.toLowerCase()) {
        return false;
      }
      const brandLower = device.brand.toLowerCase();
      const modelLower = device.model.toLowerCase();
      const categoryLower = device.category.toLowerCase();
      const fullName = `${brandLower} ${modelLower} ${categoryLower}`;
      
      return searchTerms.every(term => fullName.includes(term));
    }).slice(0, 15);
  };

  const filteredDirectSuggestions = getFilteredDirectSuggestions();

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop pt-32 md:pt-36 pb-24 md:pb-32 relative z-10">
      {/* Return to Dashboard Button (outside the box) */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-high border border-white/10 hover:border-secondary/50 text-on-surface hover:text-secondary text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t('dashboard', 'Dashboard')}
        </button>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <span className="text-xs text-on-surface-variant font-medium">{t('repairBookingTitle', 'Repair Booking')}</span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-surface-container/60 glass-panel rounded-xl p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative">
        {/* Ambient Internal Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>

        {/* Stepper Progress Indicator */}
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => step > 1 && setStep(1)}
                disabled={step <= 1}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md transition-all ${
                  step > 1 
                    ? 'bg-secondary text-black shadow-[0_0_12px_rgba(93,230,255,0.4)] cursor-pointer' 
                    : step === 1
                      ? 'border-2 border-secondary bg-secondary/15 text-secondary font-bold'
                      : 'border-2 border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                {step > 1 ? <span className="material-symbols-outlined text-[16px] font-bold">check</span> : 1}
              </button>
            </div>
            
            {/* Line 1 */}
            <div className={`flex-grow h-[2px] mx-4 transition-all duration-300 ${step > 1 ? 'bg-secondary shadow-[0_0_8px_#22d3ee]' : 'bg-surface-variant'}`}></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => step > 2 && setStep(2)}
                disabled={step <= 2}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md transition-all ${
                  step > 2 
                    ? 'bg-secondary text-black shadow-[0_0_12px_rgba(93,230,255,0.4)] cursor-pointer' 
                    : step === 2
                      ? 'border-2 border-secondary bg-secondary/15 text-secondary font-bold'
                      : 'border-2 border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                {step > 2 ? <span className="material-symbols-outlined text-[16px] font-bold">check</span> : 2}
              </button>
            </div>

            {/* Line 2 */}
            <div className={`flex-grow h-[2px] mx-4 transition-all duration-300 ${step > 2 ? 'bg-secondary shadow-[0_0_8px_#22d3ee]' : 'bg-surface-variant'}`}></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => step > 3 && setStep(3)}
                disabled={step <= 3}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md transition-all ${
                  step > 3 
                    ? 'bg-secondary text-black shadow-[0_0_12px_rgba(93,230,255,0.4)] cursor-pointer' 
                    : step === 3
                      ? 'border-2 border-secondary bg-secondary/15 text-secondary font-bold'
                      : 'border-2 border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                {step > 3 ? <span className="material-symbols-outlined text-[16px] font-bold">check</span> : 3}
              </button>
            </div>

            {/* Line 3 */}
            <div className={`flex-grow h-[2px] mx-4 transition-all duration-300 ${step > 3 ? 'bg-secondary shadow-[0_0_8px_#22d3ee]' : 'bg-surface-variant'}`}></div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md transition-all ${
                  step === 4
                    ? 'border-2 border-secondary bg-secondary/15 text-secondary font-bold shadow-[0_0_12px_rgba(93,230,255,0.4)]'
                    : 'border-2 border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                4
              </div>
            </div>
          </div>

          {/* Stepper Labels */}
          <div className="flex justify-between px-1 text-xs text-on-surface-variant mt-2">
            <span className={`font-label-sm text-label-sm ${step >= 1 ? 'text-secondary font-medium' : 'text-on-surface-variant'}`}>{t('stepDevice', 'Device')}</span>
            <span className={`font-label-sm text-label-sm ${step >= 2 ? 'text-secondary font-medium' : 'text-on-surface-variant'}`}>{t('stepIssue', 'Issue')}</span>
            <span className={`font-label-sm text-label-sm ${step >= 3 ? 'text-secondary font-medium' : 'text-on-surface-variant'}`}>{t('stepContact', 'Contact')}</span>
            <span className={`font-label-sm text-label-sm ${step >= 4 ? 'text-secondary font-medium' : 'text-on-surface-variant'}`}>{t('stepReview', 'Review')}</span>
          </div>
        </div>

        {/* Step 1: Device Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">{t('selectDeviceType', 'Select Your Device')}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('selectDeviceDesc', 'Choose the type of device that needs attention.')}</p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
              {/* Smartphone Card */}
              <button 
                onClick={() => handleDeviceSelect('phone')}
                className={`glass-panel rounded-lg p-6 flex flex-col items-center justify-center group relative overflow-hidden transition-all duration-300 h-44 border cursor-pointer ${
                  bookingData.deviceType === 'phone'
                    ? 'border-secondary bg-secondary/10 text-secondary ring-1 ring-secondary'
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-secondary/50'
                }`}
              >
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className={`material-symbols-outlined text-[48px] mb-2 transition-colors duration-300 ${bookingData.deviceType === 'phone' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  smartphone
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('deviceSmartphone', 'Smartphone')}</h3>
              </button>

              {/* Tablet Card */}
              <button 
                onClick={() => handleDeviceSelect('tablet')}
                className={`glass-panel rounded-lg p-6 flex flex-col items-center justify-center group relative overflow-hidden transition-all duration-300 h-44 border cursor-pointer ${
                  bookingData.deviceType === 'tablet'
                    ? 'border-secondary bg-secondary/10 text-secondary ring-1 ring-secondary'
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-secondary/50'
                }`}
              >
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className={`material-symbols-outlined text-[48px] mb-2 transition-colors duration-300 ${bookingData.deviceType === 'tablet' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  tablet_mac
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('deviceTablet', 'Tablet')}</h3>
              </button>

              {/* Feature Phone Card */}
              <button 
                onClick={() => handleDeviceSelect('feature-phone')}
                className={`glass-panel rounded-lg p-6 flex flex-col items-center justify-center group relative overflow-hidden transition-all duration-300 h-44 border cursor-pointer ${
                  bookingData.deviceType === 'feature-phone'
                    ? 'border-secondary bg-secondary/10 text-secondary ring-1 ring-secondary'
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-secondary/50'
                }`}
              >
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg 
                  className={`w-[48px] h-[48px] mb-2 transition-colors duration-300 ${bookingData.deviceType === 'feature-phone' ? 'text-secondary' : 'text-on-surface-variant'}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {/* Phone Outline */}
                  <rect x="6" y="1.5" width="12" height="21" rx="2.5" />
                  {/* Earpiece */}
                  <line x1="10.5" y1="3" x2="13.5" y2="3" />
                  {/* Screen */}
                  <rect x="8" y="4.5" width="8" height="6.5" rx="1" fill="currentColor" fillOpacity="0.25" />
                  {/* Center Nav D-Pad */}
                  <rect x="10" y="12" width="4" height="2.5" rx="0.5" fill="currentColor" fillOpacity="0.4" />
                  {/* Side Function Keys */}
                  <line x1="8" y1="12.5" x2="9.2" y2="12.5" />
                  <line x1="14.8" y1="12.5" x2="16" y2="12.5" />
                  {/* Keypad Grid (Row 1) */}
                  <rect x="7.8" y="15.2" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  <rect x="10.9" y="15.2" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  <rect x="14" y="15.2" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  {/* Keypad Grid (Row 2) */}
                  <rect x="7.8" y="17.4" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  <rect x="10.9" y="17.4" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  <rect x="14" y="17.4" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  {/* Keypad Grid (Row 3) */}
                  <rect x="7.8" y="19.6" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  <rect x="10.9" y="19.6" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                  <rect x="14" y="19.6" width="2.2" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.8" />
                </svg>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('deviceFeaturePhone', 'Feature Phone')}</h3>
              </button>
            </div>

            {errors.deviceType && (
              <p className="text-error text-center font-label-sm text-label-sm mb-4">{errors.deviceType}</p>
            )}

            {/* Brand Dropdown */}
            <div className="mb-8 max-w-md mx-auto">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 pl-1" htmlFor="brand-select">
                {t('selectBrand', 'Select Brand')}
              </label>
              <div className="relative">
                <select 
                  id="brand-select"
                  value={bookingData.brand}
                  onChange={handleBrandChange}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-3 px-4 text-on-surface font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 [&>option]:bg-surface-container"
                >
                  <option value="" disabled>{t('selectBrandPlaceholder', 'Select a manufacturer...')}</option>
                  {Object.keys(brandModels).map((brandKey) => (
                    <option key={brandKey} value={brandKey}>{brandKey}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  keyboard_arrow_down
                </span>
              </div>
              {errors.brand && (
                <p className="text-error font-label-sm text-label-sm mt-2 pl-1">{errors.brand}</p>
              )}
            </div>

            {/* Direct Model Search Input */}
            <div className="mb-8 max-w-md mx-auto relative" ref={directSearchRef}>
              <label className="block font-label-md text-label-md text-on-surface-variant pl-1 mb-2" htmlFor="direct-model-search-input">
                {t('selectPhoneName', 'Select your phone name')}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  id="direct-model-search-input"
                  type="text"
                  placeholder={t('searchModelDirectPlaceholder', 'Search model directly from database (e.g. S24, Pixel, Nokia 3310)...')}
                  value={directSearchQuery}
                  onFocus={() => setIsDirectDropdownOpen(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDirectSearchQuery(val);
                    setIsDirectDropdownOpen(true);
                    
                    // Accept the typed value immediately as model selection
                    setBookingData({ model: val });
                    setErrors(prev => ({ ...prev, model: null }));
                    
                    // Auto match details if exact case-insensitive match is found in the database
                    const query = val.toLowerCase().trim();
                    if (query) {
                      const exactMatch = allDevicesList.find(d => {
                        const isSameBrand = !bookingData.brand || d.brand.toLowerCase() === bookingData.brand.toLowerCase();
                        return isSameBrand && d.model.toLowerCase() === query;
                      });
                      if (exactMatch) {
                        setBookingData({
                          brand: exactMatch.brand,
                          model: cleanModelName(exactMatch.model),
                          deviceType: exactMatch.deviceType
                        });
                      }
                    }
                  }}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-3 pl-12 pr-12 text-on-surface font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all cursor-text"
                />
                {directSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirectSearchQuery('');
                      setIsDirectDropdownOpen(false);
                      setBookingData({ model: '' });
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary cursor-pointer border-none bg-transparent flex items-center justify-center p-1"
                    title="Clear"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Direct Autocomplete Suggestions */}
              {isDirectDropdownOpen && directSearchQuery.trim() && (
                <div className="absolute z-[100] left-0 right-0 mt-2 bg-[#171f33] border border-outline-variant/60 rounded-lg shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5 animate-fade-in custom-scrollbar">
                  {filteredDirectSuggestions.length > 0 ? (
                    <div className="p-2 space-y-0.5">
                      {filteredDirectSuggestions.map(item => {
                        const cleanedModel = cleanModelName(item.model);
                        return (
                          <button
                            type="button"
                            key={`${item.brand}_${item.model}`}
                            onClick={() => {
                              setBookingData({ 
                                brand: item.brand,
                                model: cleanedModel,
                                deviceType: item.deviceType
                              });
                              setDirectSearchQuery(cleanedModel);
                              setIsDirectDropdownOpen(false);
                              setErrors(prev => ({ ...prev, model: null }));
                            }}
                            className="w-full text-left rounded-md px-3 py-2 hover:bg-white/5 transition-all flex items-center justify-between group/item cursor-pointer text-on-surface hover:text-secondary"
                          >
                            <div className="flex-grow min-w-0">
                              <p className="font-body-md text-body-md truncate font-medium">{cleanedModel}</p>
                              <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider">{item.brand} • {item.category}</p>
                            </div>
                            {bookingData.model === cleanedModel && bookingData.brand === item.brand && (
                              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">check</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant font-body-md">
                      <span className="material-symbols-outlined text-[32px] mb-2 block opacity-40">search_off</span>
                      {t('noMatchingModels', 'No matching models found.')}
                    </div>
                  )}
                </div>
              )}
              {errors.model && (
                <p className="text-error font-label-sm text-label-sm mt-2 pl-1">{errors.model}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6 border-t border-white/5">
              <button 
                onClick={handleNext}
                className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(128,131,255,0.25)]"
              >
                {t('nextStep', 'Next Step')}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Model & Issue Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">{t('selectIssueTitle', "What's the issue?")}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('selectIssueDesc', "Select the primary problem you're experiencing.")}</p>
            </div>

            <div className="space-y-6">
                {/* Image Upload UI */}
                <div className="mt-4">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant pl-1 mb-2">
                    {t('attachImageOptional', 'Attach an image of your device (optional)')}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      id="ai-phone-image"
                    />
                    <label
                      htmlFor="ai-phone-image"
                      className="w-full flex flex-col items-center justify-center gap-2 py-4 px-4 border border-dashed rounded-lg transition-all cursor-pointer border-outline-variant/60 hover:border-secondary hover:bg-white/5 text-on-surface-variant hover:text-secondary overflow-hidden"
                    >
                      {bookingData.deviceImage ? (
                        <>
                          <div className="w-full max-w-[200px] h-32 rounded-md overflow-hidden border border-white/10 mb-2 relative group bg-black/20">
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <span className="material-symbols-outlined text-white text-3xl">edit</span>
                            </div>
                            <img src={bookingData.deviceImage} alt="Device Preview" className="w-full h-full object-contain relative z-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-label-md">{t('clickToChangeImage', 'Click to change image')}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                          <span className="font-label-md">{t('uploadPhoneImage', 'Upload Phone Image')}</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Issue Selection */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant pl-1 mb-2">
                  {t('identifyComponent', 'Identify Component')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-stack-md">
                  {[
                    { id: 'Screen & Display', icon: 'smartphone', apiName: 'screen & display' },
                    { id: 'Battery', icon: 'battery_charging_full', apiName: 'battery' },
                    { id: 'Camera', icon: 'photo_camera', apiName: 'camera' },
                    { id: 'Audio Output', icon: 'volume_up', apiName: 'audio output' },
                    { id: 'Audio Input', icon: 'mic', apiName: 'audio input' },
                    { id: 'Physical Buttons', icon: 'toggle_on', apiName: 'buttons' },
                    { id: 'Charging Port', icon: 'charging-port-custom', apiName: 'charging port' },
                    { id: 'Changing Cover', icon: 'blur_on', apiName: 'changing cover' },
                    { id: 'Unknown Issue', icon: 'help_outline', apiName: 'unknown issue' },
                    { id: 'Other', icon: 'build', apiName: 'other' }
                  ].map((item) => {
                    const isSelected = Array.isArray(bookingData.issue)
                      ? bookingData.issue.includes(item.id)
                      : bookingData.issue === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleIssueSelect(item.id)}
                        className={`relative rounded-lg p-stack-md flex flex-col items-center justify-center gap-stack-sm h-32 border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? 'border-secondary bg-secondary/10 text-secondary ring-1 ring-secondary'
                            : 'border-outline-variant/30 text-on-surface-variant hover:border-secondary hover:text-secondary hover:bg-secondary/5 hover:scale-[1.02]'
                        }`}
                      >
                        {item.id === 'Charging Port' ? (
                          <svg 
                            className="w-8 h-8 transition-colors duration-300" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="1.8"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            {/* USB-C Port Outer Oval */}
                            <rect x="2.5" y="7" width="19" height="10" rx="5" />
                            {/* Center Connector Pin */}
                            <rect x="6.5" y="10.5" width="11" height="3" rx="1.5" fill="currentColor" stroke="none" />
                          </svg>
                        ) : (
                          <span className="material-symbols-outlined text-[32px]">{item.icon}</span>
                        )}
                        <span className="font-label-md text-label-md text-center">{getComponentLabel(item.id)}</span>
                        {item.id === 'Screen & Display' && bookingData.screenDisplayPrice > 0 && (
                          <span className="text-xs md:text-sm font-mono text-secondary font-extrabold bg-secondary/15 px-2 py-0.5 rounded border border-secondary/35 mt-1 shadow-[0_0_8px_rgba(34,211,238,0.2)] whitespace-nowrap" dir="ltr">
                            {bookingData.screenDisplayPrice} {t('currency', 'DA')}
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#22d3ee]"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.issue && (
                  <p className="text-error font-label-sm text-label-sm mt-2 pl-1">{errors.issue}</p>
                )}
              </div>


            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <button 
                onClick={prevStep}
                className="px-6 py-3 rounded-lg border border-secondary/50 text-secondary font-label-md text-label-md hover:bg-secondary/10 hover:border-secondary transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                {t('back', 'Back')}
              </button>
              <button 
                onClick={handleNext}
                className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(128,131,255,0.25)]"
              >
                {t('nextStep', 'Next Step')}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">{t('customerDetailsTitle', 'Customer Details')}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('customerDetailsDesc', 'Please provide your contact information to proceed with the repair booking.')}</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="fullName">{t('fullNameOptional', 'Full Name (Optional)')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                <input 
                  type="text"
                  id="fullName"
                  placeholder={t('fullNamePlaceholder', 'Jane Doe')}
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({ customerName: e.target.value })}
                  className="w-full bg-black/20 border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface font-body-md placeholder-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              {/* Phone Number */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="phone">{t('phoneOptional', 'Phone Number (Optional)')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">phone_iphone</span>
                  <input 
                    type="tel"
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={bookingData.customerPhone}
                    onChange={(e) => setBookingData({ customerPhone: e.target.value })}
                    className="w-full bg-black/20 border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface font-body-md placeholder-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="email">{t('emailOptional', 'Email Address (Optional)')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                  <input 
                    type="email"
                    id="email"
                    placeholder={t('emailPlaceholder', 'jane.doe@example.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/20 border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface font-body-md placeholder-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="notes">
                {t('notesOptional', 'Additional Notes / Instructions (Optional)')}
              </label>
              <textarea 
                id="notes"
                placeholder={t('notesPlaceholder', 'Any specific details regarding drop-off, device history, preferred contact time, etc.')} 
                value={bookingData.notes}
                onChange={(e) => setBookingData({ notes: e.target.value })}
                rows="4"
                className="w-full bg-black/20 border border-outline-variant rounded-lg p-4 text-on-surface font-body-md placeholder-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <button 
                onClick={prevStep}
                className="px-6 py-3 rounded-lg border border-secondary/50 text-secondary font-label-md text-label-md hover:bg-secondary/10 hover:border-secondary transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                {t('back', 'Back')}
              </button>
              <button 
                onClick={handleNext}
                className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(128,131,255,0.25)]"
              >
                {t('nextStep', 'Next Step')}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary & Confirmation */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">{t('bookingSummaryTitle', 'Booking Summary')}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('bookingSummaryDesc', 'Review your repair details before confirming.')}</p>
            </div>

            {/* Summary Details */}
            <div className="space-y-stack-md mb-8">
              {/* Device Row */}
              <div className="flex items-center justify-between p-stack-md rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-stack-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center border border-white/10 shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      {bookingData.deviceType === 'tablet' 
                        ? 'tablet_mac' 
                        : bookingData.deviceType === 'feature-phone' 
                          ? 'dialpad' 
                          : 'smartphone'}
                    </span>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{t('stepDevice', 'Device')}</p>
                    <p className="font-body-md text-body-md text-on-surface">{bookingData.brand} {bookingData.model}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-primary hover:text-secondary transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>

              {/* Issue Row */}
              <div className="flex items-center justify-between p-stack-md rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-stack-md">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-error">
                    {(() => {
                      const issues = Array.isArray(bookingData.issue) ? bookingData.issue : [bookingData.issue];
                      if (issues.includes('Charging Port')) {
                        return (
                          <svg 
                            className="w-5 h-5" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <rect x="2.5" y="7" width="19" height="10" rx="5" />
                            <rect x="6.5" y="10.5" width="11" height="3" rx="1.5" fill="currentColor" stroke="none" />
                          </svg>
                        );
                      }
                      let iconName = 'build';
                      if (issues.includes('Screen & Display')) iconName = 'smartphone';
                      else if (issues.includes('Battery')) iconName = 'battery_charging_full';
                      else if (issues.includes('Camera')) iconName = 'photo_camera';
                      else if (issues.includes('Audio Output')) iconName = 'volume_up';
                      else if (issues.includes('Audio Input')) iconName = 'mic';
                      else if (issues.includes('Physical Buttons')) iconName = 'toggle_on';
                      else if (issues.includes('Changing Cover')) iconName = 'blur_on';
                      else if (issues.includes('Unknown Issue')) iconName = 'help_outline';
                      return <span className="material-symbols-outlined">{iconName}</span>;
                    })()}
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{t('stepIssue', 'Issue')}</p>
                    <p className="font-body-md text-body-md text-on-surface">
                      {Array.isArray(bookingData.issue) ? bookingData.issue.map(getComponentLabel).join(', ') : getComponentLabel(bookingData.issue)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="text-primary hover:text-secondary transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>

              {/* Contact Row */}
              <div className="flex items-center justify-between p-stack-md rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-stack-md">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{t('stepContact', 'Contact')}</p>
                    <p className="font-body-md text-body-md text-on-surface">{bookingData.customerName} {bookingData.customerPhone ? `(${bookingData.customerPhone})` : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(3)}
                  className="text-primary hover:text-secondary transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>

              {/* Image Row */}
              {bookingData.deviceImage && (
                <div className="flex items-center justify-between p-stack-md rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-stack-md">
                    <div className="w-16 h-16 rounded-lg bg-surface-variant flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                      <img src={bookingData.deviceImage} alt="Device" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{t('deviceImageLabel', 'Device Image')}</p>
                      <p className="font-body-md text-body-md text-on-surface">{t('deviceImageAttached', 'Attached')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="text-primary hover:text-secondary transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              )}
            </div>

            {/* Price Estimate Display */}
            <div className="text-center p-stack-md rounded-lg bg-gradient-to-br from-surface-container-high to-surface-container border border-primary/20 mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-2 relative z-10">{t('estimatedRepairCost', 'Estimated Repair Cost')}</p>
              <p className="font-headline-md text-headline-md text-secondary relative z-10 font-bold" dir="ltr">
                {Array.isArray(bookingData.issue) && bookingData.issue.includes('Screen & Display') ? (
                  `${(bookingData.screenDisplayPrice || 0) + (addProtection ? 15 : 0)} ${t('currency', 'DA')}`
                ) : (
                  `${(bookingData.estimatedPrice || 0) + (addProtection ? 15 : 0)} ${t('currency', 'DA')} - ${(bookingData.estimatedPrice || 0) + (addProtection ? 15 : 0) + 20} ${t('currency', 'DA')}`
                )}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 relative z-10">{t('finalPriceNotice', 'Final price confirmed upon physical inspection.')}</p>
            </div>

            {/* Recommendation Cross-Sell Block */}
            {((Array.isArray(bookingData.issue) && bookingData.issue.includes('Screen & Display')) || bookingData.issue === 'Screen & Display') && (
              <div 
                onClick={() => setAddProtection(!addProtection)}
                className={`p-stack-md rounded-lg border flex items-start gap-stack-md transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(93,230,255,0.2)] ${
                  addProtection 
                    ? 'border-secondary bg-secondary/10 text-secondary' 
                    : 'border-secondary/30 bg-secondary/5'
                }`}
              >
                <div className="mt-1 text-secondary group-hover:animate-pulse">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-secondary transition-colors">{t('addProtectionTitle', 'Add Protection')}</h3>
                    <span className="font-label-md text-label-md text-secondary font-bold" dir="ltr">+15 {t('currency', 'DA')}</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-3">{t('addProtectionDesc', 'Unbreakable Screen Protector installed during repair.')}</p>
                  <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={addProtection}
                      onChange={(e) => setAddProtection(e.target.checked)}
                      className="form-checkbox bg-surface-dim border-outline rounded text-primary focus:ring-primary focus:ring-offset-surface-dim w-5 h-5 cursor-pointer"
                    />
                    <span className="font-label-md text-label-md text-on-surface">{t('includeWithRepair', 'Include with repair')}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-stack-md justify-end pt-6 border-t border-white/5">
              <button 
                onClick={prevStep}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg border border-outline text-on-surface hover:bg-white/5 hover:border-white transition-all font-label-md text-label-md cursor-pointer disabled:opacity-50"
              >
                {t('back', 'Back')}
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary px-8 py-3 rounded-lg text-white font-label-md text-label-md flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t('bookingInProgress', 'Booking...')}</span>
                ) : (
                  <>
                    <span>{t('confirmBooking', 'Confirm Booking')}</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Screen Price Custom Modal ── */}
      {showScreenPriceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowScreenPriceModal(false)}
          />
          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-sm bg-surface-container border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-in" style={{ animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">smartphone</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('screenPriceModalTitle', 'Screen Price')}</h3>
            </div>
            
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('screenPriceModalDesc', 'Please enter the repair cost for the screen replacement.')}
            </p>

            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono font-bold text-sm select-none">{t('currency', 'DA')}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t('screenPricePlaceholder', 'e.g. 12000')}
                value={modalScreenPrice}
                onChange={(e) => setModalScreenPrice(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-surface border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-all text-lg font-bold"
                autoFocus
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  handleSaveScreenPrice(0);
                }}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-label-md text-label-md transition-all cursor-pointer"
              >
                {t('skip', 'Skip')}
              </button>
              <button
                onClick={() => {
                  handleSaveScreenPrice(modalScreenPrice);
                }}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-black font-label-md text-label-md font-bold hover:bg-secondary/90 transition-all cursor-pointer shadow-[0_4px_14px_rgba(34,211,238,0.25)]"
              >
                {t('savePrice', 'Save Price')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
