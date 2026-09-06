import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  supabase, 
  isSupabaseConfigured,
  mapProductFromDb,
  mapProductToDb,
  mapTicketFromDb,
  mapTicketToDb,
  mapSaleFromDb,
  mapSaleToDb,
  mapAttendanceFromDb,
  mapAttendanceToDb,
  mapCierreFromDb,
  mapCierreToDb
} from '../config/supabase';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// Initial Static Seeding Data
const initialMockProducts = [
  {
    id: 'SKU-9921-A',
    name: 'ProBook Catalyst X1',
    category: 'Hardware',
    subCategory: 'Computing / Laptops',
    stock: 1240,
    price: 1299.00,
    cost: 780.00,
    status: 'In Stock',
    desc: '14" FHD Display, Intel Core i7, 16GB RAM, 512GB SSD. Perfect for business operations.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvNHT1ah7Nj9Uc7ShcMJOS5IqbQdWkEVthX2b9HGW7LulRDf05zSnNj7SowHcmn43wC6t7O--kAIbgU6QHpuiny9eRRYkyMgtbhVXCZ-Ms9U81jonGVxqdrCon4x4gvjuRft-30KVMpy2uIMkO2rPgRs0FXk0eml0f_vvZonqQ5SKSAUwEbvywHUspil4QbXFHG_XvZLExoM1Fqbrx_NBhldk8bzc-S_bkGnjoubJzd2YEfWJWa66YaJg5lNkMa3X4JHQzjWQRUVI'
  },
  {
    id: 'SKU-4812-B',
    name: 'Mechanical Core G2',
    category: 'Peripherals',
    subCategory: 'Peripherals / Input',
    stock: 12,
    price: 189.50,
    cost: 110.00,
    status: 'Low Stock',
    desc: 'Custom mechanical switches, RGB backlighting, durable double-shot PBT keycaps.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVZA07n9bYb_578Uj_M_6tFbtkzHCICEuSsRebN2NCtG8xrdseUc0S6VJNGuw2I0KpvcCuCK6J0vHZ4OtK7-TxsQ0zbwScw7SlPb4MUqbrTub8ZY-1OqD53-1NfV9ALIXYLgkX1AX_jRsp4a2KLCCBTmZ2j9JcXSoYAzDn3UbIJrgyNLSvsniNAaIBBfrG269KLlQHKYqOPzjXpvz_BgLobNo72H_SjDmHJygbA6bdDn8l3DSqlq9ex0M_AwLOfJ9_wCZsAxhwmPQ'
  },
  {
    id: 'SKU-0034-C',
    name: 'Acoustic Pro Hub',
    category: 'Electronics',
    subCategory: 'Audio / Studio',
    stock: 0,
    price: 450.00,
    cost: 270.00,
    status: 'Out of Stock',
    desc: 'Wireless noise-canceling headphones with studio-grade sound and premium memory foam.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVYElGksvgrOi7UGMj9ziRdm9N2nKaS2MfkXTY9EmeDG-0QqUMa_fnsWB84wM01eifKgvK_OqoTlV-8pKNl908l6-7c92PKKnSqBNeC8sJvyYUk1oTTDJJHt-KFm81_36_1PiatrulWFZkbnrT6A_bvAEdKDRTISJ8KIx6JFKCAvupUJCsiDw1TT6ZZhb3RwNptjLvYAbQWBdXKXboIGdxBWHmv91jNxqFTpFpeNx_tA_r7OVxeS2AmwPLcBOVha-879yqCuOcYFE'
  },
  {
    id: 'SKU-7718-X',
    name: 'Server Node Alpha',
    category: 'Network',
    subCategory: 'Infrastructure / Networking',
    stock: 45,
    price: 4850.00,
    cost: 3100.00,
    status: 'In Stock',
    desc: 'Dual-processor server rack node, redundant power supplies, high-capacity PCIe Gen 5 routing.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFtXv557AIvbQt6UYsIKNFWepS7B5lLkQOCSaw8T0qV76_H9Q7F4S6roSyJ_Fsi75mfF5ohwmZf0Qop5p2xLhxUdQ4wh2Zriow_sqc-OdE7-hYrZHWkVeuWY4Y35gy5CT-naUoiuGum3dMs165eBsxyJBnZUFWgYy0JZ3-yMW08YXtIW9J5zdRjdSus6XjoK6x2NZaYL6l-ntAq79OsewwjoHkcBIKXnvu-KnpeHBTonYv0J3YBBLRso3Mzkin5CVZpBdIDEiDjro'
  },
  {
    id: 'SKU-8812-M',
    name: 'MacBook Pro 14" (M3 Pro)',
    category: 'Hardware',
    subCategory: 'Computing / Laptops',
    stock: 15,
    price: 1999.00,
    cost: 1250.00,
    status: 'In Stock',
    desc: '12-core CPU, 18-core GPU, 18GB Unified Memory, 512GB SSD. Space Black.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy-XvtAkOgU0cks9eYl4bfVooDykB2TIqS2AyPB6mr4TrUF9mM_-_2gjf6LyPbAGRhqIqPHsxPAzEaZcWHyHu4rknhWs25GUycXTabqKrRuBTUCf5U3whAVjERHt3hCL8oBIhX3b2dAvRF7av5DGHW5sTt1qwvzN2-_ZYX2LdkMfBi3qVsTUfy2-G_pizi0Irt6P9XaHgaPSg6J_eH-uZK0rhB73SBnFs9-bLzM_uK2eneIHFVBb1mWNMAPAsZNeiVg6GI9hkKvtQ'
  },
  {
    id: 'SKU-7729-A',
    name: 'MacBook Air 13" (M2)',
    category: 'Hardware',
    subCategory: 'Computing / Laptops',
    stock: 35,
    price: 999.00,
    cost: 600.00,
    status: 'In Stock',
    desc: '8GB Memory, 256GB SSD storage. Liquid Retina display. Starlight.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozsEfiyotDOR9zdolD7jCvkK2UPYLOdYqL-x2tF5lrTJqx4jnh9ddxWIwqUWj2MuMTMHKOPBeXKg3vzIP5IVCsEb5oOc0OSO5YrWf7PrMGyVovrXDeYeMiqKNd8VhSOl4y7Pw32q7hIidNqUPrAzjzYAs5KhaTV4bX7zE3HzLX6c40SMKWFd-rAQPSe6-pbfZFm5-X1m3lJp93sXwsq0-CyCqVtUA66k1UbfSTihEG2SwsLQd1kEqqNXJCq78bWFvuSZTCgUJLJg'
  },
  {
    id: 'SKU-Magic-M',
    name: 'Magic Mouse',
    category: 'Peripherals',
    subCategory: 'Peripherals / Input',
    stock: 80,
    price: 79.00,
    cost: 45.00,
    status: 'In Stock',
    desc: 'Wireless, rechargeable with a multi-touch surface.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8v09YhAR1h3iSCuYrGvBcE7TL4hn7bCYoXoiJc1u0cpicTdvQmnJn-0qDi4e81uiQNAlbMHGds7sNwD0bQW5hV1w1LreayYfQi_0n9OmBvP3WcEZGwxr26Dym95-s3RuzG1Pqz2VrU9Mt6Ef7xTTHuPkVX4Tm3K7jtEEPcrp4e9J4G0APLGMfUP0kEDpDc0bwIQaWxBoq-J0SUtT2Nv3biBaQY-NtL53o7Q-XumIFuC5cf6cnZhPWnkyYsUYSJn08sgY_GF-upD4'
  },
  {
    id: 'SKU-USB-C',
    name: 'USB-C Multiport Hub',
    category: 'Peripherals',
    subCategory: 'Peripherals / Accessories',
    stock: 120,
    price: 59.99,
    cost: 35.00,
    status: 'In Stock',
    desc: '7-in-1 adapter with 4K HDMI, Power Delivery.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4akpXsvnyOZ5M0puIO-MuVvYNIFyzgRo5FwQhMTKa-ipyzVrh2NvLsGQvuXFUwLQVvSmPHVG6lkvL8qWgxzM5yy6BKuzs6rxyf66JNU7rYu2lL6XJHPNTZJZ8CrTmEFiou5fco_epgp-NTwV2jwCU03ss1tz32gKUpJgW4z6HWOK7Su1L48r5Epz0jo6ClPHjWgqXiC3iEkx8M4lzGHagvBnR2N2OwLQXrAGl66bWhRgFRnhm4CJUtUpi46wZrhdXx5Yx2vcRH5k'
  },
  {
    id: 'SKU-8833-P',
    name: 'MacBook Pro 14" (M2 Pro)',
    category: 'Hardware',
    subCategory: 'Computing / Laptops',
    stock: 2,
    price: 1449.00,
    cost: 900.00,
    status: 'Low Stock',
    desc: '16GB RAM, 512GB SSD. Refurbished Grade A.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCveEEwQoLbNXsxHDanI4GxDpQ-RmseHJha42MM4e9jVpxPNXPp9vDWwtpfVuihi6woaQrFgUpHIZzQXRxXxtR8kHJG-1H-mhdet4JTnTXqY-4z40IfkpiTvyX9Ki6QiV8y4tvhulE5Dm9GGP0vjLk0eJrL0LlXcVuhd7b3k874pvcuWkm321LjHJ73KAmSKjIrusRQdZJ6pi4DMPTet7Ydq5_um0v2htnahZ8qnRsvS4jFV0izCoFo0-bTz4In5PNmXb-V2A4DwVA'
  }
];

const initialMockTickets = [
  {
    id: 'ST-2026-00482',
    address: 'Lic. Carlos Eduardo Mendoza Ramos',
    city: '+591 71234567 • Tarija, Bolivia',
    systemType: 'Lenovo ThinkPad E14 Gen 4',
    status: 'Completed',
    price: 450,
    advancePayment: 0,
    advancePaid: false,
    balancePaid: true,
    fullyPaid: true,
    date: '05 / 09 / 2026, 11:30',
    techs: 1,
    desc: 'Obstrucción por polvo en disipador, pasta térmica degradada, sectores lógicos inconsistentes en sistema operativo y necesidad de mantenimiento preventivo integral y optimización.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
    deviceType: 'Computadora Portátil (Laptop)',
    clientCi: '5489214 Tarija',
    clientPhone: '+591 71234567',
    clientCity: 'Tarija, Bolivia',
    clientAddress: 'Barrio San Martín, Calle Ingavi N° 450',
    serialNumber: 'PF-3X9K82',
    processorRam: 'Intel Core i7-1255U / 16 GB DDR4',
    storage: 'SSD NVMe M.2 512 GB',
    accessories: 'Cargador original USB-C 65W, funda protectora',
    issueReason: 'Equipo presenta sobrecalentamiento, apagado repentino y lentitud generalizada en arranque del SO.',
    diagnosis: 'Obstrucción por polvo en disipador, pasta térmica degradada, sectores lógicos inconsistentes en sistema operativo y necesidad de mantenimiento preventivo integral y optimización.',
    finalStatus: 'OPERATIVO AL 100% — Pruebas de estrés térmico superadas (temperatura máx. 68°C bajo carga). Sistema operativo reinstalado y actualizado con respaldo de datos intacto.',
    serviceItems: [
      {
        item: 1,
        desc: 'Mantenimiento preventivo profundo: desensamble, limpieza ultrasónica de ventilador, cambio de pasta térmica de alto rendimiento (Arctic MX-4) y pads térmicos.',
        qty: 1,
        unitPrice: 180.00,
        subtotal: 180.00
      },
      {
        item: 2,
        desc: 'Optimización de software, formateo limpio, configuración de controladores originales y respaldo de partición de datos (120 GB respaldados con verificación MD5).',
        qty: 1,
        unitPrice: 150.00,
        subtotal: 150.00
      },
      {
        item: 3,
        desc: 'Licenciamiento antivirus corporativo con protección proactiva y revisión de seguridad perimetral.',
        qty: 1,
        unitPrice: 120.00,
        subtotal: 120.00
      }
    ],
    assignedTech: {
      name: 'Ing. Milton Berthy Choque Canaviri',
      role: 'Responsable de Servicio Técnico / Propietario',
      ci: '7183920 Tarija',
      img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80'
    },
    commonFaults: ['Sobrecalentamiento', 'Apagado repentino', 'Lentitud generalizada', 'Pasta térmica degradada'],
    timeline: [
      { date: '05/09/2026 09:15', desc: 'Ingreso del equipo: diagnóstico por sobrecalentamiento y lentitud en arranque.' },
      { date: '05/09/2026 11:00', desc: 'Mantenimiento preventivo profundo y aplicación de pasta térmica Arctic MX-4.' },
      { date: '05/09/2026 13:30', desc: 'Formateo limpio, controladores originales y respaldo de datos MD5 verificado.' },
      { date: '05/09/2026 15:00', desc: 'Pruebas térmicas superadas (68°C bajo carga). Constancia y recibo extendido.' }
    ]
  },
  {
    id: 'ST-2026-00483',
    address: 'Ing. Roberto Siles Benítez',
    city: '+591 72981234 • Tarija, Bolivia',
    systemType: 'Asus TUF Gaming F15',
    status: 'In Progress',
    price: 850,
    advancePayment: 400,
    advancePaid: true,
    balancePaid: false,
    fullyPaid: false,
    date: '05 / 09 / 2026, 15:45',
    techs: 1,
    desc: 'Cambio de módulo de pantalla IPS 144Hz y reparación de bisagra izquierda.',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80',
    deviceType: 'Computadora Portátil (Laptop)',
    clientCi: '6128491 Tarija',
    clientPhone: '+591 72981234',
    clientCity: 'Tarija, Bolivia',
    clientAddress: 'Barrio El Molino, Calle Bolívar N° 780',
    serialNumber: 'SN-ASUS9921',
    processorRam: 'AMD Ryzen 7 6800H / 16 GB DDR5',
    storage: 'SSD NVMe 1 TB',
    accessories: 'Cargador 240W original',
    issueReason: 'Pantalla con líneas verticales tras caída leve; bisagra quebrada.',
    diagnosis: 'Panel LCD fisurado internamente, requiere reemplazo de display 144Hz y anclaje de bisagra.',
    finalStatus: 'EN PROCESO — Repuesto en montaje y calibración.',
    assignedTech: {
      name: 'Ing. Milton Berthy Choque Canaviri',
      role: 'Responsable de Servicio Técnico / Propietario',
      ci: '7183920 Tarija',
      img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80'
    },
    commonFaults: ['Pantalla rota', 'Bisagra dañada'],
    timeline: [
      { date: '05/09/2026 15:45', desc: 'Ingreso a taller. Se recibe anticipo de Bs. 400 en POS.' },
      { date: '05/09/2026 17:30', desc: 'Desensamble de carcasa superior y preparación de pantalla nueva.' }
    ]
  },
  {
    id: 'ST-2026-00484',
    address: 'Dra. Marcela Fernández Paz',
    city: '+591 71890123 • Tarija, Bolivia',
    systemType: 'MacBook Air M1 13"',
    status: 'Pending',
    price: 320,
    advancePayment: 0,
    advancePaid: false,
    balancePaid: false,
    fullyPaid: false,
    date: '05 / 09 / 2026, 17:10',
    techs: 1,
    desc: 'Limpieza de conector USB-C, diagnóstico de batería y mantenimiento térmico.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    deviceType: 'Computadora Portátil (Laptop)',
    clientCi: '4829104 Tarija',
    clientPhone: '+591 71890123',
    clientCity: 'Tarija, Bolivia',
    clientAddress: 'Av. Las Américas N° 320',
    serialNumber: 'C02F83LKQ05D',
    processorRam: 'Apple M1 / 8 GB Unified',
    storage: 'SSD 256 GB',
    accessories: 'Cargador MagSafe original',
    issueReason: 'Puerto USB-C izquierdo intermitente y calentamiento en reposo.',
    diagnosis: 'Sulfatación leve en pines de puerto de carga tipo C y pelusa interna.',
    finalStatus: 'PENDIENTE — En espera de aprobación de presupuesto.',
    assignedTech: {
      name: 'Ing. Milton Berthy Choque Canaviri',
      role: 'Responsable de Servicio Técnico / Propietario',
      ci: '7183920 Tarija',
      img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80'
    },
    commonFaults: ['Puerto flojo / intermitente', 'Sobrecalentamiento'],
    timeline: [
      { date: '05/09/2026 17:10', desc: 'Ticket emitido. En cola de diagnóstico por técnico.' }
    ]
  }
];

export const AppProvider = ({ children }) => {
  const [page, setPage] = useState('dashboard');
  const [substates, setSubstates] = useState({
    dashboard: 'moderno',
    pos: 'moderno',
    inventory: 'moderno',
    service_registry: 'moderno',
  });

  const setSubstate = (pageName, value) => {
    setSubstates(prev => ({ ...prev, [pageName]: value }));
  };

  // State arrays driven by Supabase (with offline initial mock fallbacks)
  const [products, setProducts] = useState(initialMockProducts);
  const [tickets, setTickets] = useState(initialMockTickets);
  const [sales, setSales] = useState([]);

  // Custom Settings, Users and Audit states
  const [users, setUsers] = useState([
    { id: 'usr-1', email: 'admin@sistech.com', password: 'admin123', name: 'Alex Sterling', role: 'admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', date: '24/06/2026' },
    { id: 'usr-2', email: 'cajero@sistech.com', password: 'cajero123', name: 'Hamilton Cortez', role: 'cajero', status: 'active', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', date: '24/06/2026' },
    { id: 'usr-3', email: 'tecnico@sistech.com', password: 'tecnico123', name: 'Ing. Milton Berthy Choque Canaviri', role: 'tecnico', status: 'active', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', date: '24/06/2026' }
  ]);
  const [rolePermissions, setRolePermissions] = useState({
    admin: ['dashboard', 'service_registry', 'pos', 'inventory', 'reports', 'settings'],
    cajero: ['dashboard', 'pos'],
    tecnico: ['dashboard', 'service_registry']
  });
  const [shopInfo, setShopInfo] = useState({
    name: 'SERVICIO TÉCNICO ESPECIALIZADO',
    subtitle: 'Soporte Informático, Reparación y Mantenimiento Electrónico',
    activity: 'Servicios Profesionales de Tecnología y Soporte de Hardware/Software',
    ruc: '7183920 Tarija',
    address: 'Av. Principal #1234, Zona Central',
    phone: '+591 70000000',
    email: 'soporte.tecnico@contacto.com',
    warranty: 'Garantía técnica de 60 (sesenta) días calendario a partir de la emisión.',
    weatherLocation: 'Tarija, BO'
  });
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Shift closing, attendance logs and sales returns
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [lastClosingTimestamp, setLastClosingTimestamp] = useState(0);

  // Connection status hooks
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sistech_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Activity logger
  const logActivity = async (action, details, actorOverride = null) => {
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const actorName = actorOverride || (currentUser ? currentUser.name : 'Sistema / Anónimo');
    const actorRole = currentUser ? currentUser.role : 'sistema';
    
    const newLog = {
      id: logId,
      user: actorName,
      role: actorRole,
      action,
      details,
      date: new Date().toLocaleString('es-ES'),
      timestamp: Date.now()
    };
    if (isSupabaseConfigured && supabase) {
      supabase.from('activity_logs').insert(newLog).catch(console.warn);
    }
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const login = (email, password) => {
    const matchedUser = users.find(u => u.email === email && u.password === password);
    if (matchedUser) {
      if (matchedUser.status !== 'active') {
        alert('Esta cuenta ha sido inhabilitada. Contacte al administrador.');
        return false;
      }
      const sessionUser = {
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        avatar: matchedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
      };
      setCurrentUser(sessionUser);
      localStorage.setItem('sistech_user', JSON.stringify(sessionUser));
      
      // Log login activity
      logActivity('Inicio de Sesión', `Usuario ${sessionUser.name} ingresó al sistema.`, sessionUser.name);
      
      // Auto redirect based on allowed screens
      const allowedPages = rolePermissions[sessionUser.role] || [];
      if (sessionUser.role === 'cajero' && allowedPages.includes('pos')) {
        setPage('pos');
      } else if (sessionUser.role === 'tecnico' && allowedPages.includes('service_registry')) {
        setPage('service_registry');
      } else if (allowedPages.includes('dashboard')) {
        setPage('dashboard');
      } else if (allowedPages.length > 0) {
        setPage(allowedPages[0]);
      } else {
        setPage('dashboard');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logActivity('Cierre de Sesión', `Usuario ${currentUser.name} salió del sistema.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('sistech_user');
    setPage('dashboard');
  };

  // Staff CRUD and configuration handlers
  const addUser = async (userData) => {
    const userId = `usr-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: userId,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'cajero',
      status: 'active',
      avatar: userData.avatar || `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1570295999919-56ceb5ecca61', '1494790108377-be9c29b29330'][Math.floor(Math.random() * 3)]}?auto=format&fit=crop&w=80&q=80`,
      date: new Date().toLocaleDateString('es-ES')
    };
    if (isSupabaseConfigured && supabase) {
      supabase.from('users').insert(newUser).catch(console.warn);
    }
    setUsers(prev => [...prev, newUser]);
    logActivity('Crear Usuario', `Se creó el usuario ${newUser.name} con rol ${newUser.role}.`);
  };

  const updateUser = async (userId, fields) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('users').update(fields).eq('id', userId).catch(console.warn);
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...fields } : u));
    const matched = users.find(u => u.id === userId);
    const name = matched ? matched.name : userId;
    logActivity('Editar Usuario', `Se modificó el usuario ${name} (ID: ${userId}).`);
  };

  const deleteUser = async (userId) => {
    const matched = users.find(u => u.id === userId);
    if (isSupabaseConfigured && supabase) {
      supabase.from('users').delete().eq('id', userId).catch(console.warn);
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('Eliminar Usuario', `Se eliminó el usuario ${matched ? matched.name : userId}.`);
  };

  const updateRolePermissions = async (role, windowIds) => {
    const updatedPermissions = { ...rolePermissions, [role]: windowIds };
    if (isSupabaseConfigured && supabase) {
      supabase.from('config').upsert({ id: 'rolePermissions', data: updatedPermissions }).catch(console.warn);
    }
    setRolePermissions(updatedPermissions);
    logActivity('Actualizar Permisos', `Se actualizaron los accesos del rol: ${role}.`);
  };

  const updateShopInfo = async (info) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('config').upsert({ id: 'shopInfo', data: info }).catch(console.warn);
    }
    setShopInfo(info);
    logActivity('Actualizar Empresa', 'Se actualizaron los datos comerciales de la empresa.');
  };

  // Clock In and Clock Out attendance records
  const clockInUser = async (userId, name, role) => {
    const logId = `ATT-${Date.now()}`;
    const newRecord = {
      id: logId,
      userId,
      userName: name,
      userRole: role,
      type: 'entrada',
      date: new Date().toLocaleDateString('es-ES'),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance').insert(mapAttendanceToDb(newRecord)).catch(console.warn);
    }
    setAttendanceLogs(prev => [newRecord, ...prev]);
    logActivity('Reloj Checador', `${name} registró ingreso (Entrada).`, name);
  };

  const clockOutUser = async (userId, name, role) => {
    const logId = `ATT-${Date.now()}`;
    const newRecord = {
      id: logId,
      userId,
      userName: name,
      userRole: role,
      type: 'salida',
      date: new Date().toLocaleDateString('es-ES'),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance').insert(mapAttendanceToDb(newRecord)).catch(console.warn);
    }
    setAttendanceLogs(prev => [newRecord, ...prev]);
    logActivity('Reloj Checador', `${name} registró egreso (Salida).`, name);
  };

  // Arqueo / Cierre Z
  const performCierreZ = async (cierreData) => {
    const cierreId = `CZ-${Date.now()}`;
    const record = {
      id: cierreId,
      ...cierreData,
      timestamp: Date.now(),
      date: new Date().toLocaleString('es-ES')
    };
    if (isSupabaseConfigured && supabase) {
      supabase.from('cierres_caja').insert(mapCierreToDb(record)).catch(console.warn);
    }
    setLastClosingTimestamp(record.timestamp);
    logActivity('Cierre de Caja', `Cierre Z definitivo realizado por ${cierreData.cajero}. Total Efectivo: $${cierreData.efectivoReal.toFixed(2)}.`);
  };

  // Return/Anulacion de venta
  const returnSale = async (saleId) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('sales').delete().eq('id', saleId).catch(console.warn);
    }
    setSales(prev => prev.filter(s => s.id !== saleId));
    logActivity('Devolución de Venta', `Se anuló/devolvió la venta ${saleId}.`);
  };

  // Static Team and Tasks state
  const [onDutyTeam, setOnDutyTeam] = useState([
    { 
      name: 'Ing. Milton Berthy Choque Canaviri', 
      role: 'Responsable de Servicio Técnico / Propietario', 
      ci: '7183920 Tarija',
      img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80' 
    },
    { 
      name: 'Hamilton Cortez', 
      role: 'Cajero / Atención Comercial', 
      ci: '5489001 Tarija',
      img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80' 
    },
    { 
      name: 'Alex Sterling', 
      role: 'Administrador General', 
      ci: '7123990 Tarija',
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' 
    }
  ]);

  const [urgentTasks, setUrgentTasks] = useState([
    { date: '30 Nov 2024', desc: 'Safety inspection on site 04', urgent: true },
    { date: '24 Dec 2024', desc: 'Emergency generator service', urgent: true },
    { date: '24 Oct 2024', desc: 'Client feedback meeting', urgent: false },
    { date: '24 Nov 2024', desc: 'Technician debriefing', urgent: false },
    { date: '24 Nov 2024', desc: 'Inventory audit report', urgent: false }
  ]);

  // Supabase Initial Fetch & Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Fetch initial data from Supabase PostgreSQL
    const fetchSupabaseData = async () => {
      try {
        const [
          { data: prods },
          { data: tix },
          { data: sls },
          { data: usrs },
          { data: cfg },
          { data: logs },
          { data: att },
          { data: closings }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('tickets').select('*'),
          supabase.from('sales').select('*'),
          supabase.from('users').select('*'),
          supabase.from('config').select('*'),
          supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100),
          supabase.from('attendance').select('*').order('timestamp', { ascending: false }).limit(100),
          supabase.from('cierres_caja').select('*').order('timestamp', { ascending: false }).limit(20)
        ]);

        if (prods && prods.length > 0) {
          setProducts(prods.map(mapProductFromDb));
        } else {
          initialMockProducts.forEach(p => supabase.from('products').upsert(mapProductToDb(p)).catch(console.warn));
          setProducts(initialMockProducts);
        }

        if (tix && tix.length > 0) {
          setTickets(tix.map(mapTicketFromDb).sort((a, b) => b.id.localeCompare(a.id)));
        } else {
          initialMockTickets.forEach(t => supabase.from('tickets').upsert(mapTicketToDb(t)).catch(console.warn));
          setTickets(initialMockTickets);
        }

        if (sls && sls.length > 0) setSales(sls.map(mapSaleFromDb));
        if (usrs && usrs.length > 0) setUsers(usrs);
        if (logs && logs.length > 0) setActivityLogs(logs);
        if (att && att.length > 0) setAttendanceLogs(att.map(mapAttendanceFromDb));
        if (closings && closings.length > 0) setLastClosingTimestamp(closings[0].timestamp);

        if (cfg) {
          cfg.forEach(row => {
            if (row.id === 'rolePermissions' && row.data) {
              setRolePermissions(row.data);
            } else if (row.id === 'shopInfo' && row.data) {
              setShopInfo(row.data);
            }
          });
        }
      } catch (err) {
        console.warn('Error al cargar datos iniciales desde Supabase:', err);
      }
    };

    fetchSupabaseData();

    // 2. Realtime Subscriptions for live collaboration
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = mapProductFromDb(payload.new);
          setProducts(prev => [item, ...prev.filter(p => p.id !== item.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const item = mapProductFromDb(payload.new);
          setProducts(prev => prev.map(p => p.id === item.id ? item : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = mapTicketFromDb(payload.new);
          setTickets(prev => [item, ...prev.filter(t => t.id !== item.id)].sort((a, b) => b.id.localeCompare(a.id)));
        } else if (payload.eventType === 'UPDATE') {
          const item = mapTicketFromDb(payload.new);
          setTickets(prev => prev.map(t => t.id === item.id ? item : t));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = mapSaleFromDb(payload.new);
          setSales(prev => [item, ...prev.filter(s => s.id !== item.id)]);
        } else if (payload.eventType === 'DELETE') {
          setSales(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [...prev.filter(u => u.id !== payload.new.id), payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, (payload) => {
        if (payload.new) {
          if (payload.new.id === 'rolePermissions' && payload.new.data) setRolePermissions(payload.new.data);
          if (payload.new.id === 'shopInfo' && payload.new.data) setShopInfo(payload.new.data);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setActivityLogs(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, (payload) => {
        setAttendanceLogs(prev => [mapAttendanceFromDb(payload.new), ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cierres_caja' }, (payload) => {
        setLastClosingTimestamp(payload.new.timestamp);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // POS Cart State
  const [cart, setCart] = useState([]);

  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [lastCreatedTicket, setLastCreatedTicket] = useState(null);
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null);

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id);
      if (idx !== -1) {
        return prev.map((item, i) => i === idx ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost || (product.price * 0.6),
        qty: 1,
        variant: product.category,
        image: product.image
      }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id, qty) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Perform checkout writing directly to Supabase & State
  const checkoutCart = async (paymentMethod, discountAmount = 0) => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const tax = Math.max(0, subtotal - discountAmount) * 0.08;
    const total = Math.max(0, subtotal - discountAmount + tax);
    const receiptId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const receipt = {
      id: receiptId,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod,
      cashierName: currentUser?.name || 'Hamilton Cortez',
      cashierId: currentUser?.email || 'cajero@sistech.com',
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    
    try {
      if (isSupabaseConfigured && supabase) {
        supabase.from('sales').insert(mapSaleToDb(receipt)).catch(console.warn);
      }
      logActivity('Venta POS', `Venta completada ${receiptId} por $${total.toFixed(2)}.`);

      // Update Service Tickets if the cart contains a service payment
      for (const cartItem of cart) {
        if (cartItem.isServicePayment && cartItem.serviceTicketId) {
          const ticketId = cartItem.serviceTicketId;
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket) {
            const updateFields = {};
            let timelineMsg = '';
            
            const paymentRecord = {
              amount: cartItem.price,
              date: new Date().toLocaleString('es-ES'),
              paymentMethod,
              cashierName: currentUser?.name || 'Hamilton Cortez',
              type: cartItem.paymentType,
              receiptId
            };
            
            const existingHistory = ticket.paymentHistory || [];
            updateFields.paymentHistory = [...existingHistory, paymentRecord];

            if (cartItem.paymentType === 'advance') {
              updateFields.advancePaid = true;
              updateFields.advancePayment = cartItem.price;
              timelineMsg = `Cobro de Adelanto de $${cartItem.price.toFixed(2)} registrado en POS (Recibo: ${receiptId}).`;
            } else if (cartItem.paymentType === 'balance') {
              updateFields.balancePaid = true;
              updateFields.fullyPaid = true;
              timelineMsg = `Cobro de Saldo de $${cartItem.price.toFixed(2)} registrado en POS (Recibo: ${receiptId}).`;
            }
            
            await updateServiceTicket(ticketId, ticket.status, timelineMsg);
            if (isSupabaseConfigured && supabase) {
              supabase.from('tickets').update(mapTicketToDb(updateFields)).eq('id', ticketId).catch(console.warn);
            }
            setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, ...updateFields } : t));
          }
        }
      }

      for (const cartItem of cart) {
        const prod = products.find(p => p.id === cartItem.id);
        if (prod) {
          const newStock = Math.max(0, prod.stock - cartItem.qty);
          const newStatus = newStock === 0 ? 'Out of Stock' : (newStock < 15 ? 'Low Stock' : 'In Stock');
          
          if (isSupabaseConfigured && supabase) {
            supabase.from('products').update({
              stock: newStock,
              status: newStatus
            }).eq('id', cartItem.id).catch(console.warn);
          }
          setProducts(prevProducts =>
            prevProducts.map(p => p.id === cartItem.id ? { ...p, stock: newStock, status: newStatus } : p)
          );
        }
      }
      setSales(prevSales => [receipt, ...prevSales]);
    } catch (e) {
      console.warn('Error durante el checkout:', e);
    } finally {
      setLastSaleReceipt(receipt);
      clearCart();
      setSubstate('pos', 'success');
    }
  };

  const addServicePaymentToCart = (ticket, paymentType) => {
    const isAdvance = paymentType === 'advance';
    const amount = isAdvance 
      ? (parseFloat(ticket.advancePayment) || 0) 
      : (parseFloat(ticket.price) - (parseFloat(ticket.advancePayment) || 0));
    
    const cartItemId = `SVC-${ticket.id}-${paymentType}`;
    const cartItemName = `Servicio ${ticket.id} - ${isAdvance ? 'Pago de Adelanto' : 'Saldo Restante'}`;
    
    setCart([
      {
        id: cartItemId,
        name: cartItemName,
        price: amount,
        cost: 0,
        qty: 1,
        variant: 'Soporte Técnico',
        image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=150&q=80',
        isServicePayment: true,
        serviceTicketId: ticket.id,
        paymentType: paymentType
      }
    ]);
    setPage('pos');
    setSubstate('pos', 'moderno');
  };

  // Add inventory product directly to Supabase & State
  const addInventoryProduct = async (product) => {
    const productId = `SKU-${Math.floor(1000 + Math.random() * 9000)}-${product.category.substring(0, 1).toUpperCase()}`;
    const newProd = {
      id: productId,
      name: product.name,
      category: product.category,
      subCategory: `${product.category} / General`,
      stock: parseInt(product.stock, 10) || 0,
      price: parseFloat(product.price) || 0,
      cost: parseFloat(product.cost) || (parseFloat(product.price) * 0.6),
      status: parseInt(product.stock, 10) > 0 ? 'In Stock' : 'Out of Stock',
      desc: product.desc || 'No description provided.',
      image: product.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80'
    };

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').insert(mapProductToDb(newProd)).catch(console.warn);
    }
    setProducts(prev => [newProd, ...prev]);
    logActivity('Añadir Producto', `Se añadió el producto SKU ${newProd.id} (${newProd.name}) al inventario.`);
  };

  // Add service ticket directly to Supabase & State
  const addServiceTicket = async (ticketData) => {
    const nextNum = String(Math.floor(100 + Math.random() * 900));
    const newId = ticketData.id || `ST-2026-00${nextNum}`;
    const ticket = {
      id: newId,
      address: ticketData.customerName || 'Lic. Carlos Eduardo Mendoza Ramos',
      city: ticketData.phone ? `${ticketData.phone} • ${ticketData.city || 'Tarija, Bolivia'}` : '+591 71234567 • Tarija, Bolivia',
      systemType: ticketData.systemType || `${ticketData.brand || 'Lenovo'} ${ticketData.model || 'ThinkPad E14 Gen 4'}`.trim(),
      status: ticketData.status || 'Pending',
      price: parseFloat(ticketData.estimate) || 450,
      advancePayment: parseFloat(ticketData.advancePayment) || 0,
      advancePaid: (parseFloat(ticketData.advancePayment) || 0) > 0 ? false : true,
      balancePaid: false,
      fullyPaid: false,
      paymentHistory: [],
      date: ticketData.date || new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + `, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      techs: 1,
      desc: ticketData.issue || ticketData.diagnosis || 'Obstrucción por polvo en disipador, pasta térmica degradada y optimización integral.',
      commonFaults: ticketData.commonFaults || ['Sobrecalentamiento', 'Lentitud generalizada'],
      image: ticketData.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
      clientCi: ticketData.ciNit || ticketData.clientCi || '5489214 Tarija',
      clientPhone: ticketData.phone || '+591 71234567',
      clientCity: ticketData.city || 'Tarija, Bolivia',
      clientAddress: ticketData.clientAddress || 'Barrio San Martín, Calle Ingavi N° 450',
      deviceType: ticketData.deviceType || 'Computadora Portátil (Laptop)',
      brandModel: ticketData.brandModel || (ticketData.brand ? `${ticketData.brand} ${ticketData.model}` : 'Lenovo ThinkPad E14 Gen 4'),
      serialNumber: ticketData.serialNumber || 'PF-3X9K82',
      processorRam: ticketData.processorRam || 'Intel Core i7-1255U / 16 GB DDR4',
      storage: ticketData.storage || 'SSD NVMe M.2 512 GB',
      accessories: ticketData.accessories || 'Cargador original USB-C 65W, funda protectora',
      issueReason: ticketData.issue || 'Equipo presenta sobrecalentamiento, apagado repentino y lentitud generalizada en arranque del SO.',
      diagnosis: ticketData.diagnosis || 'Obstrucción por polvo en disipador, pasta térmica degradada, sectores lógicos inconsistentes en sistema operativo y necesidad de mantenimiento preventivo integral y optimización.',
      finalStatus: ticketData.finalStatus || 'OPERATIVO AL 100% — Pruebas de estrés térmico superadas (temperatura máx. 68°C bajo carga). Sistema operativo reinstalado y actualizado con respaldo de datos intacto.',
      serviceItems: ticketData.serviceItems || [
        { item: 1, desc: 'Mantenimiento preventivo profundo: desensamble, limpieza ultrasónica de ventilador, cambio de pasta térmica (Arctic MX-4) y pads.', qty: 1, unitPrice: 180, subtotal: 180 },
        { item: 2, desc: 'Optimización de software, formateo limpio, controladores originales y respaldo de datos con verificación MD5.', qty: 1, unitPrice: 150, subtotal: 150 },
        { item: 3, desc: 'Licenciamiento antivirus corporativo con protección proactiva y revisión perimetral.', qty: 1, unitPrice: 120, subtotal: 120 }
      ],
      assignedTech: ticketData.assignedTech || onDutyTeam[0],
      timeline: ticketData.timeline || [
        { date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), desc: 'Ticket registrado en taller. Dispositivo recibido para diagnóstico.' }
      ]
    };

    if (isSupabaseConfigured && supabase) {
      supabase.from('tickets').insert(mapTicketToDb(ticket)).catch(console.warn);
    }
    setTickets(prev => [ticket, ...prev].sort((a, b) => b.id.localeCompare(a.id)));
    setLastCreatedTicket(ticket);
    logActivity('Nuevo Ticket', `Se registró orden de soporte ${newId} para ${ticket.address}.`);
    setSubstate('service_registry', 'success');
  };

  // Update service ticket timeline and status in Supabase & State
  const updateServiceTicket = async (ticketId, newStatus, newTimelineEvent, assignedTech = null) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const updatedTimeline = [...ticket.timeline];
    if (newTimelineEvent) {
      updatedTimeline.push({
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        desc: newTimelineEvent
      });
    }

    const updateFields = {
      status: newStatus,
      timeline: updatedTimeline
    };

    if (assignedTech) {
      updateFields.assignedTech = assignedTech;
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('tickets').update(mapTicketToDb(updateFields)).eq('id', ticketId).catch(console.warn);
    }
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updateFields } : t));
    logActivity('Actualizar Ticket', `Se actualizó el ticket ${ticketId} a estado ${newStatus}.`);
  };

  return (
    <AppContext.Provider value={{
      page,
      setPage,
      substates,
      setSubstate,
      products,
      tickets,
      sales,
      onDutyTeam,
      setOnDutyTeam,
      urgentTasks,
      setUrgentTasks,
      cart,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      checkoutCart,
      selectedInventoryItem,
      setSelectedInventoryItem,
      addInventoryProduct,
      addServiceTicket,
      updateServiceTicket,
      lastCreatedTicket,
      lastSaleReceipt,
      isOnline,
      currentUser,
      login,
      logout,
      users,
      rolePermissions,
      shopInfo,
      activityLogs,
      logActivity,
      addUser,
      updateUser,
      deleteUser,
      updateRolePermissions,
      updateShopInfo,
      attendanceLogs,
      lastClosingTimestamp,
      clockInUser,
      clockOutUser,
      performCierreZ,
      returnSale,
      addServicePaymentToCart
    }}>
      {children}
    </AppContext.Provider>
  );
};
