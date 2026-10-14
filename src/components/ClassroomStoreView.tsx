import React, { useState, useEffect, useMemo } from 'react';
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
  Filter,
  Users,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { Student, StoreItem, StorePurchaseTransaction } from '../types';
import { StoreItemVisual } from './StoreItemVisual';
import {
  calculateEffectiveItemPrice,
  DEFAULT_STORE_ITEMS,
  resetDefaultStoreItems
} from '../data/storeCatalog';
import { getCreditTier } from '../utils/creditCalculator';

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

  // Dedicated Shopper Picker Modal (prevents any UI collision)
  const [isShopperPickerOpen, setIsShopperPickerOpen] = useState(false);
  const [shopperSearch, setShopperSearch] = useState('');
  const [shopperClassFilter, setShopperClassFilter] = useState('all');

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

  // Filtered students for shopper picker modal
  const filteredShoppers = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(shopperSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(shopperSearch.toLowerCase()) ||
        (s.cardNumber && s.cardNumber.toLowerCase().includes(shopperSearch.toLowerCase()));
      const matchesClass = shopperClassFilter === 'all' || s.classId === shopperClassFilter || s.className === shopperClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, shopperSearch, shopperClassFilter]);

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

  const handleUpdateItemPrice = (itemId: string, delta: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      const newPrice = Math.max(0, item.basePrice + delta);
      return { ...item, basePrice: newPrice };
    });
    onUpdateCatalog(updated);
  };

  const handleUpdateItemDiscount = (itemId: string, newDiscount: number) => {
    const clamped = Math.max(0, Math.min(100, newDiscount));
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, discountPercent: clamped };
    });
    onUpdateCatalog(updated);
  };

  const handleToggleHideItem = (itemId: string) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, isHidden: !item.isHidden };
    });
    onUpdateCatalog(updated);
  };

  const handleDeleteItem = (item: StoreItem) => {
    if (window.confirm(`Are you sure you want to permanently delete "${item.name}" from the store catalog?`)) {
      const updated = storeCatalog.filter((i) => i.id !== item.id);
      onUpdateCatalog(updated);
      if (selectedItemId === item.id) {
        setSelectedItemId(null);
      }
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItemIdForModal(null);
    setFormName('');
    setFormSubtitle('');
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
    setFormUnlimitedStock(!!item.unlimitedStock);
    if (item.emoji) {
      setFormVisualType('emoji');
      setFormEmoji(item.emoji);
    } else {
      setFormVisualType('preset');
      setFormIconType(item.iconType);
    }
    setFormDesc(item.description || '');
    setFormIsHidden(!!item.isHidden);
    setIsItemModalOpen(true);
  };

  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formBasePrice < 0) return;

    if (modalMode === 'add') {
      const newItem: StoreItem = {
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        subtitle: formSubtitle.trim() || undefined,
        description: formDesc.trim() || undefined,
        category: formCategory,
        basePrice: Math.max(0, formBasePrice),
        discountPercent: Math.max(0, Math.min(100, formDiscountPercent)),
        stock: formUnlimitedStock ? 999 : Math.max(0, formStock),
        unlimitedStock: formUnlimitedStock,
        iconType: formVisualType === 'preset' ? formIconType : 'custom',
        emoji: formVisualType === 'emoji' ? formEmoji : undefined,
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
          description: formDesc.trim() || undefined,
          category: formCategory,
          basePrice: Math.max(0, formBasePrice),
          discountPercent: Math.max(0, Math.min(100, formDiscountPercent)),
          stock: formUnlimitedStock ? 999 : Math.max(0, formStock),
          unlimitedStock: formUnlimitedStock,
          iconType: formVisualType === 'preset' ? formIconType : 'custom',
          emoji: formVisualType === 'emoji' ? formEmoji : undefined,
          isHidden: formIsHidden,
        };
      });
      onUpdateCatalog(updated);
    }

    setIsItemModalOpen(false);
  };

  const handleApplyGlobalDiscount = (percent: number) => {
    const updated = storeCatalog.map((item) => ({
      ...item,
      discountPercent: percent,
    }));
    onUpdateCatalog(updated);
    setGlobalDiscountInput(percent);
  };

  const handleResetCatalog = () => {
    if (window.confirm('Reset catalog default items back to original pricing and stock? Custom items will be kept.')) {
      const restored = resetDefaultStoreItems(storeCatalog);
      onUpdateCatalog(restored);
    }
  };

  const handleExecutePurchase = () => {
    if (!activeSelectedItem || !currentStudent) return;
    if (isSelectedOutOfStock) {
      alert('This item is currently out of stock.');
      return;
    }
    if (!canAffordSelected) {
      alert(`Insufficient funds. Student has E$${currentStudent.currentBalance}, but this item costs E$${selectedItemEffectivePrice}.`);
      return;
    }

    onPurchaseItem(
      currentStudent.id,
      selectedItemEffectivePrice,
      activeSelectedItem,
      selectedItemEffectivePrice
    );

    if (!activeSelectedItem.unlimitedStock) {
      handleUpdateStock(activeSelectedItem.id, -1);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ES';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP CONTEXT ROW: APPLE WALLET CHIP & CATALOG CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Active Student Glass Chip */}
        {currentStudent ? (
          <div
            className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
              isDark
                ? 'bg-[#181d29]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.35)] text-white'
                : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}
          >
            {/* Initials Avatar */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#009b74] via-[#00c896] to-[#42e5b0] text-[#003828] flex items-center justify-center font-display text-sm font-bold shadow-[0_0_14px_rgba(66,229,176,0.3)] shrink-0">
              {getInitials(currentStudent.name)}
            </div>

            {/* Student Info & Tiers */}
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold text-sm truncate max-w-[200px]">
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
                  <span>{tierInfo?.name || 'Silver Tier'}</span>
                </span>
              </div>

              {/* Stats Sub-row */}
              <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Score: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{currentStudent.creditScore}</strong>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span>
                  Reserve: <strong className="text-[#42e5b0] font-bold">E${currentStudent.currentBalance}.00</strong>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-[#42e5b0] border border-emerald-500/30 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  +5 Boost
                </span>
              </div>
            </div>

            {/* Dedicated Switch Shopper Button (Never collides with anything) */}
            {students.length > 1 && onSelectStudent && (
              <button
                type="button"
                onClick={() => setIsShopperPickerOpen(true)}
                className={`ml-2 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title="Switch active shopper"
              >
                <Users className="w-3.5 h-3.5 text-[#42e5b0]" />
                <span className="hidden sm:inline">Switch</span>
              </button>
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
            const isReady = canAfford && !isOutOfStock;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`group relative flex flex-col justify-between rounded-xl p-4 border transition-all cursor-pointer ${
                  isReady && isSelected
                    ? isDark
                      ? 'bg-gradient-to-b from-[#1c2826] to-[#142023] border-2 border-[#42e5b0]/80 shadow-[0_0_25px_rgba(66,229,176,0.25)] ring-1 ring-[#42e5b0]'
                      : 'bg-emerald-50 border-2 border-[#42e5b0] shadow-md ring-1 ring-[#42e5b0]'
                    : isDark
                    ? 'bg-[#181d29]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-[#1f2535] hover:border-white/[0.14] hover:shadow-[0_8px_28px_rgba(0,0,0,0.45)]'
                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* READY TO PURCHASE GLOW BADGE (Exact Stitch Style) */}
                {isReady && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#42e5b0] text-[#003828] font-mono text-[9px] font-bold tracking-wide flex items-center gap-1 shadow-[0_0_12px_rgba(66,229,176,0.6)]">
                    <CheckCircle2 className="w-3 h-3 font-bold" />
                    <span>READY TO PURCHASE</span>
                  </div>
                )}

                {/* Card Top: Icon & Status */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#11151f] border border-white/[0.08] flex items-center justify-center text-[#42e5b0] group-hover:scale-105 transition-transform shadow-inner text-xl">
                    {item.emoji ? item.emoji : <StoreItemVisual iconType={item.iconType} className="w-6 h-6" />}
                  </div>

                  {!isReady && (
                    <div>
                      {item.isHidden && isTeacher && isEditMode ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                          Inactive
                        </span>
                      ) : isOutOfStock ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                          Out of stock
                        </span>
                      ) : !canAfford ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/30 font-semibold shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                          Needs E${effectivePrice - (currentStudent?.currentBalance || 0)}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Card Center: Titles & Description */}
                <div className="mt-3.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold truncate">
                    {item.subtitle || item.category}
                  </div>
                  <h3 className={`font-display font-semibold text-sm mt-0.5 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {item.name}
                  </h3>
                  <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.description || 'Standard non-summative classroom privilege authorization.'}
                  </p>
                </div>

                {/* Card Bottom: Cost Rate & Stock */}
                <div className="mt-3.5 pt-2.5 flex items-center justify-between border-t border-white/[0.05]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400">Cost Rate</span>
                    <div className="flex items-baseline gap-1 font-mono">
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-500 line-through">
                          E${item.basePrice}
                        </span>
                      )}
                      <span className="font-semibold text-sm text-[#42e5b0]">
                        E${effectivePrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300 bg-white/[0.05] border border-white/[0.06] px-2 py-1 rounded">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span>{item.unlimitedStock ? 'Unlimited' : `${item.stock} in stock`}</span>
                  </div>
                </div>

                {/* In Edit Mode: Teacher In-Card Controls */}
                {isTeacher && isEditMode && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-2.5 border-t border-amber-500/20 bg-amber-500/5 -mx-4 -mb-4 p-3 rounded-b-xl space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemPrice(item.id, -100)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                          title="Reduce price $100"
                        >
                          -
                        </button>
                        <span className="px-1 text-[11px] text-white font-bold">Price</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemPrice(item.id, 100)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                          title="Increase price $100"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStock(item.id, -1)}
                          disabled={item.unlimitedStock}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold disabled:opacity-30"
                          title="Reduce stock"
                        >
                          -
                        </button>
                        <span className="px-1 text-[11px] text-white font-bold">Stock</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateStock(item.id, 1)}
                          disabled={item.unlimitedStock}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold disabled:opacity-30"
                          title="Increase stock"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => handleToggleHideItem(item.id)}
                        className="flex items-center gap-1 text-[11px] text-amber-300 hover:underline"
                      >
                        {item.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{item.isHidden ? 'Show on shelf' : 'Hide / Inactive'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          title="Edit complete details"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300"
                          title="Delete item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel: Purchase Calculation & Checkout Glass Panel (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Apple Wallet Mini Ledger Preview Card (Exact Stitch Style) */}
          <div className="bg-gradient-to-br from-[#0c1f2e] via-[#0f343e] to-[#044c3c] text-white rounded-2xl p-5 border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between h-48">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(66,229,176,0.18),transparent_60%)] pointer-events-none" />
            <div className="flex justify-between items-start z-10">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-300 opacity-90">
                  Institutional Debit Card
                </div>
                <div className="font-display font-semibold text-sm tracking-wide text-white">
                  Colegio BGU Reserve
                </div>
              </div>
              <span className="font-mono text-[#4cd6fb] text-lg font-bold drop-shadow-[0_0_8px_rgba(76,214,251,0.5)]">
                ●)))
              </span>
            </div>

            <div className="z-10 flex items-center gap-3">
              <div className="w-8 h-6 rounded bg-amber-300/80 backdrop-blur-sm border border-amber-600/40 flex items-center justify-center">
                <span className="text-[10px] text-amber-950 font-mono font-bold">CHIP</span>
              </div>
              <span className="font-mono text-xs tracking-widest text-slate-200">
                •••• {currentStudent?.cardNumber ? currentStudent.cardNumber.slice(-4) : '7418'}
              </span>
            </div>

            <div className="flex justify-between items-end z-10">
              <div>
                <div className="font-mono text-[9px] text-slate-300 opacity-80 uppercase">
                  Cardholder
                </div>
                <div className="font-display font-semibold text-xs truncate max-w-[150px] text-white">
                  {currentStudent?.name || 'Student Shopper'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] text-slate-300 opacity-80 uppercase">
                  Available Balance
                </div>
                <div className="font-mono font-bold text-lg text-[#42e5b0] drop-shadow-[0_0_10px_rgba(66,229,176,0.4)]">
                  E${currentStudent?.currentBalance || 0}.00
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Sheet (Exact Stitch Style) */}
          <div
            className={`rounded-2xl p-5 border flex flex-col ${
              isDark
                ? 'bg-[#181d29]/85 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)] text-slate-100'
                : 'bg-white border-slate-200 shadow-xl text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#42e5b0]" />
                <h2 className="font-display font-semibold text-sm">Ledger Settlement</h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#42e5b0] border border-emerald-500/30 font-semibold shadow-[0_0_8px_rgba(66,229,176,0.2)]">
                {canAffordSelected && !isSelectedOutOfStock ? 'Ready' : 'Pending'}
              </span>
            </div>

            {/* Dynamic Balance Breakdown */}
            <div className="space-y-2.5 py-4 text-xs">
              <div className="flex justify-between items-center text-slate-400 font-mono">
                <span>Opening Available Reserve</span>
                <span className="font-semibold text-white">
                  E${currentStudent?.currentBalance || 0}.00
                </span>
              </div>

              {activeSelectedItem ? (
                <div
                  className={`flex justify-between items-start p-2.5 rounded-xl border ${
                    isDark ? 'bg-[#11151f]/90 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col pr-2 min-w-0">
                    <span className="font-semibold truncate">{activeSelectedItem.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {activeSelectedItem.subtitle || activeSelectedItem.category} &bull; 1 Authorization
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-400 drop-shadow-[0_0_6px_rgba(255,107,107,0.3)] shrink-0">
                    -E${selectedItemEffectivePrice}.00
                  </span>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 italic">No item selected from catalog</div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06] font-mono">
                <span className="font-semibold">Projected Net Reserve</span>
                <span className="font-bold text-base text-[#42e5b0] drop-shadow-[0_0_10px_rgba(66,229,176,0.4)]">
                  E${Math.max(0, (currentStudent?.currentBalance || 0) - selectedItemEffectivePrice)}.00
                </span>
              </div>
            </div>

            {/* Credit Metric Boost Indicator */}
            <div
              className={`p-3 rounded-xl border mb-4 flex items-center justify-between text-xs ${
                isDark ? 'bg-[#11151f]/90 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#ffc149] drop-shadow-[0_0_6px_rgba(255,193,73,0.5)]" />
                <div>
                  <div className="font-semibold text-[11px]">Credit Trajectory</div>
                  <div className="text-[10px] text-slate-400">Punctual settlement merit</div>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-[#42e5b0]">+5 pts</span>
            </div>

            {/* 1-Click Purchase CTA Button */}
            <button
              type="button"
              onClick={handleExecutePurchase}
              disabled={!activeSelectedItem || isSelectedOutOfStock || !canAffordSelected}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isSelectedOutOfStock
                  ? 'Item Out of Stock'
                  : !canAffordSelected
                  ? 'Insufficient Reserve'
                  : `Complete Settlement (E$${selectedItemEffectivePrice})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DEDICATED SHOPPER PICKER MODAL (ZERO COLLISION) */}
      {/* ======================================================== */}
      {isShopperPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`rounded-2xl border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#121622] border-white/[0.1] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/[0.08] bg-[#0b0e14]/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#42e5b0]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Select Student Shopper</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {students.length} student cardholders registered
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShopperPickerOpen(false)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white bg-white/[0.05] border-white/[0.08]'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className={`p-3 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={shopperSearch}
                  onChange={(e) => setShopperSearch(e.target.value)}
                  placeholder="Search student name or card number..."
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                    isDark
                      ? 'bg-[#181d29] border-white/[0.1] text-white placeholder-slate-500'
                      : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Shopper list */}
            <div className="p-2 space-y-1 overflow-y-auto max-h-[380px]">
              {filteredShoppers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No matching student found.</div>
              ) : (
                filteredShoppers.map((s) => {
                  const isCurrent = s.id === activeStudentId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setActiveStudentId(s.id);
                        if (onSelectStudent) onSelectStudent(s.id);
                        setIsShopperPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-[#42e5b0]/15 border-[#42e5b0]/40 text-white shadow-sm'
                          : isDark
                          ? 'bg-[#181d29]/40 border-white/[0.05] text-slate-300 hover:bg-[#181d29] hover:border-white/[0.1]'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#009b74] to-[#42e5b0] text-[#003828] font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(s.name)}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-xs truncate">{s.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            #{s.cardNumber ? s.cardNumber.slice(-4) : '••••'} &bull; Score: {s.creditScore}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#42e5b0] shrink-0 ml-2">
                        E${s.currentBalance}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FROSTED GLASS ADD / EDIT ITEM MODAL */}
      {/* ======================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isDark ? 'bg-[#121622] border-white/[0.1] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/[0.08] bg-[#0b0e14]/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#42e5b0]">
                  {modalMode === 'add' ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">
                    {modalMode === 'add' ? 'Add Store Privilege Item' : 'Edit Store Item'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Configure privilege title, pricing, stock and visuals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white bg-white/[0.05] border-white/[0.08]'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="p-4 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Skip Homework slip"
                  className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                    isDark
                      ? 'bg-[#181d29] border-white/[0.1] text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as StoreItem['category'])}
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="privilege">Privilege</option>
                    <option value="academic">Academic Boost</option>
                    <option value="prize">Prize / Keepsake</option>
                    <option value="game">Game / Raffle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Badge / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="e.g. Rare Vault"
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Base Price (E$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Discount % (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Stock controls */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formUnlimitedStock}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] disabled:opacity-40 ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUnlimitedStock}
                      onChange={(e) => setFormUnlimitedStock(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className="font-mono text-xs font-semibold">Unlimited Stock (∞)</span>
                  </label>
                </div>
              </div>

              {/* Emoji / Preset icon selector */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1.5">
                  Visual Emblem
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormVisualType('emoji')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs border ${
                      formVisualType === 'emoji'
                        ? 'bg-[#42e5b0] text-[#003828] font-bold border-[#42e5b0]'
                        : isDark
                        ? 'bg-[#181d29] text-slate-300 border-white/[0.1]'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    Custom Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormVisualType('preset')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs border ${
                      formVisualType === 'preset'
                        ? 'bg-[#42e5b0] text-[#003828] font-bold border-[#42e5b0]'
                        : isDark
                        ? 'bg-[#181d29] text-slate-300 border-white/[0.1]'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    Preset Card
                  </button>
                </div>

                {formVisualType === 'emoji' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formEmoji}
                      onChange={(e) => setFormEmoji(e.target.value)}
                      placeholder="e.g. 🍕, 🎮, 🎟️, 🏆"
                      className={`w-24 px-3 py-2 rounded-xl border text-xl text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                        isDark
                          ? 'bg-[#181d29] border-white/[0.1] text-white'
                          : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {['🎟️', '🍕', '🎮', '📚', '⭐', '🏆', '🎁', '🎧', '⚡'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setFormEmoji(em)}
                          className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.15] text-base flex items-center justify-center transition-all"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={formIconType}
                    onChange={(e) => setFormIconType(e.target.value as StoreItem['iconType'])}
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                      isDark
                        ? 'bg-[#181d29] border-white/[0.1] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="skip_hw">Skip Homework Card</option>
                    <option value="skip_lesson">Skip Lesson Pass</option>
                    <option value="extra_points">3 Extra Points Booster</option>
                    <option value="half_lesson">Half Lesson Waiver</option>
                    <option value="spin_wheel">Lucky Spin Wheel</option>
                    <option value="mystery_box">Mystery Box Vault</option>
                    <option value="gift">Gift / Prize</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Explanation of conditions and classroom waiver rules..."
                  className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[#42e5b0] ${
                    isDark
                      ? 'bg-[#181d29] border-white/[0.1] text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsHidden}
                    onChange={(e) => setFormIsHidden(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="font-mono text-xs text-amber-300 font-semibold">
                    Hide from student shoppers (Inactive / Draft)
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] font-mono text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  {modalMode === 'add' ? 'Add to Catalog' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
