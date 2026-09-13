/**
 * src/components/ui/CartDrawer.tsx
 *
 * Slide-Out Glassmorphic E-Commerce Shopping Bag & Checkout Drawer.
 * Shows real-time customizer color swatches, size selection, quantity controls,
 * promo code validation, and a simulated high-end checkout celebration.
 * Dual-theme adaptive (Daylight Luxury Light and Obsidian Onyx Dark).
 */

import React, { useState } from 'react';
import { useCartStore, CartItem } from '@/store/useCartStore';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react';
import { playClick } from '@/utils/audio';

export const CartDrawer: React.FC = () => {
  const cart = useCartStore();
  const [promoInput, setPromoInput] = useState<string>('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  if (!cart.isOpen && !isCheckoutModalOpen && !cart.isOrderComplete) {
    return null;
  }

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    playClick();
    cart.applyPromoCode(promoInput);
  };

  const handleStartCheckout = () => {
    playClick();
    setIsCheckoutModalOpen(true);
  };

  const handleExecuteCheckout = () => {
    setIsProcessingCheckout(true);
    setTimeout(() => {
      cart.checkout();
      setIsProcessingCheckout(false);
    }, 1200);
  };

  const handleCloseAll = () => {
    playClick();
    cart.closeCart();
    setIsCheckoutModalOpen(false);
    cart.resetOrderComplete();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCloseAll}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-out Drawer */}
      <aside
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-white/95 dark:bg-dark-950/95 border-l border-black/10 dark:border-white/10 backdrop-blur-2xl z-40 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right text-neutral-900 dark:text-white"
        style={{
          boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-neutral-900 dark:text-brand-lime" />
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-neutral-900 dark:text-white">
              YOUR BAG ({cart.totalItems})
            </h3>
          </div>
          <button
            type="button"
            onClick={cart.closeCart}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Alert Pill */}
        <div className="px-6 py-2.5 bg-brand-lime/20 dark:bg-brand-lime/10 border-b border-brand-lime/30 dark:border-brand-lime/20 flex items-center gap-2 text-xs font-mono text-neutral-900 dark:text-brand-lime font-bold">
          <Truck className="w-4 h-4 text-neutral-900 dark:text-brand-lime shrink-0" />
          <span>FREE GLOBAL EXPRESS COURIER UNLOCKED</span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 dark:text-zinc-500 py-12">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-neutral-400 dark:text-zinc-600" />
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-700 dark:text-zinc-400">
                Your shopping bag is empty
              </p>
              <p className="font-sans text-xs text-neutral-500 dark:text-zinc-600 mt-1 max-w-xs">
                Configure your custom colorway and size in the atelier to add to bag.
              </p>
            </div>
          ) : (
            cart.items.map((item: CartItem) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex gap-4 items-center"
              >
                {/* 4-Quadrant Color Matrix Thumbnail */}
                <div className="w-16 h-16 rounded-xl border border-black/15 dark:border-white/15 overflow-hidden grid grid-cols-2 grid-rows-2 shrink-0 shadow-sm">
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: item.customization.upper.color }}
                    title="Upper"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: item.customization.sole.color }}
                    title="Sole"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: item.customization.accents.color }}
                    title="Accents"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: item.customization.laces.color }}
                    title="Laces"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider truncate">
                      {item.shoeName}
                    </h4>
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-brand-lime">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-neutral-500 dark:text-zinc-400">
                    <span className="text-neutral-800 dark:text-zinc-200 font-semibold">{item.size}</span>
                    <span>•</span>
                    <span>${item.price.toFixed(2)} ea</span>
                  </div>

                  {/* Quantity and Remove */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs text-neutral-900 dark:text-white px-1.5 font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => cart.removeItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 p-1.5 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Promo & Subtotal */}
        {cart.items.length > 0 && (
          <div className="p-6 border-t border-black/10 dark:border-white/10 space-y-4 bg-black/[0.02] dark:bg-dark-900/50">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="PROMO CODE (Try AERO20)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white uppercase placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-neutral-900 dark:focus:border-brand-lime"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-xs font-mono font-bold transition-colors"
              >
                APPLY
              </button>
            </form>

            {cart.promoCode && (
              <div className="flex items-center justify-between text-xs font-mono text-neutral-900 dark:text-brand-lime bg-brand-lime/20 dark:bg-brand-lime/10 px-3 py-1.5 rounded-lg border border-brand-lime/30 dark:border-brand-lime/20">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>PROMO: {cart.promoCode}</span>
                </div>
                <button
                  type="button"
                  onClick={cart.removePromoCode}
                  className="text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {cart.promoError && (
              <p className="text-[10px] font-mono text-rose-500 dark:text-rose-400">{cart.promoError}</p>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex justify-between text-neutral-600 dark:text-zinc-400">
                <span>SUBTOTAL</span>
                <span className="text-neutral-900 dark:text-zinc-200">${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-brand-lime">
                  <span>DISCOUNT</span>
                  <span>-${cart.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600 dark:text-zinc-400">
                <span>EXPRESS SHIPPING</span>
                <span className="text-emerald-600 dark:text-brand-lime font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-neutral-900 dark:text-white font-bold pt-2 border-t border-black/10 dark:border-white/10 text-sm">
                <span>ESTIMATED TOTAL</span>
                <span className="text-neutral-900 dark:text-brand-lime font-mono">
                  ${cart.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Trigger Button */}
            <button
              type="button"
              onClick={handleStartCheckout}
              className="w-full py-4 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-brand-lime dark:text-black font-mono font-bold text-xs tracking-widest uppercase dark:hover:bg-white transition-all duration-300 shadow-md dark:shadow-glow-lime flex items-center justify-center gap-2 active:scale-98"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
              <span>256-BIT ENCRYPTED BESPOKE ATELIER CHECKOUT</span>
            </div>
          </div>
        )}
      </aside>

      {/* Checkout Simulator Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-900 border border-black/10 dark:border-white/15 shadow-2xl relative text-neutral-900 dark:text-white">
            {!cart.isOrderComplete ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neutral-900 dark:text-brand-lime" />
                    <h3 className="font-display font-bold text-sm tracking-wider uppercase text-neutral-900 dark:text-white">
                      ATELIER FAST CHECKOUT
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="text-neutral-500 hover:text-black dark:text-zinc-500 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-2 font-mono text-xs">
                  <div className="text-neutral-600 dark:text-zinc-400 flex justify-between">
                    <span>Items Count:</span>
                    <span className="text-neutral-900 dark:text-white">{cart.totalItems} pair(s)</span>
                  </div>
                  <div className="text-neutral-600 dark:text-zinc-400 flex justify-between">
                    <span>Delivery:</span>
                    <span className="text-emerald-600 dark:text-brand-lime font-bold">2-3 Day Priority Express</span>
                  </div>
                  <div className="text-neutral-600 dark:text-zinc-400 flex justify-between pt-2 border-t border-black/5 dark:border-white/5">
                    <span>Total Amount:</span>
                    <span className="text-neutral-900 dark:text-brand-lime font-bold text-sm">
                      ${cart.total.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Simulated Payment Method */}
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-neutral-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-5 rounded bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 flex items-center justify-center text-[9px] font-bold">
                      PAY
                    </div>
                    <span>Apple Pay / Priority Express</span>
                  </div>
                  <span className="text-emerald-600 dark:text-brand-lime text-[10px] font-bold">VERIFIED</span>
                </div>

                <button
                  type="button"
                  disabled={isProcessingCheckout}
                  onClick={handleExecuteCheckout}
                  className="w-full py-4 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-brand-lime dark:text-black font-mono font-bold text-xs tracking-widest uppercase dark:hover:bg-white transition-all duration-300 shadow-md dark:shadow-glow-lime flex items-center justify-center gap-2"
                >
                  {isProcessingCheckout ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                      <span>AUTHORIZING TRANSACTION...</span>
                    </div>
                  ) : (
                    <span>CONFIRM & PLACE ORDER</span>
                  )}
                </button>
              </div>
            ) : (
              /* Order Complete Celebratory State */
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand-lime/20 dark:bg-brand-lime/10 border border-brand-lime/40 dark:border-brand-lime/30 flex items-center justify-center mx-auto text-neutral-900 dark:text-brand-lime shadow-md dark:shadow-glow-lime animate-scale-in">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white uppercase tracking-wider">
                    ORDER CONFIRMED
                  </h3>
                  <p className="font-mono text-xs text-neutral-800 dark:text-brand-lime mt-1 font-bold">
                    ORDER #{cart.lastOrder?.orderId || 'ORD-98214'}
                  </p>
                </div>

                <p className="text-xs text-neutral-600 dark:text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  Your serialized AEROPRO-X LAB pair has been queued for bespoke procedural assembly.
                  Confirmation details sent to your priority inbox.
                </p>

                <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-left font-mono text-xs space-y-1.5 text-neutral-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Summary:</span>
                    <span className="text-neutral-900 dark:text-zinc-200">{cart.lastOrder?.itemDescription}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="text-neutral-900 dark:text-brand-lime font-bold">
                      ${cart.lastOrder?.total.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 font-mono font-bold text-xs tracking-widest uppercase transition-colors"
                >
                  CONTINUE EXPLORING
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
