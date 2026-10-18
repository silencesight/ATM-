import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
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
  Square,
  School,
  Globe,
  Building2,
} from 'lucide-react';
import { Student, StoreItem, StorePurchaseTransaction, Classroom } from '../types';
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
  classrooms?: Classroom[];
  selectedClassId?: string;
  onPurchaseItem: (
    studentId: string,
    amount: number,
    item: StoreItem,
    finalPrice: number,
    quantity?: number
  ) => void;
  onCheckoutCart?: (
    studentId: string,
    cartItems: { item: StoreItem; quantity: number; effectiveUnitPrice: number }[]
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
  classrooms = [],
  selectedClassId,
  onPurchaseItem,
  onCheckoutCart,
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

  const currentStudent = students.find((s) => s.id === activeStudentId) || students[0];
  const tierInfo = currentStudent ? getCreditTier(currentStudent.creditScore) : null;

  // Course store scoping filter
  const [selectedStoreClassId, setSelectedStoreClassId] = useState<string>(
    selectedClassId || currentStudent?.classId || 'all'
  );

  useEffect(() => {
    if (selectedClassId) {
      setSelectedStoreClassId(selectedClassId);
    }
  }, [selectedClassId]);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'privilege' | 'academic' | 'prize' | 'game'>('all');
  const [globalDiscountInput, setGlobalDiscountInput] = useState<number>(0);

  // Dedicated Shopper Picker Modal (prevents any UI collision)
  const [isShopperPickerOpen, setIsShopperPickerOpen] = useState(false);
  const [shopperSearch, setShopperSearch] = useState('');
  const [shopperClassFilter, setShopperClassFilter] = useState('all');

  // Selected item for Settlement Drawer
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [singleQty, setSingleQty] = useState<number>(1);

  // Multi-item Shopping Cart state
  const [cart, setCart] = useState<Record<string, number>>({});
  const [settlementTab, setSettlementTab] = useState<'single' | 'cart'>('single');

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
  const [formClassroomId, setFormClassroomId] = useState<string>('all');

  // Reset single quantity when active item changes
  useEffect(() => {
    setSingleQty(1);
  }, [selectedItemId]);

  // Filtered items (respects isHidden, category, search, and course store)
  const filteredCatalog = storeCatalog.filter((item) => {
    if (item.isHidden && (!isTeacher || !isEditMode)) {
      return false;
    }
    // Course store filtering:
    if (selectedStoreClassId !== 'all') {
      const isUniversal = !item.classroomId || item.classroomId === 'all';
      const isMatch = item.classroomId === selectedStoreClassId;
      if (!isUniversal && !isMatch) return false;
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

  const singleTotalCost = selectedItemEffectivePrice * singleQty;
  const canAffordSingle =
    currentStudent && currentStudent.currentBalance >= singleTotalCost;
  const isSelectedOutOfStock =
    activeSelectedItem &&
    activeSelectedItem.stock < singleQty &&
    !activeSelectedItem.unlimitedStock;

  // Shopping Cart items and totals
  const cartItemsList = useMemo(() => {
    return Object.entries(cart)
      .map(([itemId, rawQty]) => {
        const quantity = Number(rawQty) || 0;
        const item = storeCatalog.find((i) => i.id === itemId);
        if (!item || quantity <= 0) return null;
        const effectiveUnitPrice = calculateEffectiveItemPrice(item);
        return {
          item,
          quantity,
          effectiveUnitPrice,
          subtotal: effectiveUnitPrice * quantity,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [cart, storeCatalog]);

  const totalCartCount = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItemsList]);

  const totalCartCost = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItemsList]);

  const canAffordCart = currentStudent && currentStudent.currentBalance >= totalCartCost;

  // Cart operations
  const handleAddToCart = (item: StoreItem, qtyToAdd: number = 1) => {
    setCart((prev) => {
      const currentInCart = prev[item.id] || 0;
      const maxAvailable = item.unlimitedStock ? 9999 : item.stock;
      const targetQty = Math.min(maxAvailable, currentInCart + qtyToAdd);
      return {
        ...prev,
        [item.id]: targetQty,
      };
    });
  };

  const handleUpdateCartItemQty = (itemId: string, newQty: number) => {
    const item = storeCatalog.find((i) => i.id === itemId);
    if (!item) return;
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    const maxAvailable = item.unlimitedStock ? 9999 : item.stock;
    const clampedQty = Math.min(maxAvailable, newQty);
    setCart((prev) => ({
      ...prev,
      [itemId]: clampedQty,
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

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

  const handleUpdateItemPrice = (itemId: string, delta: number) => {
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      const newPrice = Math.max(0, item.basePrice + delta);
      return { ...item, basePrice: newPrice };
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
      handleRemoveFromCart(item.id);
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
    setFormClassroomId(selectedStoreClassId !== 'all' ? selectedStoreClassId : 'all');
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
    setFormClassroomId(item.classroomId || 'all');
    setIsItemModalOpen(true);
  };

  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formBasePrice < 0) return;

    const assignedClassroom = formClassroomId === 'all' ? undefined : formClassroomId;

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
        classroomId: assignedClassroom,
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
          classroomId: assignedClassroom,
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

  // Execute single item purchase with quantity
  const handleExecutePurchase = () => {
    if (!activeSelectedItem || !currentStudent) return;
    if (isSelectedOutOfStock) {
      alert(`This item only has ${activeSelectedItem.stock} in stock (requested ${singleQty}).`);
      return;
    }
    if (!canAffordSingle) {
      alert(`Insufficient funds. Student has E$${currentStudent.currentBalance}, but this purchase costs E$${singleTotalCost}.`);
      return;
    }

    onPurchaseItem(
      currentStudent.id,
      singleTotalCost,
      activeSelectedItem,
      selectedItemEffectivePrice,
      singleQty
    );

    setSingleQty(1);
  };

  // Execute multi-item cart batch checkout
  const handleExecuteCartCheckout = () => {
    if (!currentStudent || cartItemsList.length === 0) return;
    if (!canAffordCart) {
      alert(`Insufficient funds. Student has E$${currentStudent.currentBalance}, but cart total is E$${totalCartCost}.`);
      return;
    }

    if (onCheckoutCart) {
      onCheckoutCart(
        currentStudent.id,
        cartItemsList.map((c) => ({
          item: c.item,
          quantity: c.quantity,
          effectiveUnitPrice: c.effectiveUnitPrice,
        }))
      );
    }
    setCart({});
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
      {/* 1. TOP AMBIENT GLASS HEADER: STUDENT HUD & STORE CONTROLS */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 specular-edge flex flex-wrap items-center justify-between gap-4">
        {/* Left: Active Student Shopper Telemetry Pill */}
        {currentStudent ? (
          <div className="flex items-center gap-3.5 glass-well p-2.5 pr-4 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-container to-tertiary-container text-on-primary-fixed flex items-center justify-center font-headline text-sm font-extrabold shadow-md shrink-0">
              {getInitials(currentStudent.name)}
            </div>

            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline font-bold text-sm text-on-surface truncate max-w-[200px]">
                  {currentStudent.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-pill text-on-surface-variant">
                  #{currentStudent.studentIdNumber || currentStudent.cardNumber.slice(-4)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>{tierInfo?.name || 'Silver Tier'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                <span className="text-on-surface-variant">
                  FICO: <strong className="text-on-surface">{currentStudent.creditScore}</strong>
                </span>
                <span className="w-1 h-1 rounded-full bg-outline" />
                <span className="text-on-surface-variant">
                  Reserve:{' '}
                  <strong className="text-tertiary-fixed-dim font-extrabold">
                    E$ {currentStudent.currentBalance}.00
                  </strong>
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-tertiary-container/15 text-tertiary-fixed-dim border border-tertiary-container/30 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  +5 Score Boost
                </span>
              </div>
            </div>

            {students.length > 1 && onSelectStudent && (
              <button
                type="button"
                onClick={() => setIsShopperPickerOpen(true)}
                className="ml-1 px-3 py-1.5 rounded-xl glass-pill hover:border-primary-container/50 text-xs font-mono font-bold text-on-surface flex items-center gap-1.5 transition-all"
                title="Switch active shopper"
              >
                <Users className="w-3.5 h-3.5 text-primary-container" />
                <span className="hidden sm:inline">Switch</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-on-surface-variant italic">No student selected</div>
        )}

        {/* Right: Category Segment Canal & Teacher Store Governance */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-full glass-well">
            {(['all', 'privilege', 'academic', 'prize', 'game'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-headline font-bold transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat === 'all' ? 'All Privileges' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {isTeacher && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  isEditMode
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/25'
                    : 'glass-pill text-on-surface hover:border-primary-container/50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-primary-container" />
                <span>{isEditMode ? 'Exit Manage' : 'Manage Store'}</span>
              </button>

              {isEditMode && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-3.5 py-2 liquid-button-emerald rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCatalog}
                    className="p-2 rounded-full glass-pill text-on-surface-variant hover:text-on-surface transition-colors"
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

      {/* ======================================================== */}
      {/* 2. COURSE-SPECIFIC STORE SELECTOR BAR */}
      {/* ======================================================== */}
      <div className="glass-panel p-2.5 rounded-2xl flex items-center gap-2 overflow-x-auto specular-edge">
        <div className="flex items-center gap-1.5 pl-2 pr-2 border-r border-outline-variant/25 shrink-0">
          <School className="w-4 h-4 text-primary-container" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
            Course Store:
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedStoreClassId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            selectedStoreClassId === 'all'
              ? 'bg-primary-container text-on-primary-fixed shadow-sm'
              : 'glass-well text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>All Stores (Universal)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 font-mono">
            {storeCatalog.length}
          </span>
        </button>

        {classrooms.map((cls) => {
          const isSelected = selectedStoreClassId === cls.id;
          const count = storeCatalog.filter(
            (i) => i.classroomId === cls.id || !i.classroomId || i.classroomId === 'all'
          ).length;

          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedStoreClassId(cls.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'glass-well text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{cls.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Global Discount Flash Sale Bar (in edit mode) */}
      {isEditMode && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-400/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Global Flash Sale:
            </span>
            <span className="text-xs text-on-surface-variant">
              Apply a catalog-wide promotional discount with one click:
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 10, 20, 25, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyGlobalDiscount(pct)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                  globalDiscountInput === pct
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'glass-well text-amber-300 hover:border-amber-400/50'
                }`}
              >
                {pct === 0 ? 'No Sale (0%)' : `-${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE SPLIT: 8-COL CATALOG + 4-COL SETTLEMENT */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Privilege Catalog Bento Grid */}
        <div className="xl:col-span-8">
          {filteredCatalog.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl specular-edge">
              <Package className="w-10 h-10 mx-auto text-on-surface-variant mb-3 opacity-60" />
              <h3 className="font-headline font-bold text-sm text-on-surface">
                No items found for this course store
              </h3>
              <p className="text-xs mt-1 font-mono text-on-surface-variant">
                Switch to &quot;All Stores (Universal)&quot; or use &quot;Manage Store &rarr; Add Item&quot; to stock privileges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalog.map((item) => {
                const effectivePrice = calculateEffectiveItemPrice(item);
                const hasDiscount = item.discountPercent > 0;
                const isOutOfStock = item.stock <= 0 && !item.unlimitedStock;
                const canAfford =
                  currentStudent && currentStudent.currentBalance >= effectivePrice;
                const isSelected = activeSelectedItem?.id === item.id;
                const isReady = canAfford && !isOutOfStock;
                const inCartQty = cart[item.id] || 0;
                const assignedClass = classrooms.find((c) => c.id === item.classroomId);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setSettlementTab('single');
                    }}
                    className={`group relative flex flex-col justify-between rounded-3xl p-5 transition-all cursor-pointer ${
                      isSelected
                        ? 'glass-panel border-2 border-primary-container shadow-[0_0_30px_rgba(0,240,255,0.18)] ring-1 ring-primary-container/50'
                        : 'glass-card-interactive'
                    }`}
                  >
                    {/* READY TO PURCHASE GLOW BADGE */}
                    {isReady && (
                      <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-fixed font-mono text-[9px] font-bold tracking-wider flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>READY TO REDEEM</span>
                      </div>
                    )}

                    {/* Card Top: Icon Pod & Scope Badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-2xl glass-well flex items-center justify-center transition-transform group-hover:scale-105">
                        <StoreItemVisual
                          iconType={item.iconType}
                          emoji={item.emoji}
                          category={item.category}
                          className="w-5 h-5"
                        />
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {assignedClass ? (
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{assignedClass.name}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full glass-well text-on-surface-variant">
                            Universal
                          </span>
                        )}

                        {!isReady && (
                          <div>
                            {item.isHidden && isTeacher && isEditMode ? (
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                Inactive
                              </span>
                            ) : isOutOfStock ? (
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full glass-well text-outline font-bold">
                                Out of stock
                              </span>
                            ) : !canAfford ? (
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-error-container/50 text-error border border-error/40 font-bold">
                                Short E$ {effectivePrice - (currentStudent?.currentBalance || 0)}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Center: Titles & Description */}
                    <div className="mt-4">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold truncate">
                        {item.subtitle || item.category}
                      </div>
                      <h3 className="font-headline font-bold text-sm sm:text-base mt-0.5 truncate text-on-surface">
                        {item.name}
                      </h3>
                      <p className="text-xs mt-1 line-clamp-2 leading-relaxed text-on-surface-variant">
                        {item.description ||
                          'Authorized classroom privilege redeemed via Eurodollar balance.'}
                      </p>
                    </div>

                    {/* Card Bottom: Cost Rate & Quick Add to Cart */}
                    <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                          Tariff Rate
                        </span>
                        <div className="flex items-baseline gap-1.5 font-mono">
                          {hasDiscount && (
                            <span className="text-[10px] text-outline line-through">
                              E${item.basePrice}
                            </span>
                          )}
                          <span className="font-extrabold text-base text-tertiary-fixed-dim">
                            E$ {effectivePrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant glass-well px-2.5 py-1 rounded-lg">
                          <Package className="w-3 h-3 text-primary-container" />
                          <span>{item.unlimitedStock ? '∞' : `${item.stock}`}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, 1);
                          }}
                          disabled={isOutOfStock}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                            inCartQty > 0
                              ? 'bg-tertiary-container text-on-tertiary-fixed shadow-sm'
                              : 'glass-pill text-on-surface hover:border-primary-container/50'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                          title="Add item to shopping cart"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>{inCartQty > 0 ? `+1 (${inCartQty})` : '+ Cart'}</span>
                        </button>
                      </div>
                    </div>

                    {/* In Edit Mode: Teacher In-Card Controls */}
                    {isTeacher && isEditMode && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2.5 border-t border-amber-400/30 glass-well -mx-2 -mb-2 p-3 rounded-2xl space-y-2 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemPrice(item.id, -25)}
                              className="w-6 h-6 rounded-lg glass-pill text-on-surface flex items-center justify-center font-bold"
                              title="Reduce price E$25"
                            >
                              -
                            </button>
                            <span className="px-1 text-[11px] text-on-surface font-bold">
                              Price
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemPrice(item.id, 25)}
                              className="w-6 h-6 rounded-lg glass-pill text-on-surface flex items-center justify-center font-bold"
                              title="Increase price E$25"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item.id, -1)}
                              disabled={item.unlimitedStock}
                              className="w-6 h-6 rounded-lg glass-pill text-on-surface flex items-center justify-center font-bold disabled:opacity-30"
                              title="Reduce stock"
                            >
                              -
                            </button>
                            <span className="px-1 text-[11px] text-on-surface font-bold">
                              Stock
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item.id, 1)}
                              disabled={item.unlimitedStock}
                              className="w-6 h-6 rounded-lg glass-pill text-on-surface flex items-center justify-center font-bold disabled:opacity-30"
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                          <button
                            type="button"
                            onClick={() => handleToggleHideItem(item.id)}
                            className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                          >
                            {item.isHidden ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            <span>{item.isHidden ? 'Show on shelf' : 'Hide / Inactive'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg glass-pill text-on-surface"
                              title="Edit complete details"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg bg-error-container text-on-error-container"
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
          )}
        </div>

        {/* Right 4 Columns: Ledger Settlement Dock & Quick Roster Switcher */}
        <div className="xl:col-span-4 flex flex-col gap-5 sticky top-20">
          {/* Holographic Institutional SmartPass Preview Card */}
          <div className="holo-card-cyan text-white rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between h-48">
            <div className="holo-sheen absolute inset-0 pointer-events-none opacity-80" />
            <div className="flex justify-between items-start z-10">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/90 font-bold">
                  AERO SMARTPASS • POS TERMINAL
                </div>
                <div className="font-headline font-bold text-sm tracking-wide text-white mt-0.5">
                  ESL Privilege Reserve
                </div>
              </div>
              <span className="font-mono text-cyan-200 text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25">
                NFC READY
              </span>
            </div>

            <div className="z-10 flex items-center gap-3">
              <div className="w-9 h-6 rounded bg-gradient-to-tr from-amber-500 to-yellow-200 border border-amber-600/50 flex items-center justify-center">
                <span className="text-[9px] text-amber-950 font-mono font-bold">EMV</span>
              </div>
              <span className="font-mono text-xs tracking-[0.2em] text-white">
                •••• {currentStudent?.cardNumber ? currentStudent.cardNumber.slice(-4) : '7418'}
              </span>
            </div>

            <div className="flex justify-between items-end z-10 pt-2 border-t border-white/15">
              <div>
                <div className="font-mono text-[9px] text-cyan-100/80 uppercase">
                  Authorized Shopper
                </div>
                <div className="font-headline font-bold text-sm truncate max-w-[160px] text-white">
                  {currentStudent?.name || 'Student Shopper'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] text-cyan-100/80 uppercase">
                  Available Reserve
                </div>
                <div className="font-mono font-extrabold text-lg text-emerald-300">
                  E$ {currentStudent?.currentBalance || 0}.00
                </div>
              </div>
            </div>
          </div>

          {/* Checkout & Settlement Refractive Sheet */}
          <div className="glass-panel rounded-3xl p-5 flex flex-col specular-edge">
            {/* Settlement Mode Selector: Quick Item vs Multi-Item Cart */}
            <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/20">
              <div className="flex items-center gap-1 p-1 rounded-full glass-well">
                <button
                  type="button"
                  onClick={() => setSettlementTab('single')}
                  className={`px-3.5 py-1 rounded-full text-xs font-headline font-bold transition-all ${
                    settlementTab === 'single'
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Single Item
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementTab('cart')}
                  className={`px-3.5 py-1 rounded-full text-xs font-headline font-bold transition-all flex items-center gap-1.5 ${
                    settlementTab === 'cart'
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Cart ({totalCartCount})</span>
                </button>
              </div>

              {settlementTab === 'cart' && totalCartCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[10px] font-mono text-error hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* TAB 1: SINGLE ITEM SETTLEMENT */}
            {settlementTab === 'single' && (
              <div className="space-y-4 py-4 text-xs">
                <div className="flex justify-between items-center text-on-surface-variant font-mono">
                  <span>Opening Available Reserve</span>
                  <span className="font-bold text-on-surface">
                    E$ {currentStudent?.currentBalance || 0}.00
                  </span>
                </div>

                {activeSelectedItem ? (
                  <div className="p-3.5 rounded-2xl glass-well space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col pr-2 min-w-0">
                        <span className="font-headline font-bold truncate text-sm text-on-surface">
                          {activeSelectedItem.name}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant truncate">
                          {activeSelectedItem.subtitle || activeSelectedItem.category} • Unit: E${' '}
                          {selectedItemEffectivePrice}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-error shrink-0">
                        -E$ {singleTotalCost}.00
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                      <span className="text-[11px] font-mono text-on-surface-variant font-semibold">
                        Quantity:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <button
                          type="button"
                          onClick={() => setSingleQty(Math.max(1, singleQty - 1))}
                          disabled={singleQty <= 1}
                          className="w-6 h-6 rounded-lg glass-pill text-on-surface flex items-center justify-center font-bold disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-on-surface">
                          {singleQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !activeSelectedItem.unlimitedStock &&
                              singleQty >= activeSelectedItem.stock
                            )
                              return;
                            setSingleQty(singleQty + 1);
                          }}
                          disabled={
                            !activeSelectedItem.unlimitedStock &&
                            singleQty >= activeSelectedItem.stock
                          }
                          className="w-6 h-6 rounded-lg glass-pill text-on-surface flex items-center justify-center font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-on-surface-variant italic">
                    Select a privilege from the catalog
                  </div>
                )}

                <div className="flex justify-between items-center text-on-surface-variant font-mono">
                  <span>Treasury Settlement Fee</span>
                  <span className="text-tertiary-fixed-dim">E$ 0.00 (Waived)</span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-outline-variant/25 font-mono">
                  <span className="font-bold text-on-surface font-headline">
                    Projected Net Reserve
                  </span>
                  <span className="font-extrabold text-base text-tertiary-fixed-dim">
                    E$ {Math.max(0, (currentStudent?.currentBalance || 0) - singleTotalCost)}.00
                  </span>
                </div>

                {/* Credit Score Trajectory Strip */}
                <div className="p-3 rounded-2xl glass-well flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-container" />
                    <div>
                      <div className="font-headline font-bold text-[11px] text-on-surface">
                        Credit Trajectory
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        Solvent privilege redemption
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-tertiary-fixed-dim">
                    +5 PTS
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecutePurchase}
                    disabled={!activeSelectedItem || isSelectedOutOfStock || !canAffordSingle}
                    className="w-full py-3.5 liquid-button-emerald disabled:opacity-40 disabled:cursor-not-allowed font-headline font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      {isSelectedOutOfStock
                        ? 'Insufficient Stock'
                        : !canAffordSingle
                        ? 'Insufficient Reserve'
                        : `Authorize Redemption • E$ ${singleTotalCost} (x${singleQty})`}
                    </span>
                  </button>

                  {activeSelectedItem && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart(activeSelectedItem, singleQty);
                        setSettlementTab('cart');
                      }}
                      disabled={isSelectedOutOfStock}
                      className="w-full py-2.5 rounded-full glass-pill hover:border-primary-container/50 text-xs font-mono font-bold text-on-surface flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-primary-container" />
                      <span>Add {singleQty} to Cart &amp; Review</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MULTI-ITEM SHOPPING CART CHECKOUT */}
            {settlementTab === 'cart' && (
              <div className="space-y-3.5 py-3.5 text-xs">
                {cartItemsList.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant font-mono space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto text-outline opacity-60" />
                    <p className="text-xs">Your shopping cart is empty.</p>
                    <p className="text-[11px] text-outline">
                      Click &quot;+ Cart&quot; on any store privilege cards to build a multi-item bundle!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {cartItemsList.map((c) => (
                        <div
                          key={c.item.id}
                          className="p-2.5 rounded-2xl glass-well flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-xl glass-pill flex items-center justify-center text-sm shrink-0">
                              {c.item.emoji || '🎁'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-headline font-bold text-xs text-on-surface truncate max-w-[130px]">
                                {c.item.name}
                              </div>
                              <div className="text-[10px] text-on-surface-variant font-mono">
                                E$ {c.effectiveUnitPrice} ea
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 font-mono">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCartItemQty(c.item.id, c.quantity - 1)
                                }
                                className="w-5 h-5 rounded glass-pill text-on-surface flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-xs text-on-surface">
                                {c.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCartItemQty(c.item.id, c.quantity + 1)
                                }
                                disabled={
                                  !c.item.unlimitedStock && c.quantity >= c.item.stock
                                }
                                className="w-5 h-5 rounded glass-pill text-on-surface flex items-center justify-center font-bold text-xs disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-mono font-bold text-error text-xs w-16 text-right">
                              -E${c.subtotal}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(c.item.id)}
                              className="text-on-surface-variant hover:text-error p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-outline-variant/20 font-mono text-[11px]">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Items in Bundle</span>
                        <span className="font-bold text-on-surface">
                          {totalCartCount} item{totalCartCount > 1 ? 's' : ''} (
                          {cartItemsList.length} unique)
                        </span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Total Checkout Debit</span>
                        <span className="font-bold text-error">-E$ {totalCartCost}.00</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-outline-variant/20 text-xs">
                        <span className="font-bold text-on-surface font-headline">
                          Projected Net Reserve
                        </span>
                        <span className="font-extrabold text-base text-tertiary-fixed-dim">
                          E$ {Math.max(0, (currentStudent?.currentBalance || 0) - totalCartCost)}.00
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl glass-well flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary-container" />
                        <span className="text-[11px] font-headline font-bold text-on-surface">
                          Multi-Item Loyalty Bonus
                        </span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-tertiary-fixed-dim">
                        +{Math.min(25, 5 * cartItemsList.length)} PTS
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteCartCheckout}
                      disabled={cartItemsList.length === 0 || !canAffordCart}
                      className="w-full py-3.5 liquid-button-emerald disabled:opacity-40 disabled:cursor-not-allowed font-headline font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>
                        {!canAffordCart
                          ? 'Insufficient Reserve for Cart'
                          : `Authorize Bundle (${totalCartCount} items • E$ ${totalCartCost})`}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DEDICATED SHOPPER PICKER MODAL */}
      {/* ======================================================== */}
      {isShopperPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-on-surface border border-outline-variant/30">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Select Student Shopper
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    {students.length} student cardholders registered
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShopperPickerOpen(false)}
                className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-outline-variant/20">
              <div className="relative">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={shopperSearch}
                  onChange={(e) => setShopperSearch(e.target.value)}
                  placeholder="Search student name or card number..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono glass-well text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div className="p-2.5 space-y-1.5 overflow-y-auto max-h-[380px]">
              {filteredShoppers.length === 0 ? (
                <div className="text-center py-8 text-xs text-on-surface-variant">
                  No matching student found.
                </div>
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
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-primary-container/15 border-primary-container/50 text-on-surface specular-edge'
                          : 'glass-well border-transparent hover:border-primary-container/30 text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-container to-tertiary-container text-on-primary-fixed font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(s.name)}
                        </div>
                        <div className="truncate">
                          <div className="font-headline font-bold text-xs truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono">
                            #{s.cardNumber ? s.cardNumber.slice(-4) : '••••'} • Score:{' '}
                            {s.creditScore}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-tertiary-fixed-dim shrink-0 ml-2">
                        E$ {s.currentBalance}
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
      {/* 5. FROSTED GLASS ADD / EDIT ITEM MODAL */}
      {/* ======================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-on-surface">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
                  {modalMode === 'add' ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    {modalMode === 'add' ? 'Add Store Privilege Item' : 'Edit Store Item'}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    Configure course scoping, title, pricing, stock and visuals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveItemModal}
              className="p-5 space-y-3.5 overflow-y-auto text-xs"
            >
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Course Store Assignment
                </label>
                <select
                  value={formClassroomId}
                  onChange={(e) => setFormClassroomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none focus:border-primary-container"
                >
                  <option value="all">🌐 Universal (Shared across all courses)</option>
                  {classrooms.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      🏫 {cls.name} {cls.section ? `(${cls.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Skip Homework Slip"
                  className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as StoreItem['category'])
                    }
                    className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none focus:border-primary-container"
                  >
                    <option value="privilege">Privilege</option>
                    <option value="academic">Academic Boost</option>
                    <option value="prize">Prize / Keepsake</option>
                    <option value="game">Game / Raffle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Badge / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="e.g. Rare Vault"
                    className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Base Price (E$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl glass-well font-mono font-bold text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Discount % (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formUnlimitedStock}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none focus:border-primary-container disabled:opacity-40"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUnlimitedStock}
                      onChange={(e) => setFormUnlimitedStock(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-mono text-xs font-semibold text-on-surface">
                      Unlimited Stock (∞)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1.5">
                  Visual Emblem
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormVisualType('emoji')}
                    className={`px-3 py-1 rounded-full font-mono text-xs ${
                      formVisualType === 'emoji'
                        ? 'bg-primary-container text-on-primary-fixed font-bold'
                        : 'glass-well text-on-surface-variant'
                    }`}
                  >
                    Custom Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormVisualType('preset')}
                    className={`px-3 py-1 rounded-full font-mono text-xs ${
                      formVisualType === 'preset'
                        ? 'bg-primary-container text-on-primary-fixed font-bold'
                        : 'glass-well text-on-surface-variant'
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
                      className="w-24 px-3 py-2 rounded-xl glass-well text-xl text-center font-mono text-on-surface focus:outline-none"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {['🎟️', '🍕', '🎮', '📚', '⭐', '🏆', '🎁', '🎧', '⚡'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setFormEmoji(em)}
                          className="w-8 h-8 rounded-xl glass-well hover:border-primary-container/50 text-base flex items-center justify-center transition-all"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={formIconType}
                    onChange={(e) =>
                      setFormIconType(e.target.value as StoreItem['iconType'])
                    }
                    className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none"
                  >
                    <option value="skip-hw">Skip Homework Card</option>
                    <option value="skip-lesson">Skip Lesson Pass</option>
                    <option value="extra-points-hw">3 Extra Points Booster</option>
                    <option value="half-lesson">Half Lesson Waiver</option>
                    <option value="lucky-draw">Lucky Draw Spin</option>
                    <option value="super-mini-prize">Super Mini Prize</option>
                    <option value="extra-points-lss">3 Extra Points Lesson</option>
                    <option value="mini-prize">Mini Prize Box</option>
                    <option value="big-prize">Big Prize Vault</option>
                    <option value="custom">Generic Privilege</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Explanation of conditions and classroom waiver rules..."
                  className="w-full px-3 py-2 rounded-xl glass-well font-mono text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsHidden}
                    onChange={(e) => setFormIsHidden(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    Hide from student shoppers (Inactive / Draft)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-full glass-pill font-mono text-xs text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 liquid-button-emerald font-bold font-headline text-xs uppercase tracking-wider rounded-full"
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
