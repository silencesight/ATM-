import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sliders,
  Tag,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  Check,
  AlertCircle,
  TrendingUp,
  Percent,
  Search,
  DollarSign,
  Package,
  Award,
  ArrowRight,
  Zap,
  Edit3
} from 'lucide-react';
import { Student, StoreItem, StorePurchaseTransaction } from '../types';
import { StoreItemVisual } from './StoreItemVisual';
import { calculateEffectiveItemPrice, DEFAULT_STORE_ITEMS } from '../data/storeCatalog';
import { StudentSelectorNav } from './StudentSelectorNav';

interface ClassroomStoreViewProps {
  students: Student[];
  selectedStudentId?: string;
  onSelectStudent?: (studentId: string) => void;
  storeCatalog: StoreItem[];
  onUpdateCatalog: (newCatalog: StoreItem[]) => void;
  onPurchaseItem: (
    studentId: string,
    amount: number,
    item: StoreItem,
    finalPrice: number
  ) => void;
  onCustomDeduction?: (studentId: string, amount: number, note: string) => void;
  isTeacher?: boolean;
}

export const ClassroomStoreView: React.FC<ClassroomStoreViewProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  storeCatalog,
  onUpdateCatalog,
  onPurchaseItem,
  onCustomDeduction,
  isTeacher = true,
}) => {
  const [activeStudentId, setActiveStudentId] = useState<string>(
    selectedStudentId || students[0]?.id || ''
  );

  useEffect(() => {
    if (selectedStudentId) {
      setActiveStudentId(selectedStudentId);
    }
  }, [selectedStudentId]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'privilege' | 'academic' | 'prize' | 'game'>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [globalDiscountInput, setGlobalDiscountInput] = useState<number>(0);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);

  // New Custom Item Form state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState(1000);
  const [customItemStock, setCustomItemStock] = useState(5);
  const [customItemCategory, setCustomItemCategory] = useState<StoreItem['category']>('privilege');
  const [customItemDesc, setCustomItemDesc] = useState('');

  const currentStudent = students.find((s) => s.id === activeStudentId) || students[0];

  // Filtered items
  const filteredCatalog = storeCatalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Stock update handler
  const handleUpdateStock = (itemId: string, delta: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      const newStock = Math.max(0, item.stock + delta);
      return { ...item, stock: newStock };
    });
    onUpdateCatalog(updated);
  };

  const handleSetExactStock = (itemId: string, newStock: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, stock: Math.max(0, newStock) };
    });
    onUpdateCatalog(updated);
  };

  // Price adjustment handler
  const handleAdjustPrice = (itemId: string, delta: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      const newPrice = Math.max(10, item.basePrice + delta);
      return { ...item, basePrice: newPrice };
    });
    onUpdateCatalog(updated);
  };

  const handleSetExactPrice = (itemId: string, newPrice: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, basePrice: Math.max(10, newPrice) };
    });
    onUpdateCatalog(updated);
  };

  // Discount handler
  const handleSetDiscount = (itemId: string, discountPercent: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, discountPercent: Math.min(95, Math.max(0, discountPercent)) };
    });
    onUpdateCatalog(updated);
  };

  // Global discount handler
  const handleApplyGlobalDiscount = (percent: number) => {
    const updated = storeCatalog.map((item) => ({
      ...item,
      discountPercent: percent,
    }));
    onUpdateCatalog(updated);
    setGlobalDiscountInput(percent);
  };

  // Reset to original image catalog
  const handleResetCatalog = () => {
    if (window.confirm('Reset all store prices, stocks, and discounts to the original classroom default values?')) {
      onUpdateCatalog(DEFAULT_STORE_ITEMS);
      setIsEditMode(false);
    }
  };

  // Add custom item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    const newItem: StoreItem = {
      id: `store-custom-${Date.now()}`,
      name: customItemName.trim(),
      subtitle: 'Classroom Reward',
      category: customItemCategory,
      basePrice: customItemPrice,
      discountPercent: 0,
      stock: customItemStock,
      iconType: 'custom',
      description: customItemDesc.trim() || 'Custom classroom privilege or item.',
    };

    onUpdateCatalog([...storeCatalog, newItem]);
    setShowAddCustomModal(false);
    setCustomItemName('');
    setCustomItemPrice(1000);
    setCustomItemStock(5);
    setCustomItemDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Graphic Banner matching 1st BGU.png */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-gradient-to-r from-stone-900 via-slate-900 to-emerald-950">
        {/* Scenic Background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="flex items-center gap-5">
            {/* Mascot: Calico/Orange Cat badge inspired by the header photo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 p-2 flex items-center justify-center text-4xl shadow-lg shrink-0 relative overflow-hidden backdrop-blur-md">
              <span className="transform -rotate-6 select-none" role="img" aria-label="Store Cat">
                🐱
              </span>
              <div className="absolute -bottom-1 text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-500/40 font-mono">
                Storekeeper
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Classroom Economy
                </span>
                <span className="text-xs text-slate-400 font-mono">1st BGU Edition</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif-card mt-1">
                The Store
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Exchange your earned credit dollars for classroom privileges, test bonus points, and mystery prize boxes.
              </p>
            </div>
          </div>

          {/* Active Shopper Badge & Credit Score Benefit */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[280px] shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                Active Cardholder
              </span>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>+5 Score / Purchase</span>
              </div>
            </div>

            {currentStudent ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white text-base leading-tight">{currentStudent.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Score: <strong className="text-blue-400">{currentStudent.creditScore}</strong> • Limit: ${currentStudent.maxLoanLimit}
                  </p>
                </div>
                <div className="text-right bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60">
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Balance</span>
                  <span className="text-lg font-mono font-bold text-emerald-300">
                    ${currentStudent.currentBalance}.00
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No student selected</p>
            )}

            {/* Switch Student Navigator */}
            {students.length > 1 && (
              <div className="pt-2 border-t border-slate-800/80">
                <StudentSelectorNav
                  students={students}
                  selectedStudentId={activeStudentId}
                  onSelectStudent={(id) => {
                    setActiveStudentId(id);
                    if (onSelectStudent) onSelectStudent(id);
                  }}
                  label="Shopper"
                  variant="store"
                  showBalance={true}
                  showCreditScore={true}
                  showClassFilter={true}
                  showShuffle={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Credit Score Benefit Banner */}
        <div className="bg-emerald-950/40 border-t border-emerald-800/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-emerald-200">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Credit Score Boost:</strong> Each store purchase increases the student's credit rating by <strong>+5 pts</strong> to reward responsible spending.
            </span>
          </div>
          <span className="text-[11px] text-emerald-400/80">
            Current Score: {currentStudent?.creditScore ?? 650} / 850
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Sticky Shopper Switcher, and Teacher Management Mode */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-md sticky top-16 z-20">
        {/* Left: Search & Category */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(['all', 'privilege', 'academic', 'prize', 'game'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-colors ${
                  categoryFilter === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Middle/Center: Quick Shopper Switcher on Sticky Bar */}
        {students.length > 1 && (
          <div className="flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-800 pt-2 lg:pt-0 lg:pl-3">
            <StudentSelectorNav
              students={students}
              selectedStudentId={activeStudentId}
              onSelectStudent={(id) => {
                setActiveStudentId(id);
                if (onSelectStudent) onSelectStudent(id);
              }}
              label="Shopper"
              variant="navbar"
              showBalance={true}
              showCreditScore={false}
              showClassFilter={true}
            />
          </div>
        )}

        {/* Right: Teacher Store Options (Edit Stock, Discounts, Price Adjustments) */}
        {isTeacher && (
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-amber-500/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Exit Edit Mode' : 'Manage Store (Stock/Price/Discounts)'}</span>
            </button>

            {isEditMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-mono transition-colors"
                  title="Reset to default 1st BGU store catalog"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Global Discount Flash Sale Bar (in edit mode) */}
      {isEditMode && (
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-200 uppercase tracking-wider">
              Global Flash Sale:
            </span>
            <span className="text-xs text-slate-300">
              Apply a store-wide discount across all catalog items with one click:
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 10, 20, 25, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyGlobalDiscount(pct)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  globalDiscountInput === pct
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-slate-950 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                {pct === 0 ? 'No Sale (0%)' : `-${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items Grid matching the 9 cards from 1st BGU.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCatalog.map((item) => {
          const effectivePrice = calculateEffectiveItemPrice(item);
          const hasDiscount = item.discountPercent > 0;
          const isOutOfStock = item.stock <= 0 && !item.unlimitedStock;
          const canAfford = currentStudent && currentStudent.currentBalance >= effectivePrice;
          const isEditingThis = editingItemId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white text-slate-900 rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xl relative group ${
                isOutOfStock
                  ? 'opacity-65 border-slate-300'
                  : 'border-slate-300 hover:border-emerald-500 hover:shadow-2xl'
              }`}
            >
              {/* Card Top: Stock Header matching 1st BGU.png */}
              <div className="pt-4 px-4 pb-1 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-bold font-sans tracking-wide ${
                      isOutOfStock ? 'text-red-600' : item.stock <= 2 ? 'text-amber-600' : 'text-slate-800'
                    }`}
                  >
                    {isOutOfStock ? 'Out of stock' : `${item.stock} in stock`}
                  </span>
                  {item.stock <= 2 && !isOutOfStock && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>

                {hasDiscount && (
                  <span className="px-2 py-0.5 bg-red-600 text-white font-mono font-bold text-[11px] rounded-full shadow-sm">
                    -{item.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Card Center: Visual Illustration */}
              <div className="p-4 flex flex-col items-center justify-center min-h-[140px]">
                <StoreItemVisual iconType={item.iconType} className="w-full h-32" />
                {item.description && (
                  <p className="text-[11px] text-slate-600 text-center italic mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Card Bottom: Title & Green Curved Ribbon Tag matching 1st BGU.png */}
              <div className="border-t border-slate-200 bg-slate-50/50 flex items-stretch justify-between relative min-h-[64px]">
                {/* Left: Item Title & Subtitle */}
                <div className="p-3.5 flex flex-col justify-center flex-1 pr-2">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {item.name}
                  </h3>
                  {item.subtitle && (
                    <span className="text-[11px] text-slate-500 font-mono">{item.subtitle}</span>
                  )}
                </div>

                {/* Right: Curved Green Price Tag (Signature aesthetic of 1st BGU.png) */}
                <div className="relative flex items-center justify-center pl-6 pr-5 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white font-mono font-bold shadow-md rounded-tl-3xl">
                  {/* Subtle inner curve visual */}
                  <div className="flex flex-col items-end">
                    {hasDiscount && (
                      <span className="text-[10px] text-emerald-200 line-through leading-none opacity-80">
                        ${item.basePrice}
                      </span>
                    )}
                    <span className="text-xl font-black leading-tight tracking-tight">
                      ${effectivePrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Action Button / Out of Stock Banner */}
              <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={!canAfford || isOutOfStock}
                  onClick={() => {
                    if (currentStudent && canAfford && !isOutOfStock) {
                      onPurchaseItem(currentStudent.id, effectivePrice, item, effectivePrice);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    isOutOfStock
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : !canAfford
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:shadow-md'
                  }`}
                >
                  {isOutOfStock ? (
                    <span>Sold Out</span>
                  ) : !canAfford ? (
                    <span>Needs ${effectivePrice - (currentStudent?.currentBalance || 0)} More</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Buy for {currentStudent?.name.split(' ')[0] || 'Student'} (+5 Score)</span>
                    </>
                  )}
                </button>

                {isTeacher && isEditMode && (
                  <button
                    type="button"
                    onClick={() => setEditingItemId(isEditingThis ? null : item.id)}
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors"
                    title="Edit stock, price, and discount"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Teacher Edit Drawer (In Edit Mode) */}
              {isTeacher && isEditMode && (
                <div className="p-4 bg-slate-900 text-slate-100 border-t-2 border-amber-500 space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      Manage Item Controls
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  {/* 1. Edit Stock */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Stock Quantity:</span>
                      <strong className="text-white">{item.stock} available</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.id, -1)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold border border-slate-700"
                        title="Reduce stock by 1"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.id, 1)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold border border-slate-700"
                        title="Add 1 to stock"
                      >
                        +1
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.stock}
                        onChange={(e) => handleSetExactStock(item.id, Number(e.target.value))}
                        className="w-16 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetExactStock(item.id, 5)}
                        className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:text-white border border-slate-700"
                      >
                        Set 5
                      </button>
                    </div>
                  </div>

                  {/* 2. Increase / Reduce Price */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Base Price ($):</span>
                      <strong className="text-emerald-400">${item.basePrice}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAdjustPrice(item.id, -500)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded text-[11px] font-bold border border-slate-700"
                      >
                        -$500
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustPrice(item.id, -100)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded text-[11px] font-bold border border-slate-700"
                      >
                        -$100
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustPrice(item.id, 100)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[11px] font-bold border border-slate-700"
                      >
                        +$100
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustPrice(item.id, 500)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[11px] font-bold border border-slate-700"
                      >
                        +$500
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="50"
                        value={item.basePrice}
                        onChange={(e) => handleSetExactPrice(item.id, Number(e.target.value))}
                        className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* 3. Add Discounts */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Discount:</span>
                      <strong className="text-amber-400">
                        {item.discountPercent > 0 ? `${item.discountPercent}% OFF ($${effectivePrice})` : 'Full Price'}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[0, 10, 20, 25, 50, 75].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSetDiscount(item.id, pct)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            item.discountPercent === pct
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                        >
                          {pct === 0 ? '0%' : `-${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Banner matching bottom of 1st BGU.png */}
      <div className="rounded-2xl bg-[#1e4620] text-emerald-100 p-5 sm:p-6 shadow-xl border border-emerald-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Store Branding */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-300/40 p-2 flex items-center justify-center text-amber-300 text-2xl shadow-sm">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider text-white font-mono">
              Your Store
            </h4>
            <p className="text-xs text-emerald-200/80 font-mono">1st BGU Didactic Reserve</p>
          </div>
        </div>

        {/* Center/Right Tagline matching 1st BGU.png */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold tracking-wide text-white">
          <span className="flex items-center gap-2">
            <span>Every thing is possible</span>
            <span className="text-amber-300 font-bold">|</span>
          </span>
          <span className="flex items-center gap-2">
            <span>Everything is obtainable</span>
            <span className="text-amber-300 font-bold">|</span>
          </span>
        </div>
      </div>

      {/* MODAL: ADD CUSTOM STORE ITEM */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Store Reward Item
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-4 font-mono">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Desk Pass, Free Snack, Bonus Points"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Base Price ($)</label>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    required
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Initial Stock</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customItemStock}
                    onChange={(e) => setCustomItemStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Category</label>
                <select
                  value={customItemCategory}
                  onChange={(e) => setCustomItemCategory(e.target.value as StoreItem['category'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="privilege">Privilege / Pass</option>
                  <option value="academic">Academic Boost / Points</option>
                  <option value="prize">Prize Box</option>
                  <option value="game">Game / Draw</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Details of privilege or reward"
                  value={customItemDesc}
                  onChange={(e) => setCustomItemDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
