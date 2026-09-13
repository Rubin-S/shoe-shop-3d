/**
 * src/components/ui/BuySectionHUD.tsx
 *
 * Stage 5 E-Commerce Product Showcase & Sizing Dock.
 * Real-time stock ticker, US/EU sizing switch, and instant Add to Bag action.
 * Dual-theme adaptive for Daylight Luxury and Obsidian Onyx.
 */

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useSneakerStore } from '@/store/useSneakerStore';
import { useChoreographyStore } from '@/store/useChoreographyStore';
import {
  ShoppingBag,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { playClick, playColorSwitch } from '@/utils/audio';

const US_SIZES = [
  'US 7.0', 'US 7.5', 'US 8.0', 'US 8.5', 'US 9.0',
  'US 9.5', 'US 10.0', 'US 10.5', 'US 11.0', 'US 11.5',
  'US 12.0', 'US 13.0',
];

const EU_SIZES = [
  'EU 40', 'EU 41', 'EU 42', 'EU 42.5', 'EU 43',
  'EU 44', 'EU 44.5', 'EU 45', 'EU 46', 'EU 47',
];

export const BuySectionHUD: React.FC = () => {
  const cart = useCartStore();
  const sneaker = useSneakerStore();
  const choreo = useChoreographyStore();
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);

  const activeSizes = cart.sizeUnit === 'US' ? US_SIZES : EU_SIZES;
  const currentStock = cart.getStock(cart.selectedSize);
  const isLow = cart.isLowStock(cart.selectedSize);

  const handleUnitToggle = (unit: 'US' | 'EU') => {
    playClick();
    cart.setSizeUnit(unit);
  };

  const handleSizeSelect = (size: string) => {
    playClick();
    cart.selectSize(size);
  };

  const handleAddToBag = () => {
    playColorSwitch();
    cart.addItem({
      shoeName: 'AEROPRO-X LAB',
      price: cart.basePrice,
      size: cart.selectedSize,
      customization: sneaker.activeColorway,
      quantity: 1,
    });
    setIsAddedSuccess(true);
    setTimeout(() => {
      setIsAddedSuccess(false);
    }, 2000);
  };

  return (
    <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-dark-900/90 border border-black/10 dark:border-white/10 backdrop-blur-2xl shadow-2xl dark:shadow-glass text-neutral-900 dark:text-white pointer-events-auto">
      {/* Product Tag & Title */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lime/20 dark:bg-brand-lime/10 border border-brand-lime/30 dark:border-brand-lime/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-900 dark:text-brand-lime font-bold">
              Exclusive Drop // Batch 01
            </span>
          </div>
          <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight uppercase text-neutral-900 dark:text-white">
            AEROPRO-X LAB
          </h3>
          <p className="font-mono text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
            Series 01 Titanium Nitro Edition
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-brand-lime tracking-tight">
            ${cart.basePrice.toFixed(2)}
          </div>
          <div className="font-mono text-[9px] text-neutral-500 dark:text-zinc-500 uppercase tracking-widest">
            USD // Incl. Duties
          </div>
        </div>
      </div>

      {/* Sizing Standards Toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10 mb-3">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-700 dark:text-zinc-300">
          SELECT SIZE
        </span>
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => handleUnitToggle('US')}
            className={`px-3 py-1 rounded-full transition-all ${
              cart.sizeUnit === 'US'
                ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black font-bold shadow-md dark:shadow-glow-lime'
                : 'text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            US
          </button>
          <button
            type="button"
            onClick={() => handleUnitToggle('EU')}
            className={`px-3 py-1 rounded-full transition-all ${
              cart.sizeUnit === 'EU'
                ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black font-bold shadow-md dark:shadow-glow-lime'
                : 'text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            EU
          </button>
        </div>
      </div>

      {/* Sizing Grid Chips */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
        {activeSizes.map((size) => {
          const isSelected = cart.selectedSize === size;
          const stock = cart.getStock(size);
          const isOut = stock <= 0;

          return (
            <button
              key={size}
              type="button"
              disabled={isOut}
              onClick={() => handleSizeSelect(size)}
              className={`py-2 px-1 rounded-xl text-xs font-mono transition-all duration-200 border flex flex-col items-center justify-center ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900/10 text-neutral-900 font-bold dark:border-brand-lime dark:bg-brand-lime/15 dark:text-brand-lime dark:shadow-glow-lime scale-102'
                  : isOut
                  ? 'border-black/5 bg-black/[0.01] text-neutral-400 dark:border-white/5 dark:bg-white/[0.01] dark:text-zinc-600 line-through cursor-not-allowed'
                  : 'border-black/10 bg-black/[0.03] text-neutral-700 hover:border-black/30 hover:text-black dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white'
              }`}
            >
              <span>{size.replace(/^(US|EU)\s*/, '')}</span>
              {stock <= 3 && stock > 0 && (
                <span className="text-[8px] text-amber-500 dark:text-amber-400 font-normal">
                  {stock} left
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live Inventory Ticker */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 mb-6 font-mono text-xs">
        <div className="flex items-center gap-2">
          {isLow ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
          ) : (
            <Zap className="w-4 h-4 text-neutral-900 dark:text-brand-lime" />
          )}
          <span className={isLow ? 'text-amber-600 dark:text-amber-300 font-medium' : 'text-neutral-700 dark:text-zinc-300'}>
            {isLow
              ? `High Demand: Only ${currentStock} pair(s) remaining in ${cart.selectedSize}`
              : `In Stock: ${currentStock} pairs available in ${cart.selectedSize}`}
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 dark:text-zinc-500 uppercase">Live Vault</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToBag}
          className="flex-1 py-4 px-6 rounded-2xl bg-neutral-900 text-white dark:bg-brand-lime dark:text-black font-mono font-bold text-xs tracking-widest uppercase hover:bg-neutral-800 dark:hover:bg-white transition-all duration-300 shadow-lg dark:shadow-glow-lime flex items-center justify-center gap-2 active:scale-98"
        >
          {isAddedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>ADDED TO BAG!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>ADD TO BAG // ${cart.basePrice.toFixed(2)}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => choreo.scrollToStage('customizer')}
          className="py-4 px-5 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 font-mono text-xs text-neutral-800 hover:text-black dark:text-zinc-300 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4 text-neutral-900 dark:text-brand-lime" />
          <span>CUSTOMIZE</span>
        </button>
      </div>

      {/* Assurance Badges */}
      <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-zinc-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
          <span>30-DAY CARBON TRIAL</span>
        </div>
        <span>•</span>
        <span>SERIALIZED NFC CHIP</span>
        <span>•</span>
        <span>FREE RETURN COURIER</span>
      </div>
    </div>
  );
};
