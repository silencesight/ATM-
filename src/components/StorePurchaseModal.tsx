import React, { useState } from 'react';
import {
  ShoppingBag,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Tag,
  ArrowRight,
  Sliders,
  Plus,
  Minus,
  Percent,
  TrendingUp,
  Package
} from 'lucide-react';
import { Student, StoreItem } from '../types';
import { StoreItemVisual } from './StoreItemVisual';
import { calculateEffectiveItemPrice, DEFAULT_STORE_ITEMS } from '../data/storeCatalog';

interface StorePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onConfirmDeduction: (
    studentId: string,
    amount: number,
    note: string,
    storeDetails?: {
      itemId?: string;
      itemName: string;
      originalPrice: number;
      discountPercent: number;
    }
  ) => void;
  storeCatalog?: StoreItem[];
  onUpdateCatalog?: (newCatalog: StoreItem[]) => void;
}

export const StorePurchaseModal: React.FC<StorePurchaseModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmDeduction,
  storeCatalog = DEFAULT_STORE_ITEMS,
  onUpdateCatalog,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [customNote, setCustomNote] = useState<string>('Classroom Store Purchase');
  const [mode, setMode] = useState<'catalog' | 'custom' | 'manage'>('catalog');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBalance = student.currentBalance;
  const activeCatalog = storeCatalog.filter((item) => !item.isHidden);
  const selectedItem = (mode === 'manage' ? storeCatalog : activeCatalog).find((i) => i.id === selectedItemId);

  const deductionAmount =
    mode === 'catalog' && selectedItem
      ? calculateEffectiveItemPrice(selectedItem)
      : customAmount;

  const remainingBalance = currentBalance - (deductionAmount || 0);
  const isInvalid =
    deductionAmount <= 0 ||
    deductionAmount > currentBalance ||
    (mode === 'catalog' && !selectedItem) ||
    (mode === 'catalog' && selectedItem && selectedItem.stock <= 0 && !selectedItem.unlimitedStock);

  // Stock management within modal
  const handleUpdateStock = (itemId: string, delta: number) => {
    if (!onUpdateCatalog) return;
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, stock: Math.max(0, item.stock + delta) };
    });
    onUpdateCatalog(updated);
  };

  // Price adjustment within modal
  const handleAdjustPrice = (itemId: string, delta: number) => {
    if (!onUpdateCatalog) return;
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, basePrice: Math.max(10, item.basePrice + delta) };
    });
    onUpdateCatalog(updated);
  };

  // Discount adjustment within modal
  const handleSetDiscount = (itemId: string, discountPercent: number) => {
    if (!onUpdateCatalog) return;
    const updated = storeCatalog.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, discountPercent };
    });
    onUpdateCatalog(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deductionAmount <= 0) {
      setError('Please enter a purchase amount greater than $0.');
      return;
    }
    if (deductionAmount > currentBalance) {
      setError(`Insufficient balance. ${student.name} only has $${currentBalance}.00 available.`);
      return;
    }

    if (mode === 'catalog' && selectedItem) {
      if (selectedItem.stock <= 0 && !selectedItem.unlimitedStock) {
        setError(`"${selectedItem.name}" is currently out of stock.`);
        return;
      }

      onConfirmDeduction(
        student.id,
        deductionAmount,
        selectedItem.name,
        {
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          originalPrice: selectedItem.basePrice,
          discountPercent: selectedItem.discountPercent,
        }
      );
    } else {
      onConfirmDeduction(
        student.id,
        deductionAmount,
        customNote.trim() || 'Store Purchase'
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  The Store • Debit & Purchase
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  1st BGU Catalog
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Purchase privileges & reward boxes • <strong className="text-emerald-400">+5 Credit Score</strong> per purchase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Mini Card */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono">
              {student.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{student.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                Card #{student.cardNumber.slice(-4)} • Score:{' '}
                <strong className="text-blue-400">{student.creditScore}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Available Balance</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                ${currentBalance}.00
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>+5 Score Boost</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('catalog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mode === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1st BGU Catalog
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mode === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Amount Debit
            </button>
          </div>

          {onUpdateCatalog && (
            <button
              type="button"
              onClick={() => setMode(mode === 'manage' ? 'catalog' : 'manage')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border transition-all ${
                mode === 'manage'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>{mode === 'manage' ? 'Done Managing' : 'Edit Stock & Prices'}</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: CATALOG SELECTION */}
          {mode === 'catalog' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  Select Store Item ({activeCatalog.length} available)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Click an item to select
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {activeCatalog.map((item) => {
                  const effectivePrice = calculateEffectiveItemPrice(item);
                  const isSelected = selectedItemId === item.id;
                  const isOut = item.stock <= 0 && !item.unlimitedStock;
                  const canAfford = currentBalance >= effectivePrice;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isOut) {
                          setSelectedItemId(item.id);
                          setError(null);
                        }
                      }}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                          : isOut
                          ? 'bg-slate-950/40 border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-950'
                      }`}
                    >
                      {/* Top stock & discount badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            item.unlimitedStock
                              ? 'text-emerald-400'
                              : isOut
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.unlimitedStock ? '∞ Unlimited' : isOut ? 'Out of stock' : `${item.stock} in stock`}
                        </span>
                        {item.discountPercent > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white font-mono font-bold text-[9px] rounded-full">
                            -{item.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Mini Visual Preview & Name */}
                      <div className="flex items-center gap-2.5 my-1">
                        <div className="w-10 h-10 shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center p-1 overflow-hidden">
                          <StoreItemVisual iconType={item.iconType} emoji={item.emoji} category={item.category} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-xs truncate leading-snug">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.subtitle || item.category}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Price Tag */}
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {!canAfford ? 'Need more funds' : 'Available'}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          {item.discountPercent > 0 && (
                            <span className="text-[10px] text-slate-500 line-through">
                              ${item.basePrice}
                            </span>
                          )}
                          <span className="text-sm font-bold text-emerald-400">
                            ${effectivePrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM MANUAL DEBIT */}
          {mode === 'custom' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  Amount to Deduct ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={currentBalance}
                    step="1"
                    value={customAmount || ''}
                    onChange={(e) => {
                      setCustomAmount(Number(e.target.value));
                      setError(null);
                    }}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  Reason / Item Name
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g., Classroom snack, Custom privilege, Field trip item..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE STORE CATALOG (Stock, Prices, Discounts) */}
          {mode === 'manage' && (
            <div className="space-y-3 font-mono">
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                <span>Directly adjust stock quantities, base prices, or discounts:</span>
                <span className="text-[10px] text-amber-400 uppercase font-bold">Instant Save</span>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {storeCatalog.map((item) => {
                  const effectivePrice = calculateEffectiveItemPrice(item);
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-xs text-white block">{item.name}</strong>
                          <span className="text-[10px] text-slate-400">
                            Effective: ${effectivePrice} (Base: ${item.basePrice})
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-amber-300 font-bold">
                          Stock: {item.stock}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {/* Stock adjustments */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase">Stock</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item.id, -1)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold"
                            >
                              -1
                            </button>
                            <span className="font-bold text-white px-1">{item.stock}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(item.id, 1)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold"
                            >
                              +1
                            </button>
                          </div>
                        </div>

                        {/* Price adjustments */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustPrice(item.id, -100)}
                              className="px-1.5 py-0.5 bg-slate-800 text-rose-300 rounded text-[10px] font-bold"
                            >
                              -$100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPrice(item.id, 100)}
                              className="px-1.5 py-0.5 bg-slate-800 text-emerald-300 rounded text-[10px] font-bold"
                            >
                              +$100
                            </button>
                          </div>
                        </div>

                        {/* Discount adjustments */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase">Discount</span>
                          <div className="flex items-center gap-1">
                            {[0, 10, 25, 50].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleSetDiscount(item.id, pct)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  item.discountPercent === pct
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {pct === 0 ? '0%' : `${pct}%`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Balance Preview Math & Credit Score Boost Notice */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Current Balance:</span>
              <span>${currentBalance}.00</span>
            </div>
            <div className="flex justify-between text-amber-400 font-bold">
              <span>
                Store Purchase ({mode === 'catalog' ? selectedItem?.name || 'No item selected' : customNote}):
              </span>
              <span>-${deductionAmount || 0}.00</span>
            </div>
            <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold">
              <span className="text-slate-300">New Balance:</span>
              <span className={remainingBalance < 0 ? 'text-red-400' : 'text-emerald-400'}>
                ${remainingBalance}.00
              </span>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Credit Score Reward:
              </span>
              <strong>
                {student.creditScore} → {Math.min(850, student.creditScore + 5)} (+5 pts)
              </strong>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInvalid}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 font-mono"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Purchase (-${deductionAmount || 0})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
