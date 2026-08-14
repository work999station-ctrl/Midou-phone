import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],

  addToCart: (product) => set((state) => {
    const existingIndex = state.items.findIndex(item => item.product._id === product._id);
    if (existingIndex > -1) {
      const newItems = [...state.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + 1
      };
      return { items: newItems };
    }
    return { items: [...state.items, { product, quantity: 1 }] };
  }),

  removeFromCart: (productId) => set((state) => ({
    items: state.items.filter(item => item.product._id !== productId)
  })),

  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(item => item.product._id !== productId) };
    }
    return {
      items: state.items.map(item =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    };
  }),

  clearCart: () => set({ items: [] }),

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },

  getCartCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  }
}));
