/**
 * src/store/useCartStore.ts
 *
 * E-Commerce Shopping Bag & Checkout State Store.
 * Provides synchronized state for slide-out cart drawer, stock inventory,
 * US/EU sizing matrices, promo code discounts, and simulated checkout flow.
 */

import { useSyncExternalStore } from 'react';
import { SneakerCustomization } from '@/types/sneaker';
import { playCheckoutSuccess, playClick } from '@/utils/audio';

export interface CartItem {
  id: string;
  shoeName: string;
  price: number;
  size: string;
  customization: SneakerCustomization;
  quantity: number;
}

export interface OrderSummary {
  orderId: string;
  itemsCount: number;
  total: number;
  itemDescription: string;
  timestamp: number;
}

export interface CartStoreState {
  items: CartItem[];
  isOpen: boolean;
  selectedSize: string;
  sizeUnit: 'US' | 'EU';
  stockMatrix: Record<string, number>;
  basePrice: number;
  promoCode: string | null;
  discount: number;
  promoError: string | null;
  isOrderComplete: boolean;
  lastOrder: OrderSummary | null;
  subtotal: number;
  totalItems: number;
  total: number;
  freeShippingQualified: boolean;
}

export const INITIAL_STOCK_MATRIX: Record<string, number> = {
  'US 7.0': 8, 'US 7.5': 6, 'US 8.0': 10, 'US 8.5': 12, 'US 9.0': 5,
  'US 9.5': 7, 'US 10.0': 9, 'US 10.5': 3, 'US 11.0': 4, 'US 11.5': 2,
  'US 12.0': 5, 'US 13.0': 1,
  'EU 40': 8, 'EU 41': 6, 'EU 42': 10, 'EU 42.5': 12, 'EU 43': 5,
  'EU 44': 3, 'EU 44.5': 7, 'EU 45': 4, 'EU 46': 2, 'EU 47': 1,
};

export const PROMO_CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  AERO20: { type: 'percent', value: 0.20, label: '20% Limited Drop Discount' },
  VIP50: { type: 'fixed', value: 50.00, label: '$50 VIP Studio Credit' },
  AERO10: { type: 'percent', value: 0.10, label: '10% Launch Access' },
};

export class CartStoreEngine {
  public basePrice: number;
  public items: CartItem[];
  public isOpen: boolean;
  public selectedSize: string;
  public sizeUnit: 'US' | 'EU';
  public stockMatrix: Record<string, number>;
  public promoCode: string | null;
  public promoError: string | null;
  public isOrderComplete: boolean;
  public lastOrder: OrderSummary | null;
  private subscribers: Set<(state: CartStoreState) => void> = new Set();
  private cachedState!: CartStoreState;

  constructor(basePrice = 285.00) {
    this.basePrice = basePrice;
    this.items = [];
    this.isOpen = false;
    this.selectedSize = 'US 10.5';
    this.sizeUnit = 'US';
    this.stockMatrix = { ...INITIAL_STOCK_MATRIX };
    this.promoCode = null;
    this.promoError = null;
    this.isOrderComplete = false;
    this.lastOrder = null;
    this.cachedState = this.computeState();
  }

  public get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  public get totalItems(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  public get discount(): number {
    if (!this.promoCode || !PROMO_CODES[this.promoCode]) return 0;
    const promo = PROMO_CODES[this.promoCode];
    if (promo.type === 'percent') {
      return this.subtotal * promo.value;
    }
    return Math.min(this.subtotal, promo.value);
  }

  public get total(): number {
    return Math.max(0, this.subtotal - this.discount);
  }

  public get freeShippingQualified(): boolean {
    return this.subtotal >= 200 || this.items.length > 0;
  }

  public setSizeUnit = (unit: 'US' | 'EU'): void => {
    if (unit !== 'US' && unit !== 'EU') {
      throw new Error(`Invalid size unit: ${unit}`);
    }
    this.sizeUnit = unit;
    if (unit === 'US' && !this.selectedSize.startsWith('US')) {
      this.selectedSize = 'US 10.5';
    } else if (unit === 'EU' && !this.selectedSize.startsWith('EU')) {
      this.selectedSize = 'EU 44';
    }
    this.notify();
  };

  public selectSize = (size: string): void => {
    if (!this.stockMatrix.hasOwnProperty(size)) {
      throw new Error(`Invalid shoe size: ${size}`);
    }
    this.selectedSize = size;
    this.notify();
  };

  public getStock = (size: string = this.selectedSize): number => {
    return this.stockMatrix[size] ?? 0;
  };

  public isLowStock = (size: string = this.selectedSize): boolean => {
    const stock = this.getStock(size);
    return stock > 0 && stock <= 3;
  };

  public addItem = (itemData: {
    shoeName?: string;
    price?: number;
    size: string;
    customization: SneakerCustomization;
    quantity?: number;
  }): void => {
    const stock = this.getStock(itemData.size);
    if (stock <= 0) {
      throw new Error(`Cannot add item: Size ${itemData.size} is out of stock`);
    }

    const existingIndex = this.items.findIndex(
      (item) =>
        item.size === itemData.size &&
        JSON.stringify(item.customization) === JSON.stringify(itemData.customization)
    );

    const qty = itemData.quantity || 1;
    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      if (existing.quantity + qty > stock) {
        throw new Error(`Requested quantity exceeds available stock (${stock})`);
      }
      existing.quantity += qty;
    } else {
      if (qty > stock) {
        throw new Error(`Requested quantity exceeds available stock (${stock})`);
      }
      const newItem: CartItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        shoeName: itemData.shoeName || 'AEROPRO-X LAB Sneaker',
        price: itemData.price || this.basePrice,
        size: itemData.size,
        customization: JSON.parse(JSON.stringify(itemData.customization)),
        quantity: qty,
      };
      this.items.push(newItem);
    }

    this.isOpen = true;
    this.notify();
  };

  public removeItem = (id: string): void => {
    this.items = this.items.filter((item) => item.id !== id);
    this.notify();
  };

  public updateQuantity = (id: string, delta: number): void => {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.removeItem(id);
    } else {
      const stock = this.getStock(item.size);
      if (newQty > stock) {
        throw new Error(
          `Cannot update quantity to ${newQty}: Requested quantity exceeds available stock (${stock})`
        );
      }
      item.quantity = newQty;
      this.notify();
    }
  };

  public clearCart = (): void => {
    this.items = [];
    this.notify();
  };

  public openCart = (): void => {
    this.isOpen = true;
    this.notify();
  };

  public closeCart = (): void => {
    this.isOpen = false;
    this.notify();
  };

  public applyPromoCode = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (PROMO_CODES[normalized]) {
      this.promoCode = normalized;
      this.promoError = null;
      this.notify();
      return true;
    } else {
      this.promoError = 'Invalid promo code. Try "AERO20" for 20% off.';
      this.notify();
      return false;
    }
  };

  public removePromoCode = (): void => {
    this.promoCode = null;
    this.promoError = null;
    this.notify();
  };

  public checkout = (): OrderSummary => {
    if (this.items.length === 0) {
      throw new Error('Cannot checkout with an empty bag');
    }

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const itemsCount = this.totalItems;
    const total = this.total;
    const primaryItem = this.items[0];
    const itemDescription = `${primaryItem.shoeName} (Size ${primaryItem.size})`;

    const order: OrderSummary = {
      orderId,
      itemsCount,
      total,
      itemDescription,
      timestamp: Date.now(),
    };

    // Deduct purchased inventory from real-time stock matrix
    this.items.forEach((item) => {
      const curStock = this.stockMatrix[item.size] ?? 0;
      this.stockMatrix[item.size] = Math.max(0, curStock - item.quantity);
    });

    this.lastOrder = order;
    this.isOrderComplete = true;
    playCheckoutSuccess();
    this.clearCart();
    this.notify();

    return order;
  };

  public resetOrderComplete = (): void => {
    this.isOrderComplete = false;
    this.lastOrder = null;
    this.notify();
  };

  public subscribe = (listener: (state: CartStoreState) => void): (() => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };

  public notify = (): void => {
    this.cachedState = this.computeState();
    const state = this.cachedState;
    this.subscribers.forEach((cb) => cb(state));
  };

  private computeState = (): CartStoreState => {
    return {
      items: [...this.items],
      isOpen: this.isOpen,
      selectedSize: this.selectedSize,
      sizeUnit: this.sizeUnit,
      stockMatrix: { ...this.stockMatrix },
      basePrice: this.basePrice,
      promoCode: this.promoCode,
      discount: this.discount,
      promoError: this.promoError,
      isOrderComplete: this.isOrderComplete,
      lastOrder: this.lastOrder ? { ...this.lastOrder } : null,
      subtotal: this.subtotal,
      totalItems: this.totalItems,
      total: this.total,
      freeShippingQualified: this.freeShippingQualified,
    };
  };

  public getState = (): CartStoreState => {
    return this.cachedState;
  };
}

export const cartStoreEngine = new CartStoreEngine(285.00);

export function useCartStore(): CartStoreState & {
  setSizeUnit: (unit: 'US' | 'EU') => void;
  selectSize: (size: string) => void;
  getStock: (size?: string) => number;
  isLowStock: (size?: string) => boolean;
  addItem: (itemData: {
    shoeName?: string;
    price?: number;
    size: string;
    customization: SneakerCustomization;
    quantity?: number;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  checkout: () => OrderSummary;
  resetOrderComplete: () => void;
} {
  const state = useSyncExternalStore(
    (cb) => cartStoreEngine.subscribe(cb),
    () => cartStoreEngine.getState(),
    () => cartStoreEngine.getState()
  );

  return {
    ...state,
    setSizeUnit: cartStoreEngine.setSizeUnit,
    selectSize: cartStoreEngine.selectSize,
    getStock: cartStoreEngine.getStock,
    isLowStock: cartStoreEngine.isLowStock,
    addItem: cartStoreEngine.addItem,
    removeItem: cartStoreEngine.removeItem,
    updateQuantity: cartStoreEngine.updateQuantity,
    clearCart: cartStoreEngine.clearCart,
    openCart: () => {
      playClick();
      cartStoreEngine.openCart();
    },
    closeCart: () => {
      playClick();
      cartStoreEngine.closeCart();
    },
    applyPromoCode: cartStoreEngine.applyPromoCode,
    removePromoCode: cartStoreEngine.removePromoCode,
    checkout: cartStoreEngine.checkout,
    resetOrderComplete: cartStoreEngine.resetOrderComplete,
  };
}
