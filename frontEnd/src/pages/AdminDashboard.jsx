import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import AdminSidebar from '../components/AdminSidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminDashboard() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [revenueTimeframe, setRevenueTimeframe] = useState('Today');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [revenueData, setRevenueData] = useState({ totalSales: 0, totalItems: 0 });
  const [revenue30Days, setRevenue30Days] = useState({ weeks: [] });
  const [debtsSummary, setDebtsSummary] = useState({ totalUnpaid: 0, count: 0 });
  const [loadingTopSelling, setLoadingTopSelling] = useState(true);
  const [dashboardDate, setDashboardDate] = useState(new Date().toISOString().split('T')[0]);

  // Loading states

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Format number as DA with commas (no spaces)
  const formatDA = (num) => (num || 0).toLocaleString('en-US') + ' DA';

  // Fetch today's revenue summary
  const fetchRevenue = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/dashboard/revenue?date=${dashboardDate}`);
      if (!res.ok) throw new Error('Failed to fetch revenue');
      const data = await res.json();
      setRevenueData(data);
    } catch (err) {
      console.error('Revenue fetch error:', err.message);
    }
  };

  // Fetch 30 days revenue summary (4 weekly buckets)
  const fetchRevenue30Days = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/dashboard/revenue-30days');
      if (res.ok) {
        const data = await res.json();
        setRevenue30Days(data);
      }
    } catch (err) {
      console.error('30 Days revenue fetch error:', err.message);
    }
  };

  // Fetch debts summary
  const fetchDebtsSummary = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/debts/summary');
      if (res.ok) {
        const data = await res.json();
        setDebtsSummary(data);
      }
    } catch (err) {
      console.error('Debts summary fetch error:', err.message);
    }
  };

  // Fetch today's top selling products from backend
  const fetchTopSelling = async () => {
    setLoadingTopSelling(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/dashboard/top-selling?date=${dashboardDate}`);
      if (!res.ok) throw new Error('Failed to fetch top selling');
      const data = await res.json();
      setTopSelling(data);
    } catch (err) {
      console.error('Top selling fetch error:', err.message);
    } finally {
      setLoadingTopSelling(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchTopSelling(), fetchRevenue(), fetchRevenue30Days(), fetchDebtsSummary()]);
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [dashboardDate]);



  // Build Y-axis scale with clean ticks and generous headroom for price tooltips
  const buildYScale = (maxVal) => {
    let top = 50000;
    if (maxVal > 35000) {
      top = Math.ceil((maxVal * 1.35) / 10000) * 10000;
    }
    const ticks = [
      Math.round(top).toLocaleString('en-US'),
      Math.round(top * 0.66).toLocaleString('en-US'),
      Math.round(top * 0.33).toLocaleString('en-US'),
      '0'
    ];
    return { ticks, top };
  };

  // Dynamic Today bars based on real revenue
  const todaySales = revenueData.totalSales || 0;
  const todayPurchases = revenueData.totalPurchases || 0;
  const todayCanceled = revenueData.totalCanceled || 0;
  const maxTodayVal = Math.max(todaySales, todayPurchases, todayCanceled, 1);
  const { ticks: todayTicks, top: todayTop } = buildYScale(maxTodayVal);
  const salesBarHeight = todayTop > 0 ? `${Math.min(100, Math.max(4, (todaySales / todayTop) * 100))}%` : '4%';
  const purchasesBarHeight = todayTop > 0 ? `${Math.min(100, Math.max(4, (todayPurchases / todayTop) * 100))}%` : '4%';
  const canceledBarHeight = todayTop > 0 ? `${Math.min(100, Math.max(4, (todayCanceled / todayTop) * 100))}%` : '4%';

  // Dynamic 30-day scale and weekly bars calculation
  const weeksList = (revenue30Days.weeks && revenue30Days.weeks.length > 0)
    ? revenue30Days.weeks
    : [
        { label: 'W1', sales: 0, purchases: 0, canceled: 0 },
        { label: 'W2', sales: 0, purchases: 0, canceled: 0 },
        { label: 'W3', sales: 0, purchases: 0, canceled: 0 },
        { label: 'W4', sales: 0, purchases: 0, canceled: 0 }
      ];

  const max30DayVal = Math.max(...weeksList.map((w) => Math.max(w.sales || 0, w.purchases || 0, w.canceled || 0)), 1);
  const { ticks: ticks30Days, top: top30Days } = buildYScale(max30DayVal);

  const bars30Days = weeksList.map((w) => {
    const sPercent = top30Days > 0 ? (w.sales / top30Days) * 100 : 0;
    const pPercent = top30Days > 0 ? (w.purchases / top30Days) * 100 : 0;
    const cPercent = top30Days > 0 ? ((w.canceled || 0) / top30Days) * 100 : 0;
    return {
      label: w.label,
      s: `${Math.min(100, Math.max(0, sPercent))}%`,
      p: `${Math.min(100, Math.max(0, pPercent))}%`,
      c: `${Math.min(100, Math.max(0, cPercent))}%`,
      sVal: formatDA(w.sales),
      pVal: formatDA(w.purchases),
      cVal: formatDA(w.canceled)
    };
  });

  const timeframeData = {
    Today: {
      type: 'today',
      yScale: todayTicks,
      bars: [
        { label: 'Sales', val: formatDA(todaySales), height: salesBarHeight, color: 'secondary' },
        { label: 'Purchases', val: formatDA(todayPurchases), height: purchasesBarHeight, color: 'primary' },
        { label: 'Canceleds', val: formatDA(todayCanceled), height: canceledBarHeight, color: 'yellow' }
      ]
    },
    '30 Days': {
      type: 'standard',
      yScale: ticks30Days,
      bars: bars30Days
    },
    '12 Months': {
      type: 'standard',
      yScale: ['50,000', '33,000', '17,000', '0'],
      bars: [
        { label: 'Jan', s: '40%', p: '20%', c: '5%', sVal: '9,600 DA', pVal: '4,800 DA', cVal: '1,200 DA' },
        { label: 'Feb', s: '60%', p: '30%', c: '8%', sVal: '14,400 DA', pVal: '7,200 DA', cVal: '1,920 DA' },
        { label: 'Mar', s: '80%', p: '45%', c: '12%', sVal: '19,200 DA', pVal: '10,800 DA', cVal: '2,880 DA' },
        { label: 'Apr', s: '50%', p: '25%', c: '7%', sVal: '12,000 DA', pVal: '6,000 DA', cVal: '1,680 DA' },
        { label: 'May', s: '90%', p: '60%', c: '15%', sVal: '21,600 DA', pVal: '14,400 DA', cVal: '3,600 DA' },
        { label: 'Jun', s: '70%', p: '40%', c: '10%', sVal: '16,800 DA', pVal: '9,600 DA', cVal: '2,400 DA' },
        { label: 'Jul', s: '55%', p: '35%', c: '8%', sVal: '13,200 DA', pVal: '8,400 DA', cVal: '1,920 DA' },
        { label: 'Aug', s: '85%', p: '50%', c: '13%', sVal: '20,400 DA', pVal: '12,000 DA', cVal: '3,120 DA' },
        { label: 'Sep', s: '45%', p: '20%', c: '5%', sVal: '10,800 DA', pVal: '4,800 DA', cVal: '1,200 DA' },
        { label: 'Oct', s: '75%', p: '30%', c: '9%', sVal: '18,000 DA', pVal: '7,200 DA', cVal: '2,160 DA' },
        { label: 'Nov', s: '95%', p: '65%', c: '14%', sVal: '22,800 DA', pVal: '15,600 DA', cVal: '3,360 DA' },
        { label: 'Dec', s: '60%', p: '40%', c: '10%', sVal: '14,400 DA', pVal: '9,600 DA', cVal: '2,400 DA' }
      ]
    }
  };

  const activeGraph = timeframeData[revenueTimeframe] || timeframeData.Today;

  const { t, lang } = useLanguageStore();

  const getTimeframeLabel = (tf) => {
    switch (tf) {
      case 'Today': return t('today', 'Today');
      case '30 Days': return t('thirtyDays', '30 Days');
      case '12 Months': return t('twelveMonths', '12 Months');
      default: return tf;
    }
  };

  const getMetricLabel = (label) => {
    switch (label) {
      case 'Sales': return t('sales', 'Sales');
      case 'Purchases': return t('purchases', 'Purchases');
      case 'Canceleds': return t('canceleds', 'Canceleds');
      default: return label;
    }
  };

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
              <input className="bg-transparent border-none outline-none ml-3 w-full text-on-surface text-label-md placeholder:text-outline-variant" placeholder={t('search', 'Search...')} type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 ml-auto">
            <LanguageSwitcher compact />
            <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full shadow-[0_0_8px_rgba(255,81,106,0.5)] animate-pulse"></span>
            </button>
            <div className="flex items-center gap-4 pl-4 lg:pl-6 border-l border-outline-variant/20">
              <div className="text-right hidden sm:block">
                <p className="text-label-md font-bold text-on-surface">{t('adminAppName', 'Admin')}</p>
                <p className="text-label-sm text-outline">Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(192,193,255,0.3)] border-2 border-primary/20">
                <span className="material-symbols-outlined text-on-primary text-[24px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 space-y-8 animate-[fadeInUp_0.5s_ease-out]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
            <div>
              <h1 className="font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface tracking-tight">
                {lang === 'ar' ? 'نظرة عامة على لوحة التحكم' : 'Dashboard Overview'}
              </h1>
            </div>
            <div className="relative flex items-center bg-surface-container/60 border border-white/10 rounded-xl px-4 py-2 focus-within:border-primary/50 group shadow-inner self-start">
              <span className="material-symbols-outlined text-primary text-[18px] mr-2">calendar_today</span>
              <input
                type="date"
                className="bg-transparent border-none outline-none text-on-surface font-semibold text-sm custom-date-picker cursor-pointer"
                value={dashboardDate}
                onChange={(e) => setDashboardDate(e.target.value)}
              />
            </div>
          </div>

          {/* Metrics Row (No Purchases Returns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric Card 1: Total Sales */}
            <div className="relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-all duration-300 group overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-[0_0_15px_rgba(93,230,255,0.2)]">
                  <span className="material-symbols-outlined text-secondary text-[24px]">payments</span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-full border border-white/5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">trending_up</span>
                  <span className="font-label-sm text-label-sm text-tertiary">+12.5%</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">{t('totalSales', 'Total Sales')}</p>
              <h3 className="font-headline-md text-headline-md text-on-surface relative z-10">{formatDA(todaySales)}</h3>
            </div>

            {/* Metric Card 2: Total Purchases */}
            <div className="relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-all duration-300 group overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(192,193,255,0.2)]">
                  <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-full border border-white/5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">trending_up</span>
                  <span className="font-label-sm text-label-sm text-tertiary">+8.2%</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">{t('totalPurchases', 'Total Purchases')}</p>
              <h3 className="font-headline-md text-headline-md text-on-surface relative z-10">{formatDA(todayPurchases)}</h3>
            </div>

            {/* Metric Card 3: Total Canceleds */}
            <div className="relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-amber-400/30 transition-all duration-300 group overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <span className="material-symbols-outlined text-amber-400 text-[24px]">cancel</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">{t('totalCanceleds', 'Total Canceleds')}</p>
              <h3 className="font-headline-md text-headline-md text-amber-400 font-mono relative z-10">{formatDA(todayCanceled)}</h3>
            </div>

            {/* Metric Card 4: Total Unpaid Debts */}
            <div className="relative bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-red-400/30 transition-all duration-300 group overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <span className="material-symbols-outlined text-red-400 text-[24px]">credit_card_off</span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full border border-white/5">
                  <span className="font-label-sm text-xs text-red-400 font-bold">{debtsSummary.count} {t('unpaid', 'Unpaid')}</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">{t('totalUnpaidDebts', 'Total Unpaid Debts')}</p>
              <h3 className="font-headline-md text-headline-md text-red-400 font-mono relative z-10">{formatDA(debtsSummary.totalUnpaid)}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Overview Chart */}
            <div className="bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 h-[420px] flex flex-col">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('revenueOverview', 'Revenue Overview')}</h2>
                <div className="flex gap-1.5 bg-surface-container-high p-1 rounded-lg border border-white/5">
                  {['Today', '30 Days', '12 Months'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setRevenueTimeframe(tf)}
                      className={`px-3 py-1 rounded-md font-label-md text-xs transition-colors border-none cursor-pointer ${
                        revenueTimeframe === tf
                          ? 'bg-primary/20 text-primary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container bg-transparent'
                      }`}
                    >
                      {getTimeframeLabel(tf)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full h-full flex pt-6 pb-6 min-h-0">
                {/* Dedicated Y-Axis Labels Column on the left */}
                <div className="flex flex-col justify-between h-full pr-3.5 pb-6 border-r border-white/5 text-right font-mono text-xs sm:text-sm font-bold text-on-surface-variant select-none shrink-0 z-20">
                  {activeGraph.yScale.map((val, idx) => (
                    <span key={idx} className="leading-none transform -translate-y-1">
                      {val}
                    </span>
                  ))}
                </div>

                {/* Graph Container with Bars & Horizontal Grid Lines */}
                <div className="flex-1 relative h-full flex items-end pl-4 pr-2 pb-6" style={{ overflowX: 'auto', overflowY: 'visible' }}>
                  {/* Horizontal Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                    {activeGraph.yScale.map((_, idx) => (
                      <div key={idx} className="w-full border-b border-white/5 h-0" />
                    ))}
                  </div>

                  {/* Graph Content */}
                  {activeGraph.type === 'today' ? (
                    /* Today View - labels pinned below x-axis */
                    <div className="w-full flex flex-col" style={{ height: '100%', overflow: 'visible' }}>
                      {/* Bars area */}
                      <div className="flex-1 flex items-end justify-center gap-12 sm:gap-20 px-6" style={{ overflow: 'visible' }}>
                        {activeGraph.bars.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative flex items-end justify-center cursor-pointer"
                            style={{ height: '100%', overflow: 'visible' }}
                            onMouseEnter={() => setHoveredBar(`today-${idx}`)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* Bar */}
                            <div
                              className={`w-12 rounded-t-lg transition-all duration-300 ${
                                item.color === 'secondary'
                                  ? 'bg-secondary shadow-[0_0_20px_rgba(93,230,255,0.5)]'
                                  : item.color === 'yellow'
                                  ? 'bg-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                                  : 'bg-primary shadow-[0_0_20px_rgba(192,193,255,0.5)]'
                              } ${hoveredBar === `today-${idx}` ? 'brightness-125' : ''}`}
                              style={{ height: item.height }}
                            />
                            {/* Tooltip above bar - only when hovered */}
                            {hoveredBar === `today-${idx}` && (
                              <div
                                style={{ bottom: 'calc(' + item.height + ' + 10px)', position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                                className="bg-[#1a2540] border border-white/30 px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap text-xs font-mono font-bold text-white"
                              >
                                {item.val}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* X-axis labels row - below bars */}
                      <div className="flex justify-center gap-6 sm:gap-14 px-6 pt-2">
                        {activeGraph.bars.map((item, idx) => (
                          <span key={idx} className="w-12 text-center text-xs text-on-surface-variant font-medium">
                            {getMetricLabel(item.label)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 30 Days / 12 Months view */
                    <div className="w-full h-full flex items-end justify-between z-10" style={{ overflow: 'visible' }}>
                      {activeGraph.bars.map((data, idx) => (
                        <div key={idx} className="flex gap-1 h-full items-end relative min-w-[32px] mx-1 sm:mx-2" style={{ overflow: 'visible' }}>
                          {/* Sales Bar */}
                          <div
                            className="relative flex flex-col items-center justify-end cursor-pointer"
                            style={{ height: '100%', overflow: 'visible' }}
                            onMouseEnter={() => setHoveredBar(`s-${idx}`)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {hoveredBar === `s-${idx}` && (
                              <div
                                style={{ bottom: 'calc(' + data.s + ' + 6px)', position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                                className="bg-[#1a2540] border border-secondary/60 px-2 py-1 rounded text-[11px] font-mono font-bold text-secondary whitespace-nowrap shadow-2xl"
                              >
                                {data.sVal}
                              </div>
                            )}
                            <div
                              className={`w-2 sm:w-2.5 bg-secondary rounded-t-sm shadow-[0_0_10px_rgba(93,230,255,0.3)] transition-all ${ hoveredBar === `s-${idx}` ? 'brightness-125' : 'opacity-80'}`}
                              style={{ height: data.s }}
                            />
                          </div>

                          {/* Purchases Bar */}
                          <div
                            className="relative flex flex-col items-center justify-end cursor-pointer"
                            style={{ height: '100%', overflow: 'visible' }}
                            onMouseEnter={() => setHoveredBar(`p-${idx}`)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {hoveredBar === `p-${idx}` && (
                              <div
                                style={{ bottom: 'calc(' + data.p + ' + 6px)', position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                                className="bg-[#1a2540] border border-primary/60 px-2 py-1 rounded text-[11px] font-mono font-bold text-primary whitespace-nowrap shadow-2xl"
                              >
                                {data.pVal}
                              </div>
                            )}
                            <div
                              className={`w-2 sm:w-2.5 bg-primary rounded-t-sm shadow-[0_0_10px_rgba(192,193,255,0.3)] transition-all ${ hoveredBar === `p-${idx}` ? 'brightness-125' : 'opacity-80'}`}
                              style={{ height: data.p }}
                            />
                          </div>

                          {/* Canceleds Bar */}
                          {data.c && (
                            <div
                              className="relative flex flex-col items-center justify-end cursor-pointer"
                              style={{ height: '100%', overflow: 'visible' }}
                              onMouseEnter={() => setHoveredBar(`c-${idx}`)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              {hoveredBar === `c-${idx}` && (
                                <div
                                  style={{ bottom: 'calc(' + data.c + ' + 6px)', position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                                  className="bg-[#1a2540] border border-amber-500/60 px-2 py-1 rounded text-[11px] font-mono font-bold text-amber-400 whitespace-nowrap shadow-2xl"
                                >
                                  {data.cVal}
                                </div>
                              )}
                              <div
                                className={`w-2 sm:w-2.5 bg-amber-500 rounded-t-sm shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-all ${ hoveredBar === `c-${idx}` ? 'brightness-125' : 'opacity-80'}`}
                                style={{ height: data.c }}
                              />
                            </div>
                          )}

                          {data.label && (
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-on-surface-variant font-medium">
                              {data.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-6 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(93,230,255,0.5)]"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{t('sales', 'Sales')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(192,193,255,0.5)]"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{t('purchases', 'Purchases')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{t('canceleds', 'Canceleds')}</span>
                </div>
              </div>
            </div>

            {/* Top Selling Products Table */}
            <div className="bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('topSellingProducts', 'Top Selling Products')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTopSelling}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-on-surface-variant bg-transparent cursor-pointer"
                    title="Refresh"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-label-md text-on-surface-variant text-xs">
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
                    {t('today', 'Today')}
                  </span>
                </div>
              </div>
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="border-b border-white/5 text-on-surface-variant font-label-md text-label-md">
                      <th className="pb-4 font-normal">#</th>
                      <th className="pb-4 font-normal">{t('productName', 'Product Name')}</th>
                      <th className="pb-4 font-normal">{t('qtySold', 'Qty Sold')}</th>
                      <th className="pb-4 font-normal">{t('totalRevenue', 'Total Revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-sm text-on-surface divide-y divide-white/5">
                    {loadingTopSelling ? (
                      // Loading skeleton rows
                      [1, 2, 3].map((i) => (
                        <tr key={i}>
                          <td className="py-4"><div className="w-5 h-4 bg-white/5 rounded animate-pulse" /></td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse shrink-0" />
                              <div className="w-32 h-4 bg-white/5 rounded animate-pulse" />
                            </div>
                          </td>
                          <td className="py-4"><div className="w-8 h-4 bg-white/5 rounded animate-pulse" /></td>
                          <td className="py-4"><div className="w-24 h-4 bg-white/5 rounded animate-pulse" /></td>
                        </tr>
                      ))
                    ) : topSelling.length === 0 ? (
                      // Empty state
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[40px] opacity-30">receipt_long</span>
                            <p className="text-sm">{t('noSalesToday', 'No sales recorded today')}</p>
                            <p className="text-xs opacity-60">Mark products as sold in the Shop page to see them here</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Real data rows
                      topSelling.map((item, idx) => {
                        const iconMap = {
                          phone: 'smartphone', 'feature-phone': 'phone_android', tablet: 'tablet_mac',
                          headphones: 'headphones', watch: 'watch', charger: 'charger', cable: 'cable',
                          'screen-protector': 'screen_lock_portrait', case: 'phonelink_ring',
                          cover: 'phonelink_ring', accessories: 'devices_other'
                        };
                        const icon = iconMap[item.category] || 'inventory_2';
                        return (
                          <tr key={item._id} className="group hover:bg-white/5 transition-colors">
                            {/* Rank */}
                            <td className="py-4 text-on-surface-variant/50 text-xs font-mono">{idx + 1}</td>

                            {/* Product — static view */}
                            <td className="py-4">
                              <div className="flex items-center gap-4 text-left w-full">
                                <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.productImage ? (
                                    <img
                                      src={item.productImage}
                                      alt={item.productName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <span
                                    className="material-symbols-outlined text-outline text-[20px]"
                                    style={{ display: item.productImage ? 'none' : 'block' }}
                                  >{icon}</span>
                                </div>
                                <div>
                                  <p className="font-body-md text-body-md text-on-surface truncate w-28 sm:w-44">{item.productName}</p>
                                  <p className="text-xs text-on-surface-variant/60 capitalize mt-0.5">{item.category}</p>
                                </div>
                              </div>
                            </td>

                            {/* Qty sold */}
                            <td className="py-4 font-body-md text-body-md text-on-surface-variant">
                              ×{item.quantitySold}
                            </td>

                            {/* Total Revenue */}
                            <td className="py-4 font-mono font-bold text-secondary text-sm">
                              {formatDA(item.totalRevenue)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
