import React from 'react';
import { useApp } from '../context/AppContext';

const getWeatherDetails = (code, isDay) => {
  const details = {
    0: { text: 'Despejado', icon: isDay ? 'wb_sunny' : 'nightlight' },
    1: { text: 'Mayormente Despejado', icon: isDay ? 'wb_sunny' : 'nightlight' },
    2: { text: 'Parcialmente Nublado', icon: isDay ? 'partly_cloudy_day' : 'partly_cloudy_night' },
    3: { text: 'Nublado', icon: 'cloud' },
    45: { text: 'Neblina', icon: 'foggy' },
    48: { text: 'Niebla de Escarcha', icon: 'foggy' },
    51: { text: 'Llovizna Ligera', icon: 'grain' },
    53: { text: 'Llovizna Moderada', icon: 'grain' },
    55: { text: 'Llovizna Densa', icon: 'grain' },
    56: { text: 'Llovizna Helada Ligera', icon: 'ac_unit' },
    57: { text: 'Llovizna Helada Densa', icon: 'ac_unit' },
    61: { text: 'Lluvia Débil', icon: 'rainy' },
    63: { text: 'Lluvia Moderada', icon: 'rainy' },
    65: { text: 'Lluvia Fuerte', icon: 'rainy_heavy' },
    66: { text: 'Lluvia Helada Ligera', icon: 'ac_unit' },
    67: { text: 'Lluvia Helada Fuerte', icon: 'ac_unit' },
    71: { text: 'Nieve Ligera', icon: 'snowing' },
    73: { text: 'Nieve Moderada', icon: 'snowing' },
    75: { text: 'Nieve Fuerte', icon: 'snowing' },
    77: { text: 'Granizo de Nieve', icon: 'ac_unit' },
    80: { text: 'Chubascos Ligeros', icon: 'rainy' },
    81: { text: 'Chubascos Moderados', icon: 'rainy' },
    82: { text: 'Chubascos Violentos', icon: 'rainy_heavy' },
    85: { text: 'Chubascos de Nieve Ligeros', icon: 'snowing' },
    86: { text: 'Chubascos de Nieve Fuertes', icon: 'snowing' },
    95: { text: 'Tormenta Eléctrica', icon: 'thunderstorm' },
    96: { text: 'Tormenta con Granizo Ligero', icon: 'thunderstorm' },
    99: { text: 'Tormenta con Granizo Fuerte', icon: 'thunderstorm' }
  };
  return details[code] || { text: 'Desconocido', icon: 'wb_cloudy' };
};

export default function Dashboard() {
  const { 
    substates, 
    setSubstate, 
    tickets, 
    sales,
    onDutyTeam, 
    urgentTasks, 
    setPage,
    products,
    currentUser,
    shopInfo
  } = useApp();

  const [time, setTime] = React.useState(new Date());
  const [weather, setWeather] = React.useState({ loading: true, data: null, error: null });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const location = shopInfo?.weatherLocation || 'Lima, PE';
    
    const fetchWeather = async () => {
      setWeather(prev => ({ ...prev, loading: true, error: null }));
      try {
        const query = encodeURIComponent(location.trim());
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1`;
        
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error('Error en geocodificación');
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('Ubicación no encontrada');
        }
        
        const { latitude, longitude, name, country_code } = geoData.results[0];
        const resolvedLocation = `${name}, ${country_code}`;
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error('Error en obtención del clima');
        const weatherData = await weatherRes.json();
        
        if (isMounted) {
          const current = weatherData.current;
          const details = getWeatherDetails(current.weather_code, current.is_day === 1);
          
          setWeather({
            loading: false,
            error: null,
            data: {
              temp: current.temperature_2m,
              humidity: current.relative_humidity_2m,
              code: current.weather_code,
              text: details.text,
              icon: details.icon,
              isDay: current.is_day === 1,
              resolvedLocation
            }
          });
        }
      } catch (err) {
        console.warn('Weather API failed, using fallback:', err);
        if (isMounted) {
          const details = getWeatherDetails(2, true); // default partly cloudy day
          setWeather({
            loading: false,
            error: err.message,
            data: {
              temp: 18.5,
              humidity: 75,
              code: 2,
              text: `${details.text} (Offline)`,
              icon: details.icon,
              isDay: true,
              resolvedLocation: location
            }
          });
        }
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [shopInfo?.weatherLocation]);

  const currentSubstate = substates.dashboard;
  const isEmpty = currentSubstate === 'empty';

  // Out of Stock and Low Stock products
  const outOfStockProducts = products ? products.filter(p => p.stock === 0) : [];
  const lowStockProducts = products ? products.filter(p => p.stock > 0 && p.stock <= 15) : [];
  
  // Abandoned service tickets (> 90 days registered and status != Completed)
  const parseTicketDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('2024') || dateStr.includes('2025')) return new Date(2024, 0, 1);
    const months = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
      jan: 0, apr: 3, aug: 7, dec: 11
    };
    let clean = dateStr.replace(/de /g, '').split(',')[0].toLowerCase().trim();
    let parts = clean.split(/\s+/);
    if (parts.length >= 3) {
      let day = parseInt(parts[0], 10);
      let mStr = parts[1].substring(0, 3);
      let yr = parseInt(parts[2], 10);
      if (isNaN(day)) {
        mStr = parts[0].substring(0, 3);
        day = parseInt(parts[1], 10);
        yr = parseInt(parts[2], 10);
      }
      return new Date(yr, months[mStr] !== undefined ? months[mStr] : 5, day);
    }
    return new Date();
  };

  const abandonedTickets = tickets ? tickets.filter(t => {
    if (t.status === 'Completed') return false;
    const ticketDate = parseTicketDate(t.date);
    const currentDate = new Date(2026, 5, 23); // June 23, 2026
    const diffTime = currentDate - ticketDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  }) : [];

  // Real sales from db can be accumulated
  const realSalesTotal = sales ? sales.reduce((sum, s) => sum + (s.total || 0), 0) : 0;
  
  // Baseline values + live sales added to the current month (Jun)
  const revenueData = [4500, 5200, 4800, 6100, 5900, 7200 + realSalesTotal];
  
  // Find min and max for scaling
  const maxVal = Math.max(...revenueData);
  const minVal = Math.min(...revenueData);
  const range = maxVal - minVal || 1;
  
  // SVG size: Width 500, Height 200
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 50;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  
  // Generate points
  const points = revenueData.map((val, idx) => {
    const x = paddingX + (idx / (revenueData.length - 1)) * chartWidth;
    const y = svgHeight - paddingY - ((val - minVal) / range) * chartHeight;
    return { x, y, val, month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][idx] };
  });
  
  // Path for the line
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Path for the filled area (connect back to the baseline)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Donut chart calculations
  const pendingCount = tickets.filter(t => t.status === 'Pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const completedCount = tickets.filter(t => t.status === 'Completed').length;
  const totalTickets = pendingCount + inProgressCount + completedCount || 1;
  
  const pctPending = (pendingCount / totalTickets) * 100;
  const pctInProgress = (inProgressCount / totalTickets) * 100;
  const pctCompleted = (completedCount / totalTickets) * 100;
  
  const circumference = 2 * Math.PI * 50; // ~314.16
  
  const dashCompleted = (pctCompleted / 100) * circumference;
  const dashInProgress = (pctInProgress / 100) * circumference;
  const dashPending = (pctPending / 100) * circumference;
  
  const offsetCompleted = 0;
  const offsetInProgress = -dashCompleted;
  const offsetPending = -(dashCompleted + dashInProgress);

  // Calculate sales commissions (2% for cashiers on POS sales, 10% for techs on completed tickets)
  const getEmployeeCommissions = () => {
    const list = [
      { name: 'Hamilton Cortez', role: 'cajero', rate: '2% POS', type: 'sales' },
      { name: 'Deanna Annis', role: 'tecnico', rate: '10% Soporte', type: 'support' },
      { name: 'Andrea Willis', role: 'tecnico', rate: '10% Soporte', type: 'support' }
    ];
    return list.map(emp => {
      let volume = 0;
      let commission = 0;
      if (emp.type === 'sales') {
        const empSales = sales ? sales.filter(s => s.cashierName === emp.name || s.cashierId?.toLowerCase().includes(emp.role)) : [];
        volume = empSales.reduce((sum, s) => sum + (s.total || 0), 0);
        commission = volume * 0.02;
      } else if (emp.type === 'support') {
        const empTickets = tickets ? tickets.filter(t => t.status === 'Completed' && (t.assignedTech === emp.name || t.assignedTech?.name === emp.name)) : [];
        volume = empTickets.reduce((sum, t) => sum + (t.price || 0), 0);
        commission = volume * 0.10;
      }
      return { ...emp, volume, commission };
    });
  };

  if (currentSubstate === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
        <div className="bg-error-container text-on-error-container p-8 rounded-2xl max-w-md w-full shadow-lg border border-error/20 text-center space-y-6">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-sans">Error al Cargar el Dashboard</h2>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              No se pudo conectar con el servidor de base de datos de HITECH. Por favor, verifica la conexión e intenta de nuevo.
            </p>
          </div>
          <button
            onClick={() => setSubstate('dashboard', 'moderno')}
            className="w-full bg-error text-on-error py-3 rounded-xl font-semibold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-md">refresh</span>
            <span>Reintentar Conexión</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* State Switcher (for demo presentation purposes) */}
      <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
        <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Demo States:</span>
        <button
          onClick={() => setSubstate('dashboard', 'moderno')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            currentSubstate === 'moderno' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Moderno (Con Datos)
        </button>
        <button
          onClick={() => setSubstate('dashboard', 'empty')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            currentSubstate === 'empty' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Estado Vacío
        </button>
        <button
          onClick={() => setSubstate('dashboard', 'error')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            currentSubstate === 'error' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Error de Carga
        </button>
      </div>

      {/* Banner de Bienvenida, Hora y Clima */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-r from-primary-container/20 via-surface-container-lowest to-secondary-container/10 p-6 rounded-[24px] border border-outline-variant/20 shadow-sm items-center text-left">
        {/* Saludo */}
        <div className="lg:col-span-7 space-y-2">
          <h2 className="text-[28px] font-black text-on-surface tracking-tight">
            ¡Hola, {currentUser?.name?.split(' ')[0] || 'Usuario'}! 👋
          </h2>
          <p className="text-[14px] text-on-surface-variant font-medium leading-relaxed max-w-xl">
            Bienvenido al panel de control de <span className="font-bold text-primary">{shopInfo?.name || 'SISTECH'}</span>. Aquí tienes el resumen operacional y financiero en tiempo real.
          </p>
        </div>

        {/* Reloj y Clima */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reloj Digital */}
          <div className="bg-surface-container-lowest/70 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/20 shadow-inner flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-primary text-[28px] mb-1">schedule</span>
            <p className="text-[24px] font-black text-on-surface font-mono tracking-wider leading-none">
              {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </p>
            <p className="text-[11px] text-on-surface-variant font-semibold mt-1.5 uppercase tracking-wide">
              {time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>

          {/* Widget de Clima */}
          <div className="bg-surface-container-lowest/70 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/20 shadow-inner flex flex-col justify-center items-center text-center">
            {weather.loading ? (
              <div className="flex flex-col items-center justify-center py-2">
                <span className="material-symbols-outlined text-primary text-[28px] animate-spin mb-1">sync</span>
                <p className="text-[11px] text-on-surface-variant font-semibold">Cargando clima...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[28px]">{weather.data.icon}</span>
                  <span className="text-[24px] font-black text-on-surface leading-none">{Math.round(weather.data.temp)}°C</span>
                </div>
                <p className="text-[11px] text-on-surface-variant font-black mt-1 capitalize truncate max-w-full">
                  {weather.data.text}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-on-surface-variant font-semibold">
                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                  <span className="truncate max-w-[120px]">{weather.data.resolvedLocation}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Main Modules */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Next Appointment Card */}
            <div className="md:col-span-1 bg-gradient-to-br from-primary to-secondary p-card-padding rounded-[16px] shadow-sm text-on-primary flex flex-col relative overflow-hidden h-full min-h-[340px]">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[18px] font-bold">Próxima Cita</span>
                <div className={`w-2 h-2 rounded-full bg-white ${!isEmpty ? 'animate-pulse' : 'opacity-40'}`}></div>
              </div>

              {isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-2xl text-white">calendar_today</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">Sin citas agendadas</p>
                    <p className="text-[12px] opacity-75 max-w-[180px] mx-auto">Tu agenda para las próximas 24 horas está libre.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">location_on</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold">319 Haul Road</p>
                        <p className="text-[12px] opacity-80">Glenrock, WY 12345</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-left">
                      <div>
                        <p className="text-[12px] opacity-70">Fecha y Hora</p>
                        <p className="text-[14px] font-semibold">24 Nov 2026, 17:00</p>
                      </div>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[12px] opacity-70">Tipo de Sistema</p>
                          <p className="text-[14px] font-semibold">Central HVAC</p>
                        </div>
                        <div>
                          <p className="text-[12px] opacity-70">Técnicos</p>
                          <p className="text-[14px] font-semibold">02 Asignados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-end">
                    <div className="text-left">
                      <p className="text-[12px] opacity-70">Precio Est.</p>
                      <p className="text-[20px] font-bold">$5,750</p>
                    </div>
                    <button 
                      onClick={() => setPage('service_registry')}
                      className="bg-white text-primary px-5 py-2 rounded-full text-[13px] font-bold hover:bg-on-primary-container transition-colors shadow-lg active:scale-95 cursor-pointer"
                    >
                      Detalle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Tickets List */}
            <div className="md:col-span-2 bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm flex flex-col border border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[18px] font-bold text-on-surface">Órdenes de Servicio Recientes</h2>
                <button onClick={() => setPage('service_registry')} className="text-secondary text-[14px] font-semibold hover:underline">Ver Todas</button>
              </div>

              {isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-outline-variant/60">receipt_long</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-on-surface-variant">No se encontraron órdenes</p>
                    <p className="text-[12px] text-outline max-w-xs mx-auto">No hay órdenes de servicio activas en este momento.</p>
                  </div>
                  <button
                    onClick={() => {
                      setPage('service_registry');
                      setSubstate('service_registry', 'seleccion');
                    }}
                    className="border-2 border-primary text-primary px-5 py-2 rounded-xl text-[13px] font-semibold hover:bg-primary/5 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Crear Primera Órden</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-outline-variant/30 text-left">
                  {tickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      onClick={() => setPage('service_registry')}
                      className="py-4 flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                          <img className="w-full h-full object-cover" alt={ticket.address} src={ticket.image} />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-on-surface group-hover:text-primary transition-colors">{ticket.address}</p>
                          <p className="text-[12px] text-on-surface-variant">{ticket.city} • {ticket.systemType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-on-surface">${ticket.price}</p>
                        <p className="text-[11px] text-on-surface-variant">{ticket.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analytical SVG Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
            {/* Line/Area Chart: Monthly Revenue */}
            <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-[16px] border border-outline-variant/10 shadow-sm flex flex-col text-left">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface">Historial de Ingresos</h3>
                  <p className="text-[12px] text-on-surface-variant">Desempeño mensual de ventas (Últimos 6 meses)</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                    Actualizado
                  </span>
                </div>
              </div>
              
              {currentUser?.role === 'admin' ? (
                <div className="relative w-full h-[200px] flex items-center justify-center">
                  {isEmpty ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 z-10 bg-white/70">
                      <span className="material-symbols-outlined text-outline-variant text-[32px]">show_chart</span>
                      <p className="text-[13px] text-on-surface-variant font-semibold">Sin datos financieros</p>
                    </div>
                  ) : null}
                  
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    <line x1="50" y1="30" x2="450" y2="30" stroke="var(--color-outline-variant)" strokeOpacity="0.15" strokeDasharray="3" />
                    <line x1="50" y1="85" x2="450" y2="85" stroke="var(--color-outline-variant)" strokeOpacity="0.15" strokeDasharray="3" />
                    <line x1="50" y1="140" x2="450" y2="140" stroke="var(--color-outline-variant)" strokeOpacity="0.15" strokeDasharray="3" />
                    <line x1="50" y1="170" x2="450" y2="170" stroke="var(--color-outline-variant)" strokeOpacity="0.3" />
                    
                    {/* Area Under Curve */}
                    {!isEmpty && areaPath && (
                      <path d={areaPath} fill="url(#chartGrad)" />
                    )}
                    
                    {/* Line Chart */}
                    {!isEmpty && linePath && (
                      <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    
                    {/* Data Points */}
                    {!isEmpty && points.map((p, idx) => (
                      <g key={idx} className="group/node cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="var(--color-primary)" stroke="#ffffff" strokeWidth="2" className="transition-all duration-200 hover:r-7" />
                        <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-on-surface opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none bg-slate-900">
                          ${p.val.toLocaleString()}
                        </text>
                      </g>
                    ))}

                    {/* X Axis Labels */}
                    {points.map((p, idx) => (
                      <text key={idx} x={p.x} y="192" textAnchor="middle" className="text-[10px] font-semibold fill-on-surface-variant">
                        {p.month}
                      </text>
                    ))}
                    
                    {/* Y Axis Labels */}
                    <text x="40" y="34" textAnchor="end" className="text-[9px] font-bold fill-on-surface-variant">${Math.round(maxVal).toLocaleString()}</text>
                    <text x="40" y="103" textAnchor="end" className="text-[9px] font-bold fill-on-surface-variant">${Math.round((maxVal + minVal) / 2).toLocaleString()}</text>
                    <text x="40" y="174" textAnchor="end" className="text-[9px] font-bold fill-on-surface-variant">${Math.round(minVal).toLocaleString()}</text>
                  </svg>
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-primary text-4xl mb-2">lock</span>
                  <h4 className="font-bold text-on-surface text-[14px]">Métricas Financieras Restringidas</h4>
                  <p className="text-[11px] text-on-surface-variant max-w-xs mt-1">
                    El gráfico de facturación mensual e ingresos históricos solo está disponible para Administradores.
                  </p>
                </div>
              )}
            </div>

            {/* Donut Chart: Service Tickets Status Breakdown */}
            <div className="md:col-span-1 bg-surface-container-lowest p-6 rounded-[16px] border border-outline-variant/10 shadow-sm flex flex-col text-left justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-on-surface">Estado de Órdenes</h3>
                <p className="text-[12px] text-on-surface-variant">Distribución de tickets activos</p>
              </div>
              
              <div className="relative flex items-center justify-center my-4 h-[120px]">
                <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                  {/* Background Track */}
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--color-outline-variant)" strokeWidth="10" strokeOpacity="0.1" />
                  
                  {/* Completed Sector (Emerald/Green) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${dashCompleted} ${circumference}`}
                    strokeDashoffset={offsetCompleted}
                    strokeLinecap="round"
                  />
                  
                  {/* In Progress Sector (Primary/Blue) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="var(--color-primary)"
                    strokeWidth="10"
                    strokeDasharray={`${dashInProgress} ${circumference}`}
                    strokeDashoffset={offsetInProgress}
                    strokeLinecap="round"
                  />
                  
                  {/* Pending Sector (Amber/Yellow) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${dashPending} ${circumference}`}
                    strokeDashoffset={offsetPending}
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Central Labels */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[20px] font-black text-on-surface leading-none">
                    {isEmpty ? 0 : tickets.length}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-medium mt-1">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold mt-2 pt-2 border-t border-outline-variant/10">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block"></span>
                    <span className="text-on-surface text-[9px] truncate max-w-[40px]">Hecho</span>
                  </div>
                  <span className="text-on-surface-variant font-semibold mt-0.5">{isEmpty ? 0 : completedCount}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                    <span className="text-on-surface text-[9px] truncate max-w-[40px]">Proceso</span>
                  </div>
                  <span className="text-on-surface-variant font-semibold mt-0.5">{isEmpty ? 0 : inProgressCount}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block"></span>
                    <span className="text-on-surface text-[9px] truncate max-w-[40px]">Pend.</span>
                  </div>
                  <span className="text-on-surface-variant font-semibold mt-0.5">{isEmpty ? 0 : pendingCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metrics Cards */}
            <div className="flex flex-col gap-6">
              <div className="bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow border border-outline-variant/10">
                <div className="text-left">
                  <p className="text-on-surface-variant text-[13px] font-semibold mb-2">Total de Reparaciones</p>
                  <p className="text-[32px] font-bold text-primary leading-tight">{isEmpty ? 0 : '1,248'}</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[26px]">build</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow border border-outline-variant/10">
                <div className="text-left">
                  <p className="text-on-surface-variant text-[13px] font-semibold mb-2">Órdenes Pendientes</p>
                  <p className="text-[32px] font-bold text-secondary leading-tight">{isEmpty ? 0 : '36'}</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-[26px]">pending_actions</span>
                </div>
              </div>
            </div>

            {/* Work Order Progress Timeline */}
            <div className="md:col-span-2 bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm border border-outline-variant/10">
              {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-outline-variant/60">query_builder</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-on-surface-variant">Sin actividad reciente</p>
                    <p className="text-[12px] text-outline">El historial de progreso se mostrará una vez que haya órdenes activas.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-xl overflow-hidden">
                        <img 
                          className="w-full h-full object-cover" 
                          alt="Rooftop HVAC Installation" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoPBe8FrXr42cmGkyJhwN04OAAsLlZ2RyDzXjtN4VrXOO31YgaQCNajtipXOVWhhckzkb8G9Q6e7O6yhFNWKQtYu0eXUSz1jMobwE2cw2E3qLX23qsrk8dkGovY5Cb9IgRaWznm01Eiv8Ai3YhyZPla5Ap7PSIZmuGMBrLcqQX3x43aMqAdL4su7bjHMvp1Cr3ZhJv6E0nXsfvwEGca-w2UPOoQSLSYkJyOpluRbGPN6WZcs3P80ldsw9dW9aOstnLlrLoYX-dthU" 
                        />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-on-surface">1824 Turkey Pen Road</p>
                        <p className="text-[12px] text-on-surface-variant">Cleveland, OH 44101</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary-fixed text-primary text-[11px] font-semibold rounded-full uppercase tracking-wider">
                        En Progreso
                      </span>
                      <button 
                        onClick={() => setPage('service_registry')}
                        className="w-9 h-9 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Vertical Timeline */}
                  <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30 text-left">
                    <div className="relative">
                      <div className="absolute -left-[24px] top-1 w-4.5 h-4.5 rounded-full bg-primary ring-4 ring-white"></div>
                      <div>
                        <p className="text-[12px] text-on-surface-variant font-semibold">23 Nov 2026</p>
                        <p className="text-[14px] text-on-surface font-medium">Instalación del nuevo sistema de aire acondicionado industrial</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[24px] top-1 w-4.5 h-4.5 rounded-full bg-primary ring-4 ring-white"></div>
                      <div>
                        <p className="text-[12px] text-on-surface-variant font-semibold">22 Nov 2026</p>
                        <p className="text-[14px] text-on-surface font-medium">Pruebas y aseguramiento de calidad en tuberías de refrigerante</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-outline-variant/20 flex justify-center">
                    <button 
                      onClick={() => alert('Cargando más historial...')} 
                      className="text-primary text-[13px] font-bold hover:underline cursor-pointer"
                    >
                      Cargar más historial
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Commissions Summary Widget (Only for Admin) */}
          {currentUser?.role === 'admin' && (
            <div className="bg-surface-container-lowest p-6 rounded-[16px] border border-outline-variant/10 shadow-sm text-left mt-6 space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  <span>Resumen de Comisiones del Mes</span>
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  Cálculo automático de comisiones: 2% en POS (Cajeros) y 10% en Soporte Completado (Técnicos).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50">
                      <th className="py-2.5 px-4">Empleado</th>
                      <th className="py-2.5 px-4">Rol / Tasa</th>
                      <th className="py-2.5 px-4 text-right">Volumen Procesado</th>
                      <th className="py-2.5 px-4 text-right">Comisión Devengada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {getEmployeeCommissions().map((emp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-on-surface">{emp.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            emp.role === 'cajero' ? 'bg-tertiary-fixed text-tertiary' : 'bg-secondary-fixed text-secondary'
                          }`}>
                            {emp.role} • {emp.rate}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                          ${emp.volume.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-primary text-[13px]">
                          ${emp.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Side Info Panels */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          
          {/* Operations Alerts Center */}
          <div className="bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm border border-outline-variant/10 text-left space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                <span className={`material-symbols-outlined text-rose-600 ${abandonedTickets.length > 0 || outOfStockProducts.length > 0 ? 'animate-bounce' : ''}`}>notifications_active</span>
                <span>Centro de Alertas</span>
              </h3>
              {(abandonedTickets.length > 0 || outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {abandonedTickets.length + outOfStockProducts.length + lowStockProducts.length} Activas
                </span>
              )}
            </div>

            {isEmpty || (abandonedTickets.length === 0 && outOfStockProducts.length === 0 && lowStockProducts.length === 0) ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <div>
                  <p className="text-[12px] font-bold text-emerald-800">Operación Segura</p>
                  <p className="text-[10px] text-emerald-600">No hay alertas críticas ni stock bajo.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {/* Critical Abandonment Alerts */}
                {abandonedTickets.map(t => (
                  <div key={t.id} className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 p-3 rounded-xl border-l-4 border-l-rose-500">
                    <span className="material-symbols-outlined text-rose-600 text-[18px] mt-0.5 flex-shrink-0">report</span>
                    <div>
                      <p className="text-[11px] font-bold text-rose-800">EQUIPO EN ABANDONO ({t.id})</p>
                      <p className="text-[11px] text-rose-700 font-semibold">{t.address}</p>
                      <p className="text-[10px] text-rose-500 mt-0.5">Registrado: {t.date.split(',')[0]} (&gt;90 días)</p>
                    </div>
                  </div>
                ))}

                {/* Out of Stock Alerts */}
                {outOfStockProducts.map(p => (
                  <div key={p.id} className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 p-3 rounded-xl border-l-4 border-l-amber-500">
                    <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5 flex-shrink-0">inventory_2</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-800">PRODUCTO AGOTADO</p>
                      <p className="text-[11px] text-amber-700 font-semibold">{p.name}</p>
                      <p className="text-[10px] text-amber-500 mt-0.5">SKU: {p.id}</p>
                    </div>
                  </div>
                ))}

                {/* Low Stock Alerts */}
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-xl border-l-4 border-l-slate-400">
                    <span className="material-symbols-outlined text-slate-500 text-[18px] mt-0.5 flex-shrink-0">warning_amber</span>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">STOCK CRÍTICO ({p.stock} U)</p>
                      <p className="text-[11px] text-slate-600 font-semibold">{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">SKU: {p.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* On-Duty Team */}
          <div className="bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm border border-outline-variant/10 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[16px] font-bold text-on-surface">Equipo de Turno</h3>
              <button 
                onClick={() => alert('Administrar equipo')} 
                className="text-secondary text-[12px] font-semibold hover:underline"
              >
                Gestionar
              </button>
            </div>
            
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-outline-variant/40">person_off</span>
                <p className="text-[13px] text-on-surface-variant font-medium">No hay técnicos en turno</p>
              </div>
            ) : (
              <div className="space-y-6">
                {onDutyTeam.map((tech, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed flex-shrink-0">
                        <img className="w-full h-full object-cover" alt={tech.name} src={tech.img} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-on-surface leading-tight">{tech.name}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{tech.role}</p>
                      </div>
                    </div>
                    <button className="text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent Tasks */}
          <div className="bg-surface-container-lowest p-card-padding rounded-[16px] shadow-sm border border-outline-variant/10 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[16px] font-bold text-on-surface">Tareas Pendientes</h3>
              <button 
                onClick={() => alert('Ver todas las tareas')} 
                className="text-secondary text-[12px] font-semibold hover:underline"
              >
                Ver Todas
              </button>
            </div>
            
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-outline-variant/40">task_alt</span>
                <p className="text-[13px] text-on-surface-variant font-medium">¡Todo al día!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urgentTasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-3 group cursor-pointer">
                    <div className={`text-[11px] font-semibold pt-0.5 whitespace-nowrap min-w-[70px] ${task.urgent ? 'text-error' : 'text-on-surface-variant'}`}>
                      {task.date}
                    </div>
                    <div className="flex items-start gap-1.5">
                      {task.urgent && (
                        <span className="material-symbols-outlined text-error text-[16px] mt-0.5 flex-shrink-0">report</span>
                      )}
                      <p className="text-[13px] text-on-surface font-medium group-hover:text-primary transition-colors leading-tight">
                        {task.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => {
                const desc = prompt('Nueva tarea:');
                if (desc) alert('Tarea guardada');
              }}
              className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between w-full group cursor-pointer text-left"
            >
              <span className="text-on-surface-variant text-[13px] font-semibold group-hover:text-primary transition-colors">Nueva Tarea</span>
              <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform text-[18px]">arrow_forward</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
