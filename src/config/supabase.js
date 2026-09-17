import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://qoucwxpgkgafhsgzligt.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_MpGGPP1-W0LkInQ1NPKgGg_FDgPdSjE';

// Check if credentials have been populated
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database column mapping helpers (handles Postgres lowercase column conversion)
export const mapProductFromDb = (p) => ({
  ...p,
  subCategory: p.subcategory || p.subCategory || `${p.category} / General`
});

export const mapProductToDb = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  subcategory: p.subCategory || p.subcategory || `${p.category} / General`,
  stock: p.stock,
  price: p.price,
  cost: p.cost,
  status: p.status,
  desc: p.desc,
  image: p.image
});

export const mapTicketFromDb = (t) => ({
  ...t,
  systemType: t.systemtype || t.systemType,
  advancePayment: t.advancepayment !== undefined ? Number(t.advancepayment) : (t.advancePayment || 0),
  advancePaid: Boolean(t.advancepaid ?? t.advancePaid),
  balancePaid: Boolean(t.balancepaid ?? t.balancePaid),
  fullyPaid: Boolean(t.fullypaid ?? t.fullyPaid),
  commonFaults: t.commonfaults || t.commonFaults || [],
  paymentHistory: t.paymenthistory || t.paymentHistory || [],
  assignedTech: t.assignedtech || t.assignedTech || null,
  timeline: t.timeline || []
});

export const mapTicketToDb = (t) => ({
  id: t.id,
  address: t.address,
  city: t.city,
  systemtype: t.systemType || t.systemtype,
  status: t.status,
  price: t.price,
  advancepayment: t.advancePayment !== undefined ? Number(t.advancePayment) : (t.advancepayment || 0),
  advancepaid: Boolean(t.advancePaid ?? t.advancepaid),
  balancepaid: Boolean(t.balancePaid ?? t.balancepaid),
  fullypaid: Boolean(t.fullyPaid ?? t.fullypaid),
  date: t.date,
  techs: t.techs,
  desc: t.desc,
  commonfaults: t.commonFaults || t.commonfaults || [],
  image: t.image,
  timeline: t.timeline || [],
  paymenthistory: t.paymentHistory || t.paymenthistory || [],
  assignedtech: t.assignedTech || t.assignedtech || null
});

export const mapSaleFromDb = (s) => ({
  ...s,
  paymentMethod: s.paymentmethod || s.paymentMethod,
  cashierName: s.cashiername || s.cashierName,
  cashierId: s.cashierid || s.cashierId,
  cashierRole: s.cashierrole || s.cashierRole
});

export const mapSaleToDb = (s) => ({
  id: s.id,
  date: s.date,
  timestamp: s.timestamp,
  items: s.items,
  subtotal: s.subtotal,
  discount: s.discount,
  tax: s.tax,
  total: s.total,
  paymentmethod: s.paymentMethod || s.paymentmethod,
  cashiername: s.cashierName || s.cashiername,
  cashierid: s.cashierId || s.cashierid,
  cashierrole: s.cashierRole || s.cashierrole
});

export const mapAttendanceFromDb = (a) => ({
  ...a,
  userId: a.userid || a.userId,
  userName: a.username || a.userName,
  userRole: a.userrole || a.userRole
});

export const mapAttendanceToDb = (a) => ({
  id: a.id,
  userid: a.userId || a.userid,
  username: a.userName || a.username,
  userrole: a.userRole || a.userrole,
  type: a.type,
  date: a.date,
  time: a.time,
  timestamp: a.timestamp
});

export const mapCierreFromDb = (c) => ({
  ...c,
  efectivoReal: c.efectivoreal !== undefined ? Number(c.efectivoreal) : (c.efectivoReal || 0),
  efectivoEsperado: c.efectivoesperado !== undefined ? Number(c.efectivoesperado) : (c.efectivoEsperado || 0),
  tarjetaEsperado: c.tarjetaesperado !== undefined ? Number(c.tarjetaesperado) : (c.tarjetaEsperado || 0),
  qrEsperado: c.qresperado !== undefined ? Number(c.qresperado) : (c.qrEsperado || 0),
  conteoEfectivo: c.conteoefectivo || c.conteoEfectivo || {}
});

export const mapCierreToDb = (c) => ({
  id: c.id,
  cajero: c.cajero,
  efectivoreal: c.efectivoReal !== undefined ? Number(c.efectivoReal) : (c.efectivoreal || 0),
  efectivoesperado: c.efectivoEsperado !== undefined ? Number(c.efectivoEsperado) : (c.efectivoesperado || 0),
  tarjetaesperado: c.tarjetaEsperado !== undefined ? Number(c.tarjetaEsperado) : (c.tarjetaesperado || 0),
  qresperado: c.qrEsperado !== undefined ? Number(c.qrEsperado) : (c.qresperado || 0),
  diferencia: c.diferencia,
  conteoefectivo: c.conteoEfectivo || c.conteoefectivo || {},
  fecha: c.fecha,
  timestamp: c.timestamp
});

export const mapAgencyFromDb = (a) => ({
  ...a,
  clientId: a.clientid || a.clientId,
  clientName: a.clientname || a.clientName,
  clientCode: a.clientcode || a.clientCode,
  agencyName: a.agencyname || a.agencyName,
  city: a.city,
  address: a.address,
  lat: a.lat !== undefined ? Number(a.lat) : -21.5332,
  lng: a.lng !== undefined ? Number(a.lng) : -64.7339,
  contactPerson: a.contactperson || a.contactPerson || '',
  contactPhone: a.contactphone || a.contactPhone || '',
  contactEmail: a.contactemail || a.contactEmail || '',
  status: a.status || 'optimo',
  lastReplenished: a.lastreplenished || a.lastReplenished || '',
  printers: a.printers || [],
  toners: a.toners || [],
  deliveryHistory: a.deliveryhistory || a.deliveryHistory || [],
  changeHistory: a.changehistory || a.changeHistory || []
});

export const mapAgencyToDb = (a) => ({
  id: a.id,
  clientid: a.clientId || a.clientid,
  clientname: a.clientName || a.clientname,
  clientcode: a.clientCode || a.clientcode,
  agencyname: a.agencyName || a.agencyname,
  city: a.city,
  address: a.address,
  lat: a.lat !== undefined ? Number(a.lat) : -21.5332,
  lng: a.lng !== undefined ? Number(a.lng) : -64.7339,
  contactperson: a.contactPerson || a.contactperson || '',
  contactphone: a.contactPhone || a.contactphone || '',
  contactemail: a.contactEmail || a.contactemail || '',
  status: a.status || 'optimo',
  lastreplenished: a.lastReplenished || a.lastreplenished || '',
  printers: a.printers || [],
  toners: a.toners || [],
  deliveryhistory: a.deliveryHistory || a.deliveryhistory || [],
  changehistory: a.changeHistory || a.changehistory || []
});

export const mapClientFromDb = (c) => ({
  ...c,
  id: c.id,
  name: c.name,
  code: c.code,
  contactPerson: c.contactperson || c.contactPerson || '',
  contactPhone: c.contactphone || c.contactPhone || '',
  contactEmail: c.contactemail || c.contactEmail || '',
  contractSla: c.contractsla || c.contractSla || 'SLA Estándar 24/7',
  city: c.city || 'Tarija',
  address: c.address || '',
  notes: c.notes || ''
});

export const mapClientToDb = (c) => ({
  id: c.id,
  name: c.name,
  code: c.code,
  contactperson: c.contactPerson || c.contactperson || '',
  contactphone: c.contactPhone || c.contactphone || '',
  contactemail: c.contactEmail || c.contactemail || '',
  contractsla: c.contractSla || c.contractsla || 'SLA Estándar 24/7',
  city: c.city || 'Tarija',
  address: c.address || '',
  notes: c.notes || ''
});
