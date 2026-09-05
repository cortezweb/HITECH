import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ProductLabel from '../components/ProductLabel';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export default function Inventory() {
  const {
    substates,
    setSubstate,
    products,
    addInventoryProduct,
    selectedInventoryItem,
    setSelectedInventoryItem
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Hardware',
    stock: '',
    price: '',
    cost: '',
    image: '',
    desc: ''
  });

  const currentSubstate = substates.inventory;
  const isEmptyState = currentSubstate === 'empty';

  // Calculations
  const displayProducts = isEmptyState 
    ? [] 
    : searchQuery 
      ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()))
      : products;

  const totalStockItems = displayProducts.reduce((acc, p) => acc + p.stock, 0);
  const criticalStockItems = displayProducts.filter(p => p.stock > 0 && p.stock <= 15).length;

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert('Por favor introduce el nombre y el precio del producto.');
      return;
    }
    
    addInventoryProduct(newProduct);
    setNewProduct({
      name: '',
      category: 'Hardware',
      stock: '',
      price: '',
      cost: '',
      image: '',
      desc: ''
    });
    setSubstate('inventory', 'moderno');
  };

  const handleOpenDetails = (prod) => {
    setSelectedInventoryItem(prod);
    setSubstate('inventory', 'detail');
  };

  // Generate real-time barcode and QR code previews in the details panel
  useEffect(() => {
    if (selectedInventoryItem && currentSubstate === 'detail') {
      const timer = setTimeout(() => {
        const barcodeEl = document.getElementById(`preview-barcode-${selectedInventoryItem.id}`);
        const qrcodeEl = document.getElementById(`preview-qrcode-${selectedInventoryItem.id}`);
        if (barcodeEl) {
          try {
            JsBarcode(barcodeEl, selectedInventoryItem.id, {
              format: 'CODE128',
              width: 1.2,
              height: 28,
              displayValue: false,
              margin: 0
            });
          } catch (e) {
            console.error('Error rendering preview barcode:', e);
          }
        }
        if (qrcodeEl) {
          try {
            QRCode.toCanvas(qrcodeEl, JSON.stringify({
              sku: selectedInventoryItem.id,
              name: selectedInventoryItem.name,
              price: selectedInventoryItem.price
            }), {
              width: 52,
              margin: 0
            });
          } catch (e) {
            console.error('Error rendering preview qrcode:', e);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedInventoryItem, currentSubstate]);

  return (
    <div className="space-y-6 relative">
      {/* Demo States Switcher */}
      <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
        <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Demo States:</span>
        <button
          onClick={() => setSubstate('inventory', 'moderno')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            currentSubstate === 'moderno' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Registro General (Moderno)
        </button>
        <button
          onClick={() => setSubstate('inventory', 'empty')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            currentSubstate === 'empty' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Estado Vacío
        </button>
      </div>

      {/* Overview Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Total Stock */}
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-primary-fixed text-primary rounded-lg flex">
                <span className="material-symbols-outlined">inventory</span>
              </span>
            </div>
            <h3 className="text-[13px] font-semibold text-on-surface-variant mb-1">Activos en Existencia</h3>
            <p className="text-[28px] font-bold text-on-surface">
              {isEmptyState ? 0 : totalStockItems.toLocaleString('en-US')} Unidades
            </p>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className={`p-2 rounded-lg flex ${criticalStockItems > 0 && !isEmptyState ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant'}`}>
                <span className="material-symbols-outlined">warning</span>
              </span>
              {criticalStockItems > 0 && !isEmptyState && (
                <span className="text-[12px] font-bold text-error animate-pulse">Atención Requerida</span>
              )}
            </div>
            <h3 className="text-[13px] font-semibold text-on-surface-variant mb-1">Alertas de Stock Crítico</h3>
            <p className="text-[28px] font-bold text-on-surface">
              {isEmptyState ? 0 : criticalStockItems} Productos
            </p>
          </div>
        </div>

        {/* Storage Utilization */}
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-secondary-fixed text-secondary rounded-lg flex">
                <span className="material-symbols-outlined">warehouse</span>
              </span>
            </div>
            <h3 className="text-[13px] font-semibold text-on-surface-variant mb-1">Capacidad de Almacén</h3>
            <p className="text-[28px] font-bold text-on-surface">{isEmptyState ? '0%' : '82%'}</p>
          </div>
          <div className="mt-4 w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: isEmptyState ? '0%' : '82%' }}></div>
          </div>
        </div>
      </section>

      {/* Main Registry Controls & Table */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden text-left">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-[18px] font-bold text-on-surface">Registro Maestro</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-surface-container rounded-full text-[12px] font-semibold text-on-surface-variant">
                Todos ({isEmptyState ? 0 : products.length})
              </span>
              {criticalStockItems > 0 && !isEmptyState && (
                <span className="px-3 py-1 bg-error-container text-error rounded-full text-[12px] font-semibold">
                  Crítico ({criticalStockItems})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input inside controls bar */}
            <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-transparent focus-within:border-primary w-52 md:w-60">
              <span className="material-symbols-outlined text-on-surface-variant mr-1.5 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Buscar activo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[12px] w-full"
              />
            </div>
            
            <button 
              onClick={() => setSubstate('inventory', 'add')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-[13px] hover:brightness-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Agregar Activo</span>
            </button>
          </div>
        </div>

        {/* Empty Registry View */}
        {displayProducts.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
              <div className="relative bg-white p-5 rounded-2xl shadow-md border border-primary/10">
                <span className="material-symbols-outlined text-5xl text-primary">inventory</span>
              </div>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-on-surface mb-2">No se encontraron activos</h3>
              <p className="text-[13px] text-on-surface-variant max-w-sm mx-auto">
                No hay registros que coincidan con tu búsqueda. Comienza agregando un nuevo producto.
              </p>
            </div>
            <button
              onClick={() => setSubstate('inventory', 'add')}
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-primary/10"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Agregar Nuevo Producto</span>
            </button>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider">SKU</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider">Nombre del Producto</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider">Categoría</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider">Nivel de Stock</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider">Precio Unitario</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider">Estado</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-on-surface-variant tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {displayProducts.map((product) => {
                  const isOut = product.stock === 0;
                  const isLow = product.stock > 0 && product.stock <= 15;
                  const stockPercent = Math.min(100, (product.stock / 1000) * 100);

                  return (
                    <tr key={product.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-[13px] font-semibold text-primary">{product.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden p-1 flex-shrink-0 border border-outline-variant/10">
                            <img className="w-full h-full object-contain" alt={product.name} src={product.image} />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-[14px]">{product.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{product.subCategory}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-on-surface-variant">{product.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-28">
                          <span className="text-on-surface text-[12px] font-bold">{product.stock.toLocaleString()} Unidades</span>
                          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isOut ? 'bg-outline' : isLow ? 'bg-error' : 'bg-primary'}`} 
                              style={{ width: `${isOut ? 0 : Math.max(10, stockPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isOut 
                            ? 'bg-outline-variant/10 border-outline-variant/20 text-on-surface-variant'
                            : isLow 
                              ? 'bg-error-container/20 border-error/10 text-error'
                              : 'bg-primary-fixed/20 border-primary/10 text-primary'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenDetails(product)}
                          className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant group-hover:text-primary transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Product Modal Overlay */}
      {currentSubstate === 'add' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-outline-variant/20 relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setSubstate('inventory', 'moderno')}
              className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="text-[18px] font-bold mb-1">Agregar Nuevo Activo</h3>
            <p className="text-[12px] text-on-surface-variant mb-6">Registra un nuevo producto o repuesto en el inventario</p>
            
            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Nombre del Activo *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="ej. Cargador USB-C Apple 96W"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none cursor-pointer"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Peripherals">Periféricos</option>
                    <option value="Electronics">Electrónica</option>
                    <option value="Network">Redes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Precio Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Costo Adquisición ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    placeholder="Dejar vacío para auto (60%)"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">URL de Imagen</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Descripción</label>
                <textarea
                  value={newProduct.desc}
                  onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
                  placeholder="Especificaciones técnicas o detalles..."
                  rows="3"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSubstate('inventory', 'moderno')}
                  className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-all text-center text-[13px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-105 transition-all text-center text-[13px] cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Side Drawer */}
      {currentSubstate === 'detail' && selectedInventoryItem && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-8 shadow-2xl flex flex-col justify-between relative animate-in slide-in-from-right duration-300 border-l border-outline-variant/20 text-left">
            <button 
              onClick={() => setSubstate('inventory', 'moderno')}
              className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div>
              <div className="flex items-center gap-1 text-[12px] text-on-surface-variant mb-4 uppercase tracking-wider font-semibold">
                <span>Inventario</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span>Detalles</span>
              </div>
              
              <div className="h-48 bg-surface-container-low rounded-2xl flex items-center justify-center p-4 mb-6 border border-outline-variant/10">
                <img className="max-h-full max-w-full object-contain" alt={selectedInventoryItem.name} src={selectedInventoryItem.image} />
              </div>

              <h2 className="text-[20px] font-black text-on-surface mb-1 leading-snug">{selectedInventoryItem.name}</h2>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-fixed/20 border border-primary/10 text-primary">
                {selectedInventoryItem.id}
              </span>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[11px] text-on-surface-variant font-bold mb-1">Precio de Venta</p>
                  <p className="text-[15px] font-extrabold text-on-surface">${selectedInventoryItem.price.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[11px] text-on-surface-variant font-bold mb-1">Costo Adquisición</p>
                  <p className="text-[15px] font-extrabold text-on-surface-variant">${(selectedInventoryItem.cost || selectedInventoryItem.price * 0.6).toFixed(2)}</p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[11px] text-on-surface-variant font-bold mb-1">Utilidad Esperada</p>
                  <p className="text-[15px] font-extrabold text-emerald-600">
                    +${(selectedInventoryItem.price - (selectedInventoryItem.cost || selectedInventoryItem.price * 0.6)).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[11px] text-on-surface-variant font-bold mb-1">Margen Comercial</p>
                  <p className="text-[15px] font-extrabold text-emerald-700">
                    {(((selectedInventoryItem.price - (selectedInventoryItem.cost || selectedInventoryItem.price * 0.6)) / (selectedInventoryItem.price || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-[12px] font-bold text-on-surface-variant mb-1">Descripción General</h4>
                  <p className="text-[13px] text-on-surface leading-relaxed">{selectedInventoryItem.desc}</p>
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-on-surface-variant mb-1">Nivel de Almacenamiento</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[14px] font-extrabold">{selectedInventoryItem.stock} Unidades</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedInventoryItem.stock === 0 
                        ? 'bg-outline-variant/10 border-outline-variant/20 text-on-surface-variant'
                        : selectedInventoryItem.stock <= 15 
                          ? 'bg-error-container/20 border-error/10 text-error'
                          : 'bg-primary-fixed/20 border-primary/10 text-primary'
                    }`}>
                      {selectedInventoryItem.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Label Preview */}
              <div className="mt-6 border border-outline-variant/30 rounded-2xl p-4 bg-slate-50 space-y-3">
                <h4 className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px] text-primary">qr_code_2</span>
                  <span>Etiqueta del Producto</span>
                </h4>
                <div className="flex justify-between items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex-1 flex flex-col justify-center items-center py-2 border-r border-slate-100 min-w-0">
                    <svg id={`preview-barcode-${selectedInventoryItem.id}`} className="max-w-full h-8" />
                  </div>
                  <div className="w-[52px] h-[52px] flex items-center justify-center bg-slate-50 rounded-lg p-0.5 border border-slate-200 flex-shrink-0">
                    <canvas id={`preview-qrcode-${selectedInventoryItem.id}`} className="w-full h-full" />
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary/15 text-primary rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">print</span>
                  <span>Imprimir Etiqueta (50x30mm)</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (confirm(`¿Eliminar ${selectedInventoryItem.name} de inventario?`)) {
                    // Alert deletion prototype
                    alert('Acción no disponible en el prototipo');
                  }
                }}
                className="flex-1 py-3 bg-error-container text-error rounded-xl font-bold text-[13px] hover:bg-error-container/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Eliminar</span>
              </button>
              <button 
                onClick={() => setSubstate('inventory', 'moderno')}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:brightness-105 transition-all text-center cursor-pointer"
              >
                Regresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable label */}
      {selectedInventoryItem && <ProductLabel product={selectedInventoryItem} />}
    </div>
  );
}
