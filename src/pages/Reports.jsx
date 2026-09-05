import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Reports() {
  const { sales, products, tickets } = useApp();

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState('00');
  const [endHour, setEndHour] = useState('23');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productSearch, setProductSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');

  // Sub-tabs: 'dashboard' | 'products' | 'margins' | 'services' | 'export'
  const [reportTab, setReportTab] = useState('dashboard');

  // Helper: parse date format "24 jun 2026, 15:30" or similar
  const parseSaleTimestamp = (sale) => {
    if (sale.timestamp) return sale.timestamp;
    // Fallback if timestamp is missing but date is present
    try {
      const parts = sale.date.split(',');
      return Date.parse(parts[0]);
    } catch {
      return Date.now();
    }
  };

  // Helper: check if sale fits filters
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      const ts = parseSaleTimestamp(sale);
      const saleDate = new Date(ts);
      
      // Date Filter
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (saleDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (saleDate > end) return false;
      }

      // Hour Filter
      const hr = saleDate.getHours();
      if (hr < parseInt(startHour, 10) || hr > parseInt(endHour, 10)) {
        return false;
      }

      // Payment Method Filter
      if (paymentMethodFilter !== 'All' && sale.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Filter items (if category or product filters are applied)
      if (selectedCategory !== 'All' || productSearch.trim() !== '') {
        const hasMatchingItem = sale.items?.some(item => {
          // Category match
          const matchesCategory = selectedCategory === 'All' || item.variant === selectedCategory;
          // Product match
          const matchesProduct = productSearch.trim() === '' || 
            item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            item.id.toLowerCase().includes(productSearch.toLowerCase());
          return matchesCategory && matchesProduct;
        });
        if (!hasMatchingItem) return false;
      }

      return true;
    });
  }, [sales, startDate, endDate, startHour, endHour, selectedCategory, productSearch, paymentMethodFilter]);

  // Compute BI Statistics
  const stats = useMemo(() => {
    let rawRevenue = 0; // subtotal
    let discounts = 0;
    let tax = 0;
    let totalCollected = 0; // total
    let totalCOGS = 0; // cost of goods sold
    let totalTransactions = filteredSales.length;

    filteredSales.forEach(sale => {
      // If we filtered items, we should only sum those items for item-specific metrics
      const isSpecificFilter = selectedCategory !== 'All' || productSearch.trim() !== '';
      
      if (isSpecificFilter) {
        // Sum only matching items
        sale.items?.forEach(item => {
          const matchesCategory = selectedCategory === 'All' || item.variant === selectedCategory;
          const matchesProduct = productSearch.trim() === '' || 
            item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            item.id.toLowerCase().includes(productSearch.toLowerCase());
          
          if (matchesCategory && matchesProduct) {
            const itemRevenue = item.price * item.qty;
            rawRevenue += itemRevenue;
            // COGS: item cost, fallback to 60% of price
            const itemCost = item.cost || (item.price * 0.6);
            totalCOGS += itemCost * item.qty;
          }
        });
        // Approximate discount and tax proportionally
        const ratio = sale.subtotal > 0 ? (rawRevenue / sale.subtotal) : 1;
        discounts += (sale.discount || 0) * ratio;
        tax += (sale.tax || 0) * ratio;
        totalCollected += (sale.total || 0) * ratio;
      } else {
        // Standard full sale sum
        rawRevenue += sale.subtotal || 0;
        discounts += sale.discount || 0;
        tax += sale.tax || 0;
        totalCollected += sale.total || 0;

        sale.items?.forEach(item => {
          const itemCost = item.cost || (item.price * 0.6);
          totalCOGS += itemCost * item.qty;
        });
      }
    });

    const netRevenue = Math.max(0, rawRevenue - discounts);
    const netProfit = Math.max(0, netRevenue - totalCOGS);
    const averageTicket = totalTransactions > 0 ? (netRevenue / totalTransactions) : 0;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      rawRevenue,
      discounts,
      tax,
      netRevenue,
      totalCOGS,
      netProfit,
      averageTicket,
      profitMargin,
      totalTransactions
    };
  }, [filteredSales, selectedCategory, productSearch]);

  // Compute Technical Services Stats
  const serviceStats = useMemo(() => {
    const filteredTickets = (tickets || []).filter(ticket => {
      let ticketDate = new Date();
      if (ticket.date) {
        const clean = ticket.date.split(',')[0].toLowerCase().trim();
        const parts = clean.split(/\s+/);
        if (parts.length >= 3) {
          const months = {
            ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
          };
          let day = parseInt(parts[0], 10);
          let mStr = parts[1].substring(0, 3);
          let yr = parseInt(parts[2], 10);
          if (isNaN(day)) {
            mStr = parts[0].substring(0, 3);
            day = parseInt(parts[1], 10);
            yr = parseInt(parts[2], 10);
          }
          const monthIdx = months[mStr] !== undefined ? months[mStr] : 5;
          ticketDate = new Date(yr, monthIdx, day);
        }
      }
      
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (ticketDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (ticketDate > end) return false;
      }

      if (productSearch.trim() !== '') {
        const query = productSearch.toLowerCase();
        const matchesQuery = 
          ticket.id.toLowerCase().includes(query) ||
          ticket.address.toLowerCase().includes(query) ||
          ticket.systemType.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });

    const totalTickets = filteredTickets.length;
    const completedCount = filteredTickets.filter(t => t.status === 'Completed').length;
    const inProgressCount = filteredTickets.filter(t => t.status === 'In Progress').length;
    const pendingCount = filteredTickets.filter(t => t.status === 'Pending').length;

    const totalEstimates = filteredTickets.reduce((sum, t) => sum + (t.price || 0), 0);
    
    let totalCollected = 0;
    let totalPendingBalance = 0;

    filteredTickets.forEach(t => {
      const price = t.price || 0;
      const advance = t.advancePayment || 0;

      if (t.fullyPaid) {
        totalCollected += price;
      } else if (t.advancePaid) {
        totalCollected += advance;
        totalPendingBalance += Math.max(0, price - advance);
      } else {
        totalPendingBalance += price;
      }
    });

    const avgEstimate = totalTickets > 0 ? (totalEstimates / totalTickets) : 0;
    const completionRate = totalTickets > 0 ? (completedCount / totalTickets) * 100 : 0;

    return {
      filteredTickets,
      totalTickets,
      completedCount,
      inProgressCount,
      pendingCount,
      totalEstimates,
      totalCollected,
      totalPendingBalance,
      avgEstimate,
      completionRate
    };
  }, [tickets, startDate, endDate, productSearch]);

  // Product sales breakdown (Star Products & Slow Moving)
  const productPerformance = useMemo(() => {
    const itemSales = {};

    // Accumulate sales counts
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        if (!itemSales[item.id]) {
          itemSales[item.id] = {
            id: item.id,
            name: item.name,
            category: item.variant || 'Otros',
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0
          };
        }
        const costVal = item.cost || (item.price * 0.6);
        itemSales[item.id].unitsSold += item.qty;
        itemSales[item.id].revenue += item.price * item.qty;
        itemSales[item.id].cost += costVal * item.qty;
        itemSales[item.id].profit += (item.price - costVal) * item.qty;
      });
    });

    const list = Object.values(itemSales).sort((a, b) => b.unitsSold - a.unitsSold);

    // Identify slow moving items (Turnover)
    // Products in inventory that have zero sales in the filtered list
    const slowMoving = (products || []).filter(p => {
      // Filter out if category matches filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (productSearch.trim() !== '' && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !p.id.toLowerCase().includes(productSearch.toLowerCase())) return false;

      return !itemSales[p.id];
    }).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      stock: p.stock,
      price: p.price,
      cost: p.cost || (p.price * 0.6)
    }));

    return { stars: list, slowMoving };
  }, [filteredSales, products, selectedCategory, productSearch]);

  // Profits breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const categories = {
      Hardware: { revenue: 0, cost: 0, profit: 0, units: 0 },
      Peripherals: { revenue: 0, cost: 0, profit: 0, units: 0 },
      Electronics: { revenue: 0, cost: 0, profit: 0, units: 0 },
      Network: { revenue: 0, cost: 0, profit: 0, units: 0 }
    };

    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const cat = item.variant || 'Hardware';
        const costVal = item.cost || (item.price * 0.6);
        if (categories[cat] === undefined) {
          categories[cat] = { revenue: 0, cost: 0, profit: 0, units: 0 };
        }
        categories[cat].revenue += item.price * item.qty;
        categories[cat].cost += costVal * item.qty;
        categories[cat].profit += (item.price - costVal) * item.qty;
        categories[cat].units += item.qty;
      });
    });

    return Object.entries(categories).map(([name, data]) => {
      const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
      return { name, ...data, margin };
    });
  }, [filteredSales]);

  // SVG Chart: Daily sales trend in the filtered period
  const dailyChartData = useMemo(() => {
    const salesByDay = {};

    filteredSales.forEach(sale => {
      const ts = parseSaleTimestamp(sale);
      const dayKey = new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { revenue: 0, profit: 0 };
      }
      salesByDay[dayKey].revenue += (sale.subtotal - (sale.discount || 0));
      
      let saleCOGS = 0;
      sale.items?.forEach(item => {
        saleCOGS += (item.cost || item.price * 0.6) * item.qty;
      });
      salesByDay[dayKey].profit += Math.max(0, (sale.subtotal - (sale.discount || 0)) - saleCOGS);
    });

    const entries = Object.entries(salesByDay).slice(-7); // Last 7 days with data
    if (entries.length === 0) return [];
    
    const maxRev = Math.max(...entries.map(e => e[1].revenue), 100);
    return entries.map(([day, val]) => ({
      day,
      revenue: val.revenue,
      profit: val.profit,
      heightRev: (val.revenue / maxRev) * 120,
      heightProfit: (val.profit / maxRev) * 120
    }));
  }, [filteredSales]);

  // Export functions
  const handleExportCSV = () => {
    let csvContent = "sep=;\n";
    csvContent += "ID Transaccion;Fecha;Cajero;Metodo Pago;Subtotal;Descuento;IGV;Total;Items Cantidad\n";

    filteredSales.forEach(s => {
      const itemsCount = s.items?.reduce((sum, i) => sum + i.qty, 0) || 0;
      const row = [
        s.id,
        s.date,
        s.cashierName,
        s.paymentMethod,
        (s.subtotal || 0).toFixed(2),
        (s.discount || 0).toFixed(2),
        (s.tax || 0).toFixed(2),
        (s.total || 0).toFixed(2),
        itemsCount
      ].map(val => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(';');
      csvContent += row + '\n';
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sistech_reporte_ventas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportServicesCSV = () => {
    let csvContent = "sep=;\n";
    csvContent += "ID Orden;Fecha;Cliente;Telefono;Dispositivo;Precio Estimado;Adelanto Cobrado;Saldo Restante;Estado Pago;Progreso\n";

    serviceStats.filteredTickets.forEach(t => {
      const unpaidBalance = (t.price || 0) - (t.advancePaid ? (t.advancePayment || 0) : 0);
      const payStatus = t.fullyPaid ? 'Liquidado' : t.advancePaid && t.advancePayment > 0 ? 'Con Adelanto' : 'Impago';
      const row = [
        t.id,
        t.date || '',
        t.address || '',
        t.city || '',
        t.systemType || '',
        (t.price || 0).toFixed(2),
        (t.advancePayment || 0).toFixed(2),
        unpaidBalance.toFixed(2),
        payStatus,
        t.status || ''
      ].map(val => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(';');
      csvContent += row + '\n';
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sistech_reporte_servicios_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAccountingJSON = () => {
    // Standard accounting ledger grouped data
    const ledger = {
      empresa: 'SISTECH S.A.C.',
      tipoDocumento: 'Poliza Contable de Ventas Grouped',
      fechaGeneracion: new Date().toLocaleString('es-ES'),
      periodo: {
        inicio: startDate || 'Inicio de operaciones',
        fin: endDate || 'Actual'
      },
      kpis: {
        ingresoBruto: stats.rawRevenue,
        descuentosOtorgados: stats.discounts,
        baseImponible: stats.netRevenue,
        igvCobrado: stats.tax,
        totalRecaudado: stats.netRevenue + stats.tax,
        costoVentasCOGS: stats.totalCOGS
      },
      asientos: [
        {
          cuenta: '1212 - Cuentas por Cobrar Comerciales (POS)',
          debe: stats.netRevenue + stats.tax,
          haber: 0,
          glosa: 'Reconocimiento de ingresos de ventas cobradas por terminal POS'
        },
        {
          cuenta: '40111 - IGV - Cuenta Propia',
          debe: 0,
          haber: stats.tax,
          glosa: 'Impuesto general a las ventas derivado de la facturación'
        },
        {
          cuenta: '70121 - Mercaderías (Ingreso de Venta Neto)',
          debe: 0,
          haber: stats.netRevenue,
          glosa: 'Ventas netas de productos informáticos'
        },
        {
          cuenta: '69111 - Costo de Ventas (COGS)',
          debe: stats.totalCOGS,
          haber: 0,
          glosa: 'Costo del inventario entregado al cliente por ventas completadas'
        },
        {
          cuenta: '20111 - Mercaderías Almacén',
          debe: 0,
          haber: stats.totalCOGS,
          glosa: 'Disminución de existencias en almacén por venta'
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ledger, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sistech_poliza_contable_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 text-left print:bg-white print:text-black print:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/15 pb-6 print:hidden">
        <div>
          <h1 className="text-[24px] font-black text-on-surface">Reportes Analíticos y BI</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">
            Análisis financiero, rotación de productos, márgenes de ganancia y exportación contable.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setStartDate('') || setEndDate('') || setSelectedCategory('All') || setProductSearch('') || setPaymentMethodFilter('All')}
            className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/40 text-on-surface hover:bg-surface-container rounded-xl text-[12px] font-bold cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* FILTER BOX CONTAINER */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4 print:hidden">
        <h3 className="text-[14px] font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider mb-2">
          <span className="material-symbols-outlined text-primary text-[18px]">filter_list</span>
          <span>Filtros Multidimensionales</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Rango Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-medium outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Rango Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-medium outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Hora Venta (Desde/Hasta)</label>
            <div className="flex gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-bold outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-bold outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                  <option key={h} value={h}>{h}:59</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Buscar Producto</label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Nombre o SKU..."
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-outline-variant/10 pt-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-bold outline-none cursor-pointer"
            >
              <option value="All">Todas las Categorías</option>
              <option value="Hardware">Hardware</option>
              <option value="Peripherals">Periféricos</option>
              <option value="Electronics">Electrónica</option>
              <option value="Network">Redes</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Método de Pago</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-bold outline-none cursor-pointer"
            >
              <option value="All">Todos los métodos</option>
              <option value="Cash">Efectivo</option>
              <option value="Card">Tarjeta</option>
              <option value="QR">Yape / QR</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <span className="text-[12px] text-on-surface-variant bg-slate-100 py-2 px-3 rounded-xl border border-slate-200/50 font-semibold">
              Ventas encontradas: <strong className="text-primary">{filteredSales.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Ingresos Netos', val: `$${stats.netRevenue.toFixed(2)}`, desc: `Bruto: $${stats.rawRevenue.toFixed(2)}`, icon: 'payments', color: 'text-primary bg-primary-fixed/20' },
          { label: 'Costo Almacén (COGS)', val: `$${stats.totalCOGS.toFixed(2)}`, desc: 'Costo existencias vendidas', icon: 'warehouse', color: 'text-amber-600 bg-amber-500/10' },
          { label: 'Utilidad Neta Real', val: `$${stats.netProfit.toFixed(2)}`, desc: 'Ganancia real del negocio', icon: 'trending_up', color: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Margen Comercial', val: `${stats.profitMargin.toFixed(1)}%`, desc: 'Utilidad / Venta Neta', icon: 'margin', color: 'text-purple-600 bg-purple-500/10' },
          { label: 'Transacciones', val: stats.totalTransactions, desc: 'Recibos POS emitidos', icon: 'receipt', color: 'text-blue-600 bg-blue-500/10' },
          { label: 'Ticket Promedio', val: `$${stats.averageTicket.toFixed(2)}`, desc: 'Consumo medio por venta', icon: 'point_of_sale', color: 'text-rose-600 bg-rose-500/10' }
        ].map((card, i) => (
          <div key={i} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 shadow-sm text-left flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-on-surface-variant leading-none">{card.label}</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${card.color}`}>
                <span className="material-symbols-outlined text-[16px]">{card.icon}</span>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[18px] font-black text-on-surface leading-tight">{card.val}</p>
              <p className="text-[9px] text-on-surface-variant font-medium mt-1">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex border-b border-outline-variant/30 gap-2 print:hidden">
        {[
          { id: 'dashboard', label: 'Evolución y Utilidades', icon: 'insights' },
          { id: 'products', label: 'Artículos Estrella y Rotación', icon: 'star' },
          { id: 'margins', label: 'Margen y Categorías', icon: 'grid_view' },
          { id: 'services', label: 'Soporte Técnico', icon: 'build' },
          { id: 'export', label: 'Exportación y Contabilidad', icon: 'file_download' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportTab(t.id)}
            className={`pb-3 px-4 font-bold text-[13px] flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              reportTab === t.id 
                ? 'border-primary text-primary font-black' 
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* REPORT CONTENT */}
      <div className="min-h-[40vh]">
        
        {/* TAB 1: EVOLUCION / DASHBOARD */}
        {reportTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual SVG Sales Trend Chart */}
            <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col text-left space-y-4">
              <div>
                <h3 className="text-[15px] font-bold text-on-surface">Tendencia Diaria de Ventas y Utilidades</h3>
                <p className="text-[12px] text-on-surface-variant">Comparativo de Ingresos vs Utilidad Neta (Últimos días con actividad)</p>
              </div>

              {dailyChartData.length === 0 ? (
                <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center p-6">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/60 mb-2">bar_chart</span>
                  <p className="text-[13px] font-bold text-on-surface-variant">Sin datos de tendencia</p>
                  <p className="text-[11px] text-outline">Modifica el rango de filtros para capturar transacciones.</p>
                </div>
              ) : (
                <div className="h-[220px] w-full flex items-end justify-between px-6 pt-8 pb-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  {dailyChartData.map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 text-left shadow-lg">
                        <p className="font-bold border-b border-white/20 pb-0.5 mb-0.5">{d.day}</p>
                        <p className="text-emerald-400">Venta: ${d.revenue.toFixed(2)}</p>
                        <p className="text-blue-300">Utilidad: ${d.profit.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex gap-1.5 items-end justify-center h-[120px] w-full">
                        {/* Revenue Bar */}
                        <div 
                          style={{ height: `${d.heightRev}px` }} 
                          className="w-4 bg-emerald-500 rounded-t-xs hover:brightness-95 transition-all duration-300"
                        />
                        {/* Profit Bar */}
                        <div 
                          style={{ height: `${d.heightProfit}px` }} 
                          className="w-4 bg-blue-500 rounded-t-xs hover:brightness-95 transition-all duration-300"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-6 justify-center text-[11px] font-bold pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-xs block"></span>
                  <span className="text-slate-700">Ingresos Netos ($)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-blue-500 rounded-xs block"></span>
                  <span className="text-slate-700">Utilidad Neta ($)</span>
                </div>
              </div>
            </div>

            {/* Quick BI Summary Panel */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm text-left space-y-4">
              <h3 className="text-[15px] font-bold text-on-surface">Diagnóstico Operativo de Negocio</h3>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                  <span className="material-symbols-outlined text-emerald-600 mt-0.5">check_circle</span>
                  <div>
                    <h4 className="text-[12px] font-bold text-emerald-800">Rentabilidad</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-normal">
                      El negocio opera con un margen del <strong>{stats.profitMargin.toFixed(1)}%</strong>. Un valor por encima del 35% indica una salud financiera óptima en el sector minorista de hardware.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-primary-fixed/10 rounded-2xl border border-primary/10">
                  <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                  <div>
                    <h4 className="text-[12px] font-bold text-primary-dark">Impuesto Recaudado</h4>
                    <p className="text-[11px] text-primary/80 mt-0.5 leading-normal">
                      Se han acumulado <strong>${stats.tax.toFixed(2)}</strong> de IGV por pagar en el periodo seleccionado, listos para su respectiva declaración contable.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-100 rounded-2xl border border-slate-200/50">
                  <span className="material-symbols-outlined text-slate-600 mt-0.5">insights</span>
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800">Costo de Existencias</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                      La reposición del inventario vendido equivale a <strong>${stats.totalCOGS.toFixed(2)}</strong>. Recuerda auditar los costos de adquisición para asegurar la rentabilidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STARS & ROTATION */}
        {reportTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Star Products list */}
            <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500">star</span>
                  <span>Productos Estrella (Más Vendidos)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Clasificados por cantidad</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50">
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Unidades</th>
                      <th className="py-2.5 px-3 text-right">Ingreso Bruto</th>
                      <th className="py-2.5 px-3 text-right">Margen</th>
                      <th className="py-2.5 px-3 text-right">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {productPerformance.stars.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-on-surface-variant font-semibold">
                          No hay registros de ventas de artículos en este periodo.
                        </td>
                      </tr>
                    ) : (
                      productPerformance.stars.map((item, idx) => {
                        const mPct = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3">
                              <p className="font-bold text-on-surface text-[12.5px]">{item.name}</p>
                              <p className="text-[9.5px] text-slate-500 font-mono">SKU: {item.id} • {item.category}</p>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-800">{item.unitsSold}</td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-700">${item.revenue.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-black text-emerald-600">${item.profit.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {mPct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Slow Moving Products */}
            <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-500">warning_amber</span>
                  <span>Artículos de Lenta Rotación (Estancados)</span>
                </h3>
                <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-bold">
                  {productPerformance.slowMoving.length} Items
                </span>
              </div>

              <p className="text-[11.5px] text-on-surface-variant leading-relaxed">
                Productos que no registran ventas en el periodo seleccionado. Evalúe ofertas, promociones o liquidaciones para liberar capital de trabajo.
              </p>

              <div className="overflow-x-auto max-h-[320px] overflow-y-auto pr-1">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50 sticky top-0">
                      <th className="py-2.5 px-3 bg-slate-50">Producto</th>
                      <th className="py-2.5 px-3 text-center bg-slate-50">Stock</th>
                      <th className="py-2.5 px-3 text-right bg-slate-50">Precio</th>
                      <th className="py-2.5 px-3 text-right bg-slate-50">Costo Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {productPerformance.slowMoving.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-on-surface-variant font-semibold">
                          Todos los productos de la categoría se han vendido al menos una vez en el periodo.
                        </td>
                      </tr>
                    ) : (
                      productPerformance.slowMoving.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 text-slate-700">
                          <td className="py-3 px-3">
                            <p className="font-bold text-on-surface text-[12.5px]">{item.name}</p>
                            <p className="text-[9.5px] text-slate-500">SKU: {item.id} • {item.category}</p>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.stock} U
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold">${item.price.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-medium text-slate-500">${item.cost.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MARGINS & CATEGORIES */}
        {reportTab === 'margins' && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-6">
            <div>
              <h3 className="text-[15px] font-bold text-on-surface">Rentabilidad y Márgenes por Categoría</h3>
              <p className="text-[12px] text-on-surface-variant">Análisis comparativo de volumen total facturado frente a utilidad neta real por categoría.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50">
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-center">Unidades</th>
                      <th className="py-3 px-4 text-right">Ingresos</th>
                      <th className="py-3 px-4 text-right">Utilidad Neta</th>
                      <th className="py-3 px-4 text-right">Margen Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {categoryBreakdown.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 font-bold text-on-surface">{cat.name}</td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-600">{cat.units}</td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-700">${cat.revenue.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right font-black text-emerald-600">${cat.profit.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-[11px] font-bold text-primary bg-primary-fixed/20 px-2 py-0.5 rounded border border-primary/10">
                            {cat.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress bars margins visualization */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/50 space-y-5 text-left">
                <h4 className="text-[13px] font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-200 pb-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">percent</span>
                  <span>Visualización de Rentabilidad</span>
                </h4>
                
                <div className="space-y-4">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[12px] font-bold">
                        <span className="text-on-surface">{cat.name}</span>
                        <span className="text-emerald-700">{cat.margin.toFixed(1)}% de margen</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                        {/* Cost width */}
                        <div 
                          style={{ width: `${cat.revenue > 0 ? (cat.cost / cat.revenue) * 100 : 0}%` }} 
                          className="bg-amber-500" 
                          title="Costo de Existencias"
                        />
                        {/* Profit width */}
                        <div 
                          style={{ width: `${cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0}%` }} 
                          className="bg-emerald-500" 
                          title="Utilidad Neta"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-6 justify-center text-[10px] font-bold pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs block"></span>
                    <span className="text-slate-600">Costo (Existencias)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs block"></span>
                    <span className="text-slate-600">Utilidad Neta (Ganancia)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOPORTE TECNICO */}
        {reportTab === 'services' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards for Technical Services */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { label: 'Total de Órdenes', val: serviceStats.totalTickets, desc: `Completadas: ${serviceStats.completedCount} (${serviceStats.completionRate.toFixed(1)}%)`, icon: 'receipt_long', color: 'text-primary bg-primary-fixed/20' },
                { label: 'Ingresos por Servicios', val: `$${serviceStats.totalCollected.toFixed(2)}`, desc: 'Adelantos y saldos cobrados', icon: 'payments', color: 'text-emerald-600 bg-emerald-500/10' },
                { label: 'Saldos por Cobrar', val: `$${serviceStats.totalPendingBalance.toFixed(2)}`, desc: 'Reparaciones pendientes de cobro', icon: 'pending_actions', color: 'text-amber-600 bg-amber-500/10' },
                { label: 'Cotización Promedio', val: `$${serviceStats.avgEstimate.toFixed(2)}`, desc: 'Valor estimado por orden', icon: 'point_of_sale', color: 'text-rose-600 bg-rose-500/10' }
              ].map((card, i) => (
                <div key={i} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 shadow-sm text-left flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-on-surface-variant leading-none">{card.label}</span>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${card.color}`}>
                      <span className="material-symbols-outlined text-[16px]">{card.icon}</span>
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[18px] font-black text-on-surface leading-tight">{card.val}</p>
                    <p className="text-[9px] text-on-surface-variant font-medium mt-1">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Table of Technical Services */}
              <div className="lg:col-span-8 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                  <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                    <span>Mesa de Auditoría de Servicios</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleExportServicesCSV}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span>Exportar CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50">
                        <th className="py-2.5 px-3">ID / Fecha</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Dispositivo</th>
                        <th className="py-2.5 px-3 text-right">Costo Total</th>
                        <th className="py-2.5 px-3 text-right">Adelanto</th>
                        <th className="py-2.5 px-3 text-right">Saldo Restante</th>
                        <th className="py-2.5 px-3 text-center">Estado Pago</th>
                        <th className="py-2.5 px-3 text-center">Progreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {serviceStats.filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-on-surface-variant font-semibold">
                            No se encontraron órdenes de soporte técnico con los filtros actuales.
                          </td>
                        </tr>
                      ) : (
                        serviceStats.filteredTickets.map((t) => {
                          const unpaidBalance = (t.price || 0) - (t.advancePaid ? (t.advancePayment || 0) : 0);
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3">
                                <p className="font-bold text-primary font-mono">{t.id}</p>
                                <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">{t.date?.split(',')[0]}</p>
                              </td>
                              <td className="py-3 px-3 font-semibold">{t.address}</td>
                              <td className="py-3 px-3 truncate max-w-[120px]" title={t.systemType}>{t.systemType}</td>
                              <td className="py-3 px-3 text-right font-bold">${(t.price || 0).toFixed(2)}</td>
                              <td className="py-3 px-3 text-right">
                                <p className="font-semibold">${(t.advancePayment || 0).toFixed(2)}</p>
                                {t.advancePayment > 0 && (
                                  <span className={`text-[8px] font-black uppercase ${t.advancePaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {t.advancePaid ? 'Cobrado' : 'Impago'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-primary">${unpaidBalance.toFixed(2)}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  t.fullyPaid 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : t.advancePaid && t.advancePayment > 0
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {t.fullyPaid ? 'Liquidado' : t.advancePaid && t.advancePayment > 0 ? 'Con Adelanto' : 'Impago'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                  t.status === 'Completed'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : t.status === 'Pending'
                                      ? 'bg-red-50 border-red-200 text-red-600'
                                      : 'bg-blue-50 border-blue-200 text-blue-600'
                                }`}>
                                  {t.status === 'Completed' ? 'Listo' : t.status === 'Pending' ? 'Pendiente' : 'Proceso'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Breakdown charts / summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm text-left space-y-4">
                  <h4 className="text-[13px] font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-200 pb-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">donut_large</span>
                    <span>Distribución de Estados</span>
                  </h4>
                  
                  <div className="relative flex items-center justify-center my-4 h-[120px]">
                    {(() => {
                      const total = serviceStats.totalTickets || 1;
                      const pctComp = (serviceStats.completedCount / total) * 100;
                      const pctProg = (serviceStats.inProgressCount / total) * 100;
                      const pctPend = (serviceStats.pendingCount / total) * 100;
                      
                      const circ = 2 * Math.PI * 40;
                      const dComp = (pctComp / 100) * circ;
                      const dProg = (pctProg / 100) * circ;
                      const dPend = (pctPend / 100) * circ;
                      
                      const offComp = 0;
                      const offProg = -dComp;
                      const offPend = -(dComp + dProg);
                      
                      return (
                        <>
                          <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-outline-variant)" strokeWidth="8" strokeOpacity="0.1" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray={`${dComp} ${circ}`} strokeDashoffset={offComp} strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="8" strokeDasharray={`${dProg} ${circ}`} strokeDashoffset={offProg} strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="8" strokeDasharray={`${dPend} ${circ}`} strokeDashoffset={offPend} strokeLinecap="round" />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-[16px] font-black text-on-surface leading-none">{serviceStats.totalTickets}</span>
                            <span className="text-[9px] text-on-surface-variant font-medium mt-0.5">Tickets</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block"></span>
                        <span className="text-on-surface text-[9px]">Listo</span>
                      </div>
                      <span className="text-on-surface-variant font-semibold mt-0.5">{serviceStats.completedCount}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                        <span className="text-on-surface text-[9px]">Proceso</span>
                      </div>
                      <span className="text-on-surface-variant font-semibold mt-0.5">{serviceStats.inProgressCount}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block"></span>
                        <span className="text-on-surface text-[9px]">Pend.</span>
                      </div>
                      <span className="text-on-surface-variant font-semibold mt-0.5">{serviceStats.pendingCount}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm text-left space-y-4">
                  <h4 className="text-[13px] font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-200 pb-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">account_balance_wallet</span>
                    <span>Flujo de Recaudación</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[12px]">
                      <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs block"></span>
                        <span>Ingresos Efectivos Cobrados:</span>
                      </div>
                      <span className="font-bold text-emerald-700">${serviceStats.totalCollected.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[12px]">
                      <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs block"></span>
                        <span>Saldos Pendientes de Cobro:</span>
                      </div>
                      <span className="font-bold text-amber-600">${serviceStats.totalPendingBalance.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[12px] font-bold text-on-surface">
                      <span>Proyección Total Cotizada:</span>
                      <span>${(serviceStats.totalCollected + serviceStats.totalPendingBalance).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPORT OPTIONS */}
        {reportTab === 'export' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Standard Spreadsheet Export */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm text-left flex flex-col justify-between h-full min-h-[220px]">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">table_view</span>
                </div>
                <h3 className="text-[15px] font-bold text-on-surface">Exportación en Hoja de Cálculo</h3>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Descarga un reporte consolidado en formato **CSV** compatible con Microsoft Excel, Google Sheets o sistemas ERP alternativos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="mt-6 py-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Exportar Ventas a CSV</span>
              </button>
            </div>

            {/* Services CSV Export */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm text-left flex flex-col justify-between h-full min-h-[220px]">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">build_circle</span>
                </div>
                <h3 className="text-[15px] font-bold text-on-surface">Servicios Técnicos a CSV</h3>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Exporta todas las órdenes y cotizaciones de servicio técnico generadas en el período seleccionado a un archivo **CSV**.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportServicesCSV}
                className="mt-6 py-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Exportar Servicios a CSV</span>
              </button>
            </div>

            {/* Print/PDF Executive State report */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm text-left flex flex-col justify-between h-full min-h-[220px]">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
                </div>
                <h3 className="text-[15px] font-bold text-on-surface">Informe PDF / Imprimible</h3>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Genera una plantilla limpia del balance general de ventas, ideal para juntas ejecutivas, auditorías internas o archivo físico.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="mt-6 py-2.5 w-full bg-primary hover:brightness-105 text-on-primary rounded-xl text-[12px] font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Imprimir Reporte Ejecutivo</span>
              </button>
            </div>

            {/* Ledger Accounting JSON export */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm text-left flex flex-col justify-between h-full min-h-[220px]">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                </div>
                <h3 className="text-[15px] font-bold text-on-surface">Póliza / Asiento Contable (BI)</h3>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Descarga el asiento en formato estructurado **JSON** contable. Agrupa cuentas por cobrar POS, IGV por pagar, e inventarios.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAccountingJSON}
                className="mt-6 py-2.5 w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[12px] font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                <span>Descargar Asiento Contable</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable executive report layout (Hidden on screen, shown in print) */}
      <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto font-sans leading-relaxed text-[12px]">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
          <div className="text-left">
            <h1 className="text-[20px] font-black uppercase">Reporte General de Ventas y Utilidades</h1>
            <p className="text-slate-500 font-semibold mt-1">SISTECH S.A.C. • RUC: 20748392018</p>
          </div>
          <div className="text-right">
            <p><strong>Fecha Impresión:</strong> {new Date().toLocaleDateString('es-ES')}</p>
            <p><strong>Periodo:</strong> {startDate || 'Inicio'} al {endDate || 'Hoy'}</p>
          </div>
        </div>

        <h3 className="font-bold border-b border-slate-300 pb-1 mb-3 text-[13px] text-left uppercase">KPIs de Rendimiento Financiero</h3>
        <div className="grid grid-cols-3 gap-6 mb-8 text-left">
          <div>
            <span className="text-[11px] text-slate-500 block">Total Ventas Facturadas (Neto):</span>
            <span className="text-[16px] font-bold">${stats.netRevenue.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Costo de Existencias Vendidas (COGS):</span>
            <span className="text-[16px] font-bold">${stats.totalCOGS.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Utilidad Neta Real:</span>
            <span className="text-[16px] font-bold text-emerald-700">${stats.netProfit.toFixed(2)}</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-slate-500 block">Margen Comercial Medio:</span>
            <span className="text-[14px] font-bold">{stats.profitMargin.toFixed(1)}%</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-slate-500 block">Impuesto IGV Recaudado:</span>
            <span className="text-[14px] font-bold">${stats.tax.toFixed(2)}</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-slate-500 block">Transacciones Procesadas:</span>
            <span className="text-[14px] font-bold">{stats.totalTransactions} Ventas</span>
          </div>
        </div>

        <h3 className="font-bold border-b border-slate-300 pb-1 mb-3 text-[13px] text-left uppercase">Resumen de Soporte Técnico</h3>
        <div className="grid grid-cols-3 gap-6 mb-8 text-left">
          <div>
            <span className="text-[11px] text-slate-500 block">Total Órdenes Registradas:</span>
            <span className="text-[14px] font-bold">{serviceStats.totalTickets} Órdenes</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Ingresos Cobrados (Servicios):</span>
            <span className="text-[14px] font-bold text-emerald-700">${serviceStats.totalCollected.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Saldos por Cobrar Pendientes:</span>
            <span className="text-[14px] font-bold text-amber-700">${serviceStats.totalPendingBalance.toFixed(2)}</span>
          </div>
        </div>

        <h3 className="font-bold border-b border-slate-300 pb-1 mb-3 text-[13px] text-left uppercase">Rendimiento por Categoría de Producto</h3>
        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600 font-bold bg-slate-50">
              <th className="py-2 px-3">Categoría</th>
              <th className="py-2 px-3 text-center">Unidades</th>
              <th className="py-2 px-3 text-right">Ingresos</th>
              <th className="py-2 px-3 text-right">Costo COGS</th>
              <th className="py-2 px-3 text-right">Utilidad</th>
              <th className="py-2 px-3 text-right">Margen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categoryBreakdown.map((cat, idx) => (
              <tr key={idx}>
                <td className="py-2 px-3 font-bold">{cat.name}</td>
                <td className="py-2 px-3 text-center">{cat.units}</td>
                <td className="py-2 px-3 text-right">${cat.revenue.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">${cat.cost.toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-bold">${cat.profit.toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-bold">{cat.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-end mt-20 pt-10 border-t border-slate-300">
          <div className="text-center w-48 border-t border-slate-400 pt-2">
            <p className="font-bold">Firma Gerente</p>
          </div>
          <div className="text-center w-48 border-t border-slate-400 pt-2">
            <p className="font-bold">Firma Contador</p>
          </div>
        </div>
      </div>
    </div>
  );
}
