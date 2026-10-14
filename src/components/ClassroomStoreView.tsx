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
  Edit3,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CreditCard,
  Receipt,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Student, StoreItem, StorePurchaseTransaction } from '../types';
import { StoreItemVisual } from './StoreItemVisual';
import {
  calculateEffectiveItemPrice,
  DEFAULT_STORE_ITEMS,
  resetDefaultStoreItems
} from '../data/storeCatalog';
import { getCreditTier } from '../utils/creditCalculator';
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
  theme?: 'dark' | 'light';
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
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

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

  // Selected item for the Settlement Drawer / Checkout
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Unified Add / Edit Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItemIdForModal, setEditingItemIdForModal] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState<StoreItem['category']>('privilege');
  const [formBasePrice, setFormBasePrice] = useState(1000);
  const [formDiscountPercent, setFormDiscountPercent] = useState(0);
  const [formStock, setFormStock] = useState(5);
  const [formUnlimitedStock, setFormUnlimitedStock] = useState(false);
  const [formVisualType, setFormVisualType] = useState<'preset' | 'emoji'>('preset');
  const [formIconType, setFormIconType] = useState<StoreItem['iconType']>('custom');
  const [formEmoji, setFormEmoji] = useState('🎁');
  const [formDesc, setFormDesc] = useState('');
  const [formIsHidden, setFormIsHidden] = useState(false);

  const currentStudent = students.find((s) => s.id === activeStudentId) || students[0];
  const tierInfo = currentStudent ? getCreditTier(currentStudent.creditScore) : null;

  // Filtered items (respects isHidden for students and non-edit mode)
  const filteredCatalog = storeCatalog.filter((item) => {
    if (item.isHidden && (!isTeacher || !isEditMode)) {
      return false;
    }
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Default selected item for settlement panel
  const activeSelectedItem =
    filteredCatalog.find((i) => i.id === selectedItemId) ||
    filteredCatalog[0] ||
    null;

  const selectedItemEffectivePrice = activeSelectedItem
    ? calculateEffectiveItemPrice(activeSelectedItem)
    : 0;

  const canAffordSelected =
    currentStudent && currentStudent.currentBalance >= selectedItemEffectivePrice;
  const isSelectedOutOfStock =
    activeSelectedItem &&
    activeSelectedItem.stock <= 0 &&
    !activeSelectedItem.unlimitedStock;

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

  // Reset to default catalog while preserving custom items
  const handleResetCatalog = () => {
    if (
      window.confirm(
        'Reset standard store items back to their original default values? Any custom items you added will be preserved.'
      )
    ) {
      onUpdateCatalog(resetDefaultStoreItems(storeCatalog));
      setIsEditMode(false);
    }
  };

  // Modal open helpers
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItemIdForModal(null);
    setFormName('');
    setFormSubtitle('Classroom Reward');
    setFormCategory('privilege');
    setFormBasePrice(1000);
    setFormDiscountPercent(0);
    setFormStock(5);
    setFormUnlimitedStock(false);
    setFormVisualType('emoji');
    setFormIconType('custom');
    setFormEmoji('🎁');
    setFormDesc('');
    setFormIsHidden(false);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: StoreItem) => {
    setModalMode('edit');
    setEditingItemIdForModal(item.id);
    setFormName(item.name);
    setFormSubtitle(item.subtitle || '');
    setFormCategory(item.category);
    setFormBasePrice(item.basePrice);
    setFormDiscountPercent(item.discountPercent || 0);
    setFormStock(item.stock);
    setFormUnlimitedStock(Boolean(item.unlimitedStock));
    if (item.emoji && item.emoji.trim()) {
      setFormVisualType('emoji');
      setFormEmoji(item.emoji);
      setFormIconType(item.iconType || 'custom');
    } else {
      setFormVisualType('preset');
      setFormIconType(item.iconType || 'custom');
      setFormEmoji('🎁');
    }
    setFormDesc(item.description || '');
    setFormIsHidden(Boolean(item.isHidden));
    setIsItemModalOpen(true);
  };

  // Delete item handler
  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${itemName}" from the store?`)) {
      const updated = storeCatalog.filter((item) => item.id !== itemId);
      onUpdateCatalog(updated);
      if (editingItemId === itemId) {
        setEditingItemId(null);
      }
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    }
  };

  // Toggle shelf visibility (Inactive / Hidden)
  const handleToggleHideItem = (itemId: string) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, isHidden: !item.isHidden };
    });
    onUpdateCatalog(updated);
  };

  // Save Add/Edit modal form
  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (modalMode === 'add') {
      const newItem: StoreItem = {
        id: `store-custom-${Date.now()}`,
        name: formName.trim(),
        subtitle: formSubtitle.trim() || undefined,
        category: formCategory,
        basePrice: Math.max(1, formBasePrice),
        discountPercent: Math.min(95, Math.max(0, formDiscountPercent)),
        stock: formUnlimitedStock ? 0 : Math.max(0, formStock),
        unlimitedStock: formUnlimitedStock,
        iconType: formVisualType === 'preset' ? formIconType : 'custom',
        emoji: formVisualType === 'emoji' ? formEmoji.trim() || '🎁' : undefined,
        description: formDesc.trim() || undefined,
        isHidden: formIsHidden,
        isCustom: true,
      };
      onUpdateCatalog([...storeCatalog, newItem]);
    } else if (modalMode === 'edit' && editingItemIdForModal) {
      const updated = storeCatalog.map((item) => {
        if (item.id !== editingItemIdForModal) return item;
        return {
          ...item,
          name: formName.trim(),
          subtitle: formSubtitle.trim() || undefined,
          category: formCategory,
          basePrice: Math.max(1, formBasePrice),
          discountPercent: Math.min(95, Math.max(0, formDiscountPercent)),
          stock: formUnlimitedStock ? 0 : Math.max(0, formStock),
          unlimitedStock: formUnlimitedStock,
          iconType: formVisualType === 'preset' ? formIconType : 'custom',
          emoji: formVisualType === 'emoji' ? formEmoji.trim() || '🎁' : undefined,
          description: formDesc.trim() || undefined,
          isHidden: formIsHidden,
        };
      });
      onUpdateCatalog(updated);
    }

    setIsItemModalOpen(false);
  };

  // Initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'ES';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-16 transition-colors duration-200">
      {/* ======================================================== */}
      {/* 1. TOP CONTEXT BAR: STITCH APPLE WALLET ACTIVE CHIP & CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Active Student Apple Wallet Glass Chip */}
        {currentStudent ? (
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              isDark
                ? 'bg-[#181d29]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.35)] text-white'
                : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}
          >
            {/* Initials Avatar */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#009b74] via-[#00c896] to-[#42e5b0] text-[#003828] flex items-center justify-center font-display text-base font-bold shadow-[0_0_14px_rgba(66,229,176,0.3)] shrink-0">
              {getInitials(currentStudent.name)}
            </div>

            {/* Student Info & Tiers */}
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-sm sm:text-base truncate">
                  {currentStudent.name}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isDark
                      ? 'bg-white/[0.06] text-slate-300 border-white/[0.08]'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  #{currentStudent.studentIdNumber || currentStudent.cardNumber.slice(-4)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-[#4cd6fb] border border-cyan-500/20 font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#4cd6fb]" />
                  <span>{tierInfo?.name || 'Standard Tier'}</span>
                </span>
              </div>

              {/* Stats Sub-row */}
              <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Score: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{currentStudent.creditScore}</strong>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span>
                  Reserve: <strong className="text-[#42e5b0] font-bold">${currentStudent.currentBalance}.00</strong>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-[#42e5b0] border border-emerald-500/30 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  +5 Boost
                </span>
              </div>
            </div>

            {/* Switch Student Dropdown Navigation */}
            {students.length > 1 && onSelectStudent && (
              <div className="ml-auto pl-2 border-l border-white/[0.08]">
                <StudentSelectorNav
                  students={students}
                  selectedStudentId={activeStudentId}
                  onSelectStudent={(id) => {
                    setActiveStudentId(id);
                    onSelectStudent(id);
                  }}
                  label="Shopper"
                  variant="store"
                  showBalance={true}
                  showCreditScore={false}
                  showClassFilter={true}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No student selected</div>
        )}

        {/* Right Controls: Category Filters & Teacher Management Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Switchers */}
          <div
            className={`inline-flex p-1 rounded-xl border ${
              isDark ? 'bg-[#11151f] border-white/[0.06]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {(['all', 'privilege', 'academic', 'prize', 'game'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all ${
                  categoryFilter === cat
                    ? isDark
                      ? 'bg-[#212736] text-white shadow-sm border border-white/[0.1]'
                      : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Privileges' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Teacher Store Controls Toggle */}
          {isTeacher && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                  isEditMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : isDark
                    ? 'bg-[#181d29] text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Exit Manage' : 'Manage Store'}</span>
              </button>

              {isEditMode && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-3 py-1.5 bg-[#42e5b0] hover:bg-[#34c495] text-[#003828] rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors shadow-md shadow-[#42e5b0]/20"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    <span>Add Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCatalog}
                    className={`p-2 rounded-xl text-xs font-mono transition-colors border ${
                      isDark
                        ? 'bg-[#181d29] hover:bg-[#212736] border-slate-700 text-slate-400 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                    }`}
                    title="Reset default items (preserves custom items)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Discount Flash Sale Bar (in edit mode) */}
      {isEditMode && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-amber-950/40 via-[#181d29] to-amber-950/40 border-amber-500/30'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Global Flash Sale:
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Apply a catalog-wide promotional discount with one click:
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
                    : isDark
                    ? 'bg-slate-950 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
              >
                {pct === 0 ? 'No Sale (0%)' : `-${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE SPLIT: 8-COL GRID + 4-COL CHECKOUT SIDEBAR */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left & Center: 3x2 / Responsive Privileges Grid (8 cols) */}
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((item) => {
            const effectivePrice = calculateEffectiveItemPrice(item);
            const hasDiscount = item.discountPercent > 0;
            const isOutOfStock = item.stock <= 0 && !item.unlimitedStock;
            const canAfford = currentStudent && currentStudent.currentBalance >= effectivePrice;
            const isSelected = activeSelectedItem?.id === item.id;
            const isEditingThis = editingItemId === item.id;
            const isReady = canAfford && !isOutOfStock;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`group relative flex flex-col justify-between rounded-2xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-gradient-to-b from-[#1c2826] to-[#142023] border-[#42e5b0] shadow-[0_0_25px_rgba(66,229,176,0.25)] ring-1 ring-[#42e5b0]'
                      : 'bg-emerald-50/80 border-[#42e5b0] shadow-md ring-1 ring-[#42e5b0]'
                    : isDark
                    ? 'bg-[#181d29]/80 backdrop-blur-xl border-white/[0.08] hover:bg-[#1f2535] hover:border-white/[0.14] shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Ready to purchase active badge */}
                {isReady && !isSelected && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#42e5b0] text-[#003828] font-mono text-[9px] font-bold tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(66,229,176,0.5)]">
                    <CheckCircle2 className="w-3 h-3 font-bold" />
                    <span>READY</span>
                  </div>
                )}

                {/* Card Top: Category / Status Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.isHidden && isTeacher && isEditMode && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-mono font-bold text-[9px] rounded uppercase tracking-wider">
                        Inactive
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        item.category === 'academic'
                          ? 'bg-cyan-500/10 text-[#4cd6fb] border-cyan-500/30'
                          : item.category === 'game'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : item.category === 'prize'
                          ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {item.subtitle || item.category}
                    </span>
                  </div>

                  {/* Stock or Status Badge */}
                  <div>
                    {item.unlimitedStock ? (
                      <span className="text-[10px] font-mono font-semibold text-[#42e5b0]">
                        ∞ Unlimited
                      </span>
                    ) : isOutOfStock ? (
                      <span className="text-[10px] font-mono font-semibold text-red-400">
                        Out of stock
                      </span>
                    ) : !canAfford ? (
                      <span className="text-[10px] font-mono text-amber-400">
                        Needs E${effectivePrice - (currentStudent?.currentBalance || 0)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.stock} in stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Center: Visual & Info */}
                <div className="my-2 flex flex-col items-center">
                  <StoreItemVisual iconType={item.iconType} emoji={item.emoji} className="w-full h-24 mb-2" />
                  <h3
                    className={`font-display font-bold text-sm tracking-tight text-center leading-snug ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className={`text-[11px] text-center mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Card Bottom: Price, Stock, and Teacher Edit Actions */}
                <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-white/[0.06]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Price</span>
                    <div className="flex items-baseline gap-1 font-mono">
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-500 line-through">
                          ${item.basePrice}
                        </span>
                      )}
                      <span className="text-base font-bold text-[#42e5b0]">
                        E${effectivePrice}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Inline Management Quick Actions */}
                  {isTeacher && isEditMode && (
                    <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-700 rounded-lg p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(item);
                        }}
                        className="p-1 text-slate-300 hover:text-[#42e5b0] hover:bg-white/[0.08] rounded transition-colors"
                        title="Edit Item Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHideItem(item.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          item.isHidden
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        title={item.isHidden ? 'Unhide item' : 'Hide item'}
                      >
                        {item.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id, item.name);
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItemId(isEditingThis ? null : item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] rounded transition-colors"
                        title="Quick Sliders (Stock/Price)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Teacher Quick Inline Adjustment Drawer */}
                {isTeacher && isEditMode && isEditingThis && (
                  <div className="mt-3 pt-2.5 border-t border-amber-500/30 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Stock: {item.stock}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStock(item.id, -1);
                          }}
                          className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStock(item.id, 1);
                          }}
                          className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Price: ${item.basePrice}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustPrice(item.id, -100);
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 text-rose-300 rounded hover:bg-slate-700"
                        >
                          -$100
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustPrice(item.id, 100);
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 text-emerald-300 rounded hover:bg-slate-700"
                        >
                          +$100
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* Right Panel: Purchase Calculation & Checkout Sidebar (4 cols) */}
        {/* ======================================================== */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Apple Wallet Mini Ledger Preview Card */}
          <div className="bg-gradient-to-br from-[#0c1f2e] via-[#0f343e] to-[#044c3c] text-white rounded-2xl p-5 border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between h-52">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(66,229,176,0.18),transparent_60%)] pointer-events-none" />

            {/* Top row */}
            <div className="flex justify-between items-start z-10">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-300 font-mono">
                  Institutional Debit Card
                </div>
                <div className="font-display font-semibold text-sm tracking-wide text-white">
                  Didactic Classroom Reserve
                </div>
              </div>
              <span className="text-[#4cd6fb] font-mono text-xl drop-shadow-[0_0_8px_rgba(76,214,251,0.5)]">
                ))))
              </span>
            </div>

            {/* Chip row */}
            <div className="z-10 flex items-center gap-3">
              <div className="w-8 h-6 rounded bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-[#ffc149] text-xs font-mono font-bold">▦</span>
              </div>
              <span className="font-mono text-xs tracking-widest text-slate-200">
                •••• {currentStudent ? currentStudent.cardNumber.slice(-4) : '0000'}
              </span>
            </div>

            {/* Bottom Card row */}
            <div className="flex justify-between items-end z-10">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-300 font-mono">
                  Cardholder
                </div>
                <div className="font-display font-bold text-sm truncate max-w-[150px] text-white">
                  {currentStudent?.name || 'Student'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-slate-300 font-mono">
                  Available Balance
                </div>
                <div className="font-mono text-xl font-bold text-[#42e5b0] drop-shadow-[0_0_10px_rgba(66,229,176,0.4)]">
                  ${currentStudent?.currentBalance || 0}.00
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Settlement & 1-Click Purchase Checkout Sheet */}
          <div
            className={`rounded-2xl p-5 border transition-all ${
              isDark
                ? 'bg-[#181d29]/85 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)] text-white'
                : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#42e5b0]" />
                <h2 className="font-display font-bold text-sm tracking-tight">Ledger Settlement</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-[#42e5b0] border border-emerald-500/30 font-bold">
                Live Transaction
              </span>
            </div>

            {activeSelectedItem ? (
              <div className="space-y-4 pt-3 font-mono text-xs">
                {/* Selected Item Summary */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-950/60 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <StoreItemVisual iconType={activeSelectedItem.iconType} emoji={activeSelectedItem.emoji} className="w-full h-full" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold truncate text-sm">{activeSelectedItem.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {activeSelectedItem.subtitle || activeSelectedItem.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#42e5b0]">
                    ${selectedItemEffectivePrice}
                  </span>
                </div>

                {/* Calculation Breakdown */}
                <div className="space-y-1.5 py-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Starting Balance:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>
                      ${currentStudent?.currentBalance || 0}.00
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Item Price Deduction:</span>
                    <span className="text-rose-400">-${selectedItemEffectivePrice}.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Credit Score Benefit:</span>
                    <span>+5 Rating Pts</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/[0.08] font-bold text-sm">
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>Remaining Balance:</span>
                    <span className="text-[#42e5b0]">
                      ${Math.max(0, (currentStudent?.currentBalance || 0) - selectedItemEffectivePrice)}.00
                    </span>
                  </div>
                </div>

                {/* 1-Click Purchase Button */}
                <button
                  type="button"
                  disabled={!canAffordSelected || Boolean(isSelectedOutOfStock)}
                  onClick={() => {
                    if (currentStudent && canAffordSelected && !isSelectedOutOfStock) {
                      onPurchaseItem(
                        currentStudent.id,
                        selectedItemEffectivePrice,
                        activeSelectedItem,
                        selectedItemEffectivePrice
                      );
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isSelectedOutOfStock
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : !canAffordSelected
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 cursor-not-allowed'
                      : 'bg-[#42e5b0] hover:bg-[#34c495] text-[#003828] shadow-[#42e5b0]/25 hover:shadow-xl hover:scale-[1.01]'
                  }`}
                >
                  {isSelectedOutOfStock ? (
                    <span>Item Sold Out</span>
                  ) : !canAffordSelected ? (
                    <span>Needs ${selectedItemEffectivePrice - (currentStudent?.currentBalance || 0)} More</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 font-bold" />
                      <span>Confirm Purchase (+5 Score)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Click any item card to review settlement
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL: ADD / EDIT STORE ITEM (FROSTED GLASS THEME) */}
      {/* ======================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div
            className={`border rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 my-8 transition-colors ${
              isDark
                ? 'bg-[#11151f]/95 border-white/[0.12] text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold font-display uppercase tracking-wider flex items-center gap-2">
                {modalMode === 'add' ? (
                  <>
                    <Plus className="w-4 h-4 text-[#42e5b0]" />
                    <span>Add New Store Item</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 text-amber-400" />
                    <span>Edit Store Item</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="space-y-4 font-mono">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Item Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Desk Pass, Free Snack"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Subtitle / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Privilege, Academic Boost"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                  />
                </div>
              </div>

              {/* Price, Discount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Base Price ($) *</label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="95"
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as StoreItem['category'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                  >
                    <option value="privilege">Privilege / Pass</option>
                    <option value="academic">Academic Boost</option>
                    <option value="prize">Prize Box</option>
                    <option value="game">Game / Draw</option>
                  </select>
                </div>
              </div>

              {/* Stock and Unlimited Stock */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-bold">Inventory / Stock</label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#42e5b0]">
                    <input
                      type="checkbox"
                      checked={formUnlimitedStock}
                      onChange={(e) => setFormUnlimitedStock(e.target.checked)}
                      className="rounded border-slate-700 text-[#42e5b0] focus:ring-0"
                    />
                    <span>Unlimited Stock (Always Available)</span>
                  </label>
                </div>
                {!formUnlimitedStock && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-32 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                    />
                    <span className="text-[11px] text-slate-400">units in stock</span>
                  </div>
                )}
              </div>

              {/* Visual Card Appearance (Preset vs Custom Emoji) */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-bold">Visual Appearance</label>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormVisualType('emoji')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        formVisualType === 'emoji'
                          ? 'bg-[#42e5b0] text-[#003828] font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custom Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormVisualType('preset')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        formVisualType === 'preset'
                          ? 'bg-[#42e5b0] text-[#003828] font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Preset Cards
                    </button>
                  </div>
                </div>

                {formVisualType === 'emoji' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="🎁"
                        value={formEmoji}
                        onChange={(e) => setFormEmoji(e.target.value)}
                        className="w-20 text-center text-2xl px-2 py-1 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#42e5b0]"
                      />
                      <span className="text-[11px] text-slate-400">
                        Type any emoji or pick a classroom favorite below:
                      </span>
                    </div>

                    {/* Quick Emoji Palette */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['🍕', '🎮', '🎟️', '📚', '🏆', '🍿', '🍦', '🎧', '⭐', '🎁', '🚀', '👑', '🍫', '⚽', '🎨', '🎬'].map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => setFormEmoji(emo)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-transform hover:scale-125 border ${
                            formEmoji === emo
                              ? 'bg-[#42e5b0]/30 border-[#42e5b0]'
                              : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Choose Preset Design Style:</label>
                    <select
                      value={formIconType}
                      onChange={(e) => setFormIconType(e.target.value as StoreItem['iconType'])}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                    >
                      <option value="skip-hw">Skip Homework (Notebook &amp; Fast Forward)</option>
                      <option value="skip-lesson">Skip Lesson (Classroom Blackboard)</option>
                      <option value="extra-points-hw">3 Extra Points HW (Triple Golden Stars)</option>
                      <option value="extra-points-lss">3 Extra Points Lesson (Evaluation Stars)</option>
                      <option value="half-lesson">Half Lesson (Early Pass Badge)</option>
                      <option value="lucky-draw">A Spin of the Lucky Draw (Spin Wheel)</option>
                      <option value="super-mini-prize">Super-mini Prize (Pink Box &amp; Sparkles)</option>
                      <option value="mini-prize">Mini Prize (Mystery Black Box)</option>
                      <option value="big-prize">Big Prize (Grand Purple Glowing Box)</option>
                      <option value="custom">Standard Classroom Gift Box</option>
                    </select>
                  </div>
                )}

                {/* Live Visual Preview */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
                  <div className="w-24 shrink-0 bg-white/5 rounded-xl border border-slate-800 p-2 flex items-center justify-center">
                    <StoreItemVisual
                      iconType={formVisualType === 'preset' ? formIconType : 'custom'}
                      emoji={formVisualType === 'emoji' ? formEmoji : undefined}
                      className="w-full h-20"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <strong className="text-white block font-sans">Live Preview:</strong>
                    <span>{formName || 'Item Title'}</span>
                    <div className="text-[#42e5b0] font-bold">${formBasePrice}</div>
                  </div>
                </div>
              </div>

              {/* Shelf Visibility Toggle (Inactive / Hidden) */}
              <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">Shelf Visibility</p>
                  <p className="text-[10px] text-slate-400">
                    Hide this item from regular student shopping view without deleting it.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formIsHidden}
                    onChange={(e) => setFormIsHidden(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className={formIsHidden ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    {formIsHidden ? 'Hidden (Inactive)' : 'Active (Visible)'}
                  </span>
                </label>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Description / Details</label>
                <textarea
                  rows={2}
                  placeholder="Details of privilege, reward rules, or redemption notes"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#42e5b0]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#42e5b0] hover:bg-[#34c495] text-[#003828] font-bold rounded-xl text-xs transition-colors shadow-md shadow-[#42e5b0]/20"
                >
                  {modalMode === 'add' ? 'Add Item to Store' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
