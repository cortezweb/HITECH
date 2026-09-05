import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from '../config/supabase';

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
    id: 'WO-1094',
    address: '165 Belmont Drive',
    city: 'Parowan, UT',
    systemType: 'Thermostat Fix',
    status: 'Completed',
    price: 450,
    date: 'Nov 16 2024, 09:00',
    techs: 1,
    desc: 'Fix smart home thermostat interface integration and wall mounting.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhhV-nHsqn-fWKVJyZgKFDh0anaN494kDXs5DGtpxkQvF3HqRr_55fuxCr6DpZ5xm929gPa9Jhy2MDEwTn7dKdYbVXWcdAO9i3A3D-G1uL5SExHa4CaWk2g0TBol9rx30e73P8qWYbWFOhEfN3Vj6pEa1XxaEEzUu-AGt_958ukVZzajqSk9HlcQBS80jEZSZp-kOzM3lqjULvoqtu7U0UGj-iWpkij3tDYOsyHJ5GnubvC3AOz9JyZOLcb4OZ9yuMDpUl5rS7HvY',
    timeline: [
      { date: 'Nov 16, 2024', desc: 'Interface fixed and client signed off' }
    ]
  },
  {
    id: 'WO-1093',
    address: '47 Spruce Drive',
    city: 'Quantico, VA',
    systemType: 'Solar Panel',
    status: 'Pending',
    price: 1250,
    date: 'Nov 15 2024, 08:00',
    techs: 1,
    desc: 'Electrical panel wiring and circuits check, testing with a multimeter.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7uXpF17MuZpuy13gWeZ3RjPUI_R-ewg5V4DToFLQiGk0O0gJBQh80vyQN6y6XUKTq301MjAM6D583F_SJvB2_7xLpVQHlhU3h4zfxm2Yj2nP18Jf0NdI5ftm8BwomPoZGJohghQpCRU-ilS9nSmir0VtICS6KzZwhgop-2OL7d38d6OoqNmXPHVzfZ2MdmUj-nBHUITE7frvwz80AKdgreBhqrKNJkXs7Kh7LxeN5KF7JHK7eNl77EihHRp5WuKPoNCDysML1c4U',
    timeline: [
      { date: 'Nov 15, 2024', desc: 'Dispatched ticket and diagnostic started' }
    ]
  },
  {
    id: 'WO-1092',
    address: '319 Haul Road',
    city: 'Glenrock, WY 12345',
    systemType: 'HVAC Central',
    status: 'In Progress',
    price: 5750,
    date: 'Nov 18 2024, 17:00',
    techs: 2,
    desc: 'Installation of the new industrial air conditioning system and testing QA on coolant lines.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFPeDHWNHEGUXGNcZrvmZtdtberHqLbCSv68evZEJ_ZOkDlCuHwsCI4iuNofeeBlwEA7B9aIDzwOg65z60gTlnDmApJPhlTrpf8WUM-y8DukTqjB6Yr9WQPDvwFUuXYdFVSCcsXxGNPBOlLrpeKecYytyaDwYXIEbn95clm2fHzjbnyWP9MYuox2K8rgCaxxp_MLIu7BUe4ZJTwat8vtXxvx1ybHOZnw56tLYLO4CNaDEYmJWv5h-Tco6n-lQmhVQTwDMF1yFyeRQ',
    timeline: [
      { date: 'Nov 17, 2024', desc: 'Installation of the new industrial air conditioning system' },
      { date: 'Nov 17, 2024', desc: 'Testing and quality assurance on coolant lines' }
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

  // State arrays driven by Firebase Firestore
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sales, setSales] = useState([]);

  // Custom Settings, Users and Audit states
  const [users, setUsers] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({
    admin: ['dashboard', 'service_registry', 'pos', 'inventory', 'reports', 'settings'],
    cajero: ['dashboard', 'pos'],
    tecnico: ['dashboard', 'service_registry']
  });
  const [shopInfo, setShopInfo] = useState({
    name: 'HITECH POS',
    ruc: '20748392018',
    address: 'Av. Aviación 1482, San Borja',
    phone: '(01) 224-8594 / 942-597-869',
    warranty: 'Garantía de servicio: 30 días en mano de obra. No cubre daños físicos ni líquidos.',
    weatherLocation: 'Lima, PE'
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
    try {
      await setDoc(doc(db, 'activity_logs', logId), newLog);
    } catch (e) {
      console.warn('Fallback local para bitácora de auditoría:', e);
      setActivityLogs(prev => [newLog, ...prev]);
    }
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
    try {
      await setDoc(doc(db, 'users', userId), newUser);
      logActivity('Crear Usuario', `Se creó el usuario ${newUser.name} con rol ${newUser.role}.`);
    } catch (e) {
      console.error('Error al agregar usuario:', e);
    }
  };

  const updateUser = async (userId, fields) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('users').update(fields).eq('id', userId).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'users', userId), fields, { merge: true });
      const matched = users.find(u => u.id === userId);
      const name = matched ? matched.name : userId;
      logActivity('Editar Usuario', `Se modificó el usuario ${name} (ID: ${userId}).`);
    } catch (e) {
      console.error('Error al actualizar usuario:', e);
    }
  };

  const deleteUser = async (userId) => {
    const matched = users.find(u => u.id === userId);
    if (isSupabaseConfigured && supabase) {
      supabase.from('users').delete().eq('id', userId).catch(console.warn);
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      logActivity('Eliminar Usuario', `Se eliminó el usuario ${matched ? matched.name : userId}.`);
    } catch (e) {
      console.error('Error al eliminar usuario:', e);
    }
  };

  const updateRolePermissions = async (role, windowIds) => {
    const updatedPermissions = { ...rolePermissions, [role]: windowIds };
    if (isSupabaseConfigured && supabase) {
      supabase.from('config').upsert({ id: 'rolePermissions', data: updatedPermissions }).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'config', 'rolePermissions'), updatedPermissions);
      logActivity('Actualizar Permisos', `Se actualizaron los accesos del rol: ${role}.`);
    } catch (e) {
      console.error('Error al actualizar permisos:', e);
      setRolePermissions(updatedPermissions);
    }
  };

  const updateShopInfo = async (info) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('config').upsert({ id: 'shopInfo', data: info }).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'config', 'shopInfo'), info);
      logActivity('Actualizar Empresa', 'Se actualizaron los datos comerciales de la empresa.');
    } catch (e) {
      console.error('Error al actualizar datos comerciales:', e);
      setShopInfo(info);
    }
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
      supabase.from('attendance').insert(newRecord).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'attendance', logId), newRecord);
      logActivity('Reloj Checador', `${name} registró ingreso (Entrada).`, name);
    } catch (e) {
      console.error('Error al registrar entrada:', e);
    }
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
      supabase.from('attendance').insert(newRecord).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'attendance', logId), newRecord);
      logActivity('Reloj Checador', `${name} registró egreso (Salida).`, name);
    } catch (e) {
      console.error('Error al registrar salida:', e);
    }
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
      supabase.from('cierres_caja').insert(record).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'cierres_caja', cierreId), record);
      setLastClosingTimestamp(record.timestamp);
      logActivity('Cierre de Caja', `Cierre Z definitivo realizado por ${cierreData.cajero}. Total Efectivo: $${cierreData.efectivoReal.toFixed(2)}.`);
    } catch (e) {
      console.error('Error al guardar cierre de caja:', e);
    }
  };

  // Return/Anulacion de venta
  const returnSale = async (saleId) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from('sales').delete().eq('id', saleId).catch(console.warn);
    }
    try {
      await deleteDoc(doc(db, 'sales', saleId));
      logActivity('Devolución de Venta', `Se anuló/devolvió la venta ${saleId}.`);
    } catch (e) {
      console.error('Error al devolver la venta:', e);
      setSales(prev => prev.filter(s => s.id !== saleId));
    }
  };

  // Static Team and Tasks state
  const [onDutyTeam, setOnDutyTeam] = useState([
    { name: 'Deanna Annis', role: 'Lead Technician', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWS-DL1itB-ehhEbpvCyARjpoyIsDlkB4hC6HkXD7cUteNw_Zdlpgh3xmrIpweVJ9tchVs5Z1LCK6Dv2Wf3WSzi_YpYLHz1psx6dvItGBM6nwbhQUTmgGzDpw43VZxnklVUNAKGe4xlYolqmYpEyUVNOhEYr8oxhctdg-Zyw008hlgS3uEdRBq3WwvNqrgvrYNbM0xqHgp7MSdcbODvuB0Ag5Q47l51P27XrkcTN7jLqR0WOkQuX6Y4bVViFIwUyaazfmu-t8Bamo' },
    { name: 'Andrea Willis', role: 'Systems Engineer', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwU3dL4nOZM7mYrt8Advhy9F6hRwhQDbiXDQncVbshASj_HtJvrpXJMS7VZLMidW8L2lu75u4wT075vjpLZAm-cCEMIQGufjoZ7lsS2MnD9ciR6aaB2LhGeHcfFEZ3HsEZrvtx1vm_JW19VjFtCXbMaIVMnopC-924l-LUb3doED0GPaDOJiC2iR8RC5-CRddF7DG-6OozmHS4KfJVopUQa-voJJz1WhW-BinhSEPz794_oQwTE036DjJaNtcxiAeU382CrMb7BQo' },
    { name: 'Brent Rodrigues', role: 'Inventory Specialist', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEHAcsQkSq-XpI2d6XOc-7iOtomUETH1UpjTV8pe4IAh3loaesmtSGwC5TnTximhqRXuI64lGMnqVQeJnHWc4pBtkET4i5HJVAqx8_wevfhSRIiB2G4P8-mKzebRjXsQTzPB6qIyl-iSxgO3iE7B6uZQQfAIAvbltg697t3oqMEnwg7OuJ6hJlqrOfvfQA-PoSY9LKMLZESfuZc2OJkZFOzPJk2u0-nu3a8SjaOccOMIooghhYHfCJI_k3uVQcSNOtUc_A8m0r3D4' }
  ]);

  const [urgentTasks, setUrgentTasks] = useState([
    { date: '30 Nov 2024', desc: 'Safety inspection on site 04', urgent: true },
    { date: '24 Dec 2024', desc: 'Emergency generator service', urgent: true },
    { date: '24 Oct 2024', desc: 'Client feedback meeting', urgent: false },
    { date: '24 Nov 2024', desc: 'Technician debriefing', urgent: false },
    { date: '24 Nov 2024', desc: 'Inventory audit report', urgent: false }
  ]);

  // Firestore Listeners & Database Seeding
  useEffect(() => {
    // 1. Listen and seed Products
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (snapshot.empty) {
          initialMockProducts.forEach(async (product) => {
            try {
              await setDoc(doc(db, 'products', product.id), product);
            } catch (e) {
              console.error('Failed to seed product:', e);
            }
          });
        } else {
          const prodList = [];
          snapshot.forEach((d) => {
            prodList.push(d.data());
          });
          setProducts(prodList);
        }
      },
      (error) => {
        console.warn('Firestore products listener blocked/failed (using local fallback):', error);
        setProducts(initialMockProducts);
      }
    );

    // 2. Listen and seed Service Tickets
    const unsubTickets = onSnapshot(
      collection(db, 'tickets'),
      (snapshot) => {
        if (snapshot.empty) {
          initialMockTickets.forEach(async (ticket) => {
            try {
              await setDoc(doc(db, 'tickets', ticket.id), ticket);
            } catch (e) {
              console.error('Failed to seed ticket:', e);
            }
          });
        } else {
          const ticketList = [];
          snapshot.forEach((d) => {
            ticketList.push(d.data());
          });
          ticketList.sort((a, b) => b.id.localeCompare(a.id));
          setTickets(ticketList);
        }
      },
      (error) => {
        console.warn('Firestore tickets listener blocked/failed (using local fallback):', error);
        setTickets(initialMockTickets);
      }
    );

    // 3. Listen to Sales Receipts (needed for Dashboard charts)
    const unsubSales = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        const salesList = [];
        snapshot.forEach((d) => {
          salesList.push(d.data());
        });
        setSales(salesList);
      },
      (error) => {
        console.warn('Firestore sales listener blocked/failed (using local fallback):', error);
        setSales([]);
      }
    );

    // 4. Listen and seed Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          const initialMockUsers = [
            { id: 'usr-1', email: 'admin@sistech.com', password: 'admin123', name: 'Alex Sterling', role: 'admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', date: new Date().toLocaleDateString('es-ES') },
            { id: 'usr-2', email: 'cajero@sistech.com', password: 'cajero123', name: 'Hamilton Cortez', role: 'cajero', status: 'active', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', date: new Date().toLocaleDateString('es-ES') },
            { id: 'usr-3', email: 'tecnico@sistech.com', password: 'tecnico123', name: 'Deanna Annis', role: 'tecnico', status: 'active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', date: new Date().toLocaleDateString('es-ES') }
          ];
          initialMockUsers.forEach(async (usr) => {
            try {
              await setDoc(doc(db, 'users', usr.id), usr);
            } catch (e) {
              console.error('Failed to seed user:', e);
            }
          });
        } else {
          const usrList = [];
          snapshot.forEach((d) => {
            usrList.push(d.data());
          });
          setUsers(usrList);
        }
      },
      (error) => {
        console.warn('Firestore users listener blocked/failed:', error);
        setUsers([
          { id: 'usr-1', email: 'admin@sistech.com', password: 'admin123', name: 'Alex Sterling', role: 'admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', date: '24/06/2026' },
          { id: 'usr-2', email: 'cajero@sistech.com', password: 'cajero123', name: 'Hamilton Cortez', role: 'cajero', status: 'active', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', date: '24/06/2026' },
          { id: 'usr-3', email: 'tecnico@sistech.com', password: 'tecnico123', name: 'Deanna Annis', role: 'tecnico', status: 'active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', date: '24/06/2026' }
        ]);
      }
    );

    // 5. Listen and seed Config
    const unsubConfig = onSnapshot(
      collection(db, 'config'),
      (snapshot) => {
        if (snapshot.empty) {
          setDoc(doc(db, 'config', 'rolePermissions'), {
            admin: ['dashboard', 'service_registry', 'pos', 'inventory', 'reports', 'settings'],
            cajero: ['dashboard', 'pos'],
            tecnico: ['dashboard', 'service_registry']
          });
          setDoc(doc(db, 'config', 'shopInfo'), {
            name: 'HITECH POS',
            ruc: '20748392018',
            address: 'Av. Aviación 1482, San Borja',
            phone: '(01) 224-8594 / 942-597-869',
            warranty: 'Garantía de servicio: 30 días en mano de obra. No cubre daños físicos ni líquidos.',
            weatherLocation: 'Lima, PE'
          });
        } else {
          snapshot.forEach((d) => {
            if (d.id === 'rolePermissions') {
              const perms = d.data();
              if (perms.admin && !perms.admin.includes('reports')) {
                perms.admin.push('reports');
                setDoc(doc(db, 'config', 'rolePermissions'), perms, { merge: true }).catch(err =>
                  console.warn('Fallo al auto-reparar permisos de reporte en Firestore:', err)
                );
              }
              setRolePermissions(perms);
            } else if (d.id === 'shopInfo') {
              setShopInfo(d.data());
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore config listener blocked/failed:', error);
      }
    );

    // 6. Listen activity logs
    const unsubLogs = onSnapshot(
      collection(db, 'activity_logs'),
      (snapshot) => {
        const logList = [];
        snapshot.forEach((d) => {
          logList.push(d.data());
        });
        logList.sort((a, b) => b.timestamp - a.timestamp);
        setActivityLogs(logList);
      },
      (error) => {
        console.warn('Firestore logs listener blocked/failed:', error);
      }
    );

    // 7. Listen attendance logs
    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push(d.data());
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        setAttendanceLogs(list);
      },
      (error) => {
        console.warn('Firestore attendance listener failed:', error);
      }
    );

    // 8. Listen cierres caja
    const unsubCierres = onSnapshot(
      collection(db, 'cierres_caja'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push(d.data());
        });
        if (list.length > 0) {
          list.sort((a, b) => b.timestamp - a.timestamp);
          setLastClosingTimestamp(list[0].timestamp);
        }
      },
      (error) => {
        console.warn('Firestore cierres_caja listener failed:', error);
      }
    );

    return () => {
      unsubProducts();
      unsubTickets();
      unsubSales();
      unsubUsers();
      unsubConfig();
      unsubLogs();
      unsubAttendance();
      unsubCierres();
    };
  }, []);

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

        if (prods && prods.length > 0) setProducts(prods);
        if (tix && tix.length > 0) setTickets(tix.sort((a, b) => b.id.localeCompare(a.id)));
        if (sls && sls.length > 0) setSales(sls);
        if (usrs && usrs.length > 0) setUsers(usrs);
        if (logs && logs.length > 0) setActivityLogs(logs);
        if (att && att.length > 0) setAttendanceLogs(att);
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
          setProducts(prev => [payload.new, ...prev.filter(p => p.id !== payload.new.id)]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => [payload.new, ...prev.filter(t => t.id !== payload.new.id)].sort((a, b) => b.id.localeCompare(a.id)));
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSales(prev => [payload.new, ...prev.filter(s => s.id !== payload.new.id)]);
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
        setAttendanceLogs(prev => [payload.new, ...prev]);
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

  // Perform checkout writing directly to Cloud Firestore
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
        supabase.from('sales').insert(receipt).catch(console.warn);
      }
      await setDoc(doc(db, 'sales', receiptId), receipt);
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
              supabase.from('tickets').update(updateFields).eq('id', ticketId).catch(console.warn);
            }
            await updateDoc(doc(db, 'tickets', ticketId), updateFields);
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
          await updateDoc(doc(db, 'products', cartItem.id), {
            stock: newStock,
            status: newStatus
          });
        }
      }
    } catch (e) {
      console.warn('Advertencia de base de datos durante el checkout (usando fallback local):', e);
      
      // Local fallback for service payment updates
      for (const cartItem of cart) {
        if (cartItem.isServicePayment && cartItem.serviceTicketId) {
          const ticketId = cartItem.serviceTicketId;
          setTickets(prevTickets => prevTickets.map(t => {
            if (t.id === ticketId) {
              const paymentRecord = {
                amount: cartItem.price,
                date: new Date().toLocaleString('es-ES'),
                paymentMethod,
                cashierName: currentUser?.name || 'Hamilton Cortez',
                type: cartItem.paymentType,
                receiptId
              };
              const existingHistory = t.paymentHistory || [];
              const updatedHistory = [...existingHistory, paymentRecord];
              
              const updatedTimeline = [...t.timeline, {
                date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                desc: cartItem.paymentType === 'advance' 
                  ? `Cobro de Adelanto de $${cartItem.price.toFixed(2)} registrado localmente.`
                  : `Cobro de Saldo de $${cartItem.price.toFixed(2)} registrado localmente.`
              }];

              if (cartItem.paymentType === 'advance') {
                return { ...t, advancePaid: true, advancePayment: cartItem.price, paymentHistory: updatedHistory, timeline: updatedTimeline };
              } else {
                return { ...t, balancePaid: true, fullyPaid: true, paymentHistory: updatedHistory, timeline: updatedTimeline };
              }
            }
            return t;
          }));
        }
      }

      // Local fallback for stock deduction
      setProducts(prevProducts => 
        prevProducts.map(p => {
          const cartItem = cart.find(c => c.id === p.id);
          if (cartItem) {
            const newStock = Math.max(0, p.stock - cartItem.qty);
            const newStatus = newStock === 0 ? 'Out of Stock' : (newStock < 15 ? 'Low Stock' : 'In Stock');
            return { ...p, stock: newStock, status: newStatus };
          }
          return p;
        })
      );
      
      // Local fallback for sales tracking
      setSales(prevSales => [...prevSales, receipt]);
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

  // Add inventory product directly to Cloud Firestore & Supabase
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
      supabase.from('products').insert(newProd).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'products', productId), newProd);
      logActivity('Añadir Producto', `Se añadió el producto SKU ${newProd.id} (${newProd.name}) al inventario.`);
    } catch (e) {
      console.error('Error al agregar producto al inventario:', e);
    }
  };

  // Add service ticket directly to Cloud Firestore & Supabase
  const addServiceTicket = async (ticketData) => {
    const newId = ticketData.id || `WO-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticket = {
      id: newId,
      address: ticketData.customerName,
      city: ticketData.phone,
      systemType: ticketData.systemType || `${ticketData.brand} ${ticketData.model}`,
      status: ticketData.status || 'Pending',
      price: parseFloat(ticketData.estimate) || 0,
      advancePayment: parseFloat(ticketData.advancePayment) || 0,
      advancePaid: (parseFloat(ticketData.advancePayment) || 0) > 0 ? false : true,
      balancePaid: false,
      fullyPaid: false,
      paymentHistory: [],
      date: ticketData.date || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().getHours()}:${new Date().getMinutes()}`,
      techs: 1,
      desc: ticketData.issue || 'Diagnostic pending.',
      commonFaults: ticketData.commonFaults || [],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7uXpF17MuZpuy13gWeZ3RjPUI_R-ewg5V4DToFLQiGk0O0gJBQh80vyQN6y6XUKTq301MjAM6D583F_SJvB2_7xLpVQHlhU3h4zfxm2Yj2nP18Jf0NdI5ftm8BwomPoZGJohghQpCRU-ilS9nSmir0VtICS6KzZwhgop-2OL7d38d6OoqNmXPHVzfZ2MdmUj-nBHUITE7frvwz80AKdgreBhqrKNJkXs7Kh7LxeN5KF7JHK7eNl77EihHRp5WuKPoNCDysML1c4U',
      timeline: ticketData.timeline || [
        { date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), desc: 'Ticket registrado. Dispositivo recibido en sucursal.' }
      ]
    };

    if (isSupabaseConfigured && supabase) {
      supabase.from('tickets').insert(ticket).catch(console.warn);
    }
    try {
      await setDoc(doc(db, 'tickets', newId), ticket);
      setLastCreatedTicket(ticket);
      logActivity('Nuevo Ticket', `Se registró orden de soporte ${newId} para ${ticket.address}.`);
      setSubstate('service_registry', 'success');
    } catch (e) {
      console.error('Error al registrar ticket de servicio:', e);
    }
  };

  // Update service ticket timeline and status in Cloud Firestore & Supabase
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
      supabase.from('tickets').update(updateFields).eq('id', ticketId).catch(console.warn);
    }
    try {
      await updateDoc(doc(db, 'tickets', ticketId), updateFields);
      logActivity('Actualizar Ticket', `Se actualizó el ticket ${ticketId} a estado ${newStatus}.`);
    } catch (e) {
      console.error('Error actualizando el ticket de servicio:', e);
      // Fallback local
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updateFields } : t));
    }
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
