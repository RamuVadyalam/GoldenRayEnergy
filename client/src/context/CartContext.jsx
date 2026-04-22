import { createContext, useContext, useEffect, useReducer, useState } from 'react';

// localStorage key
const STORAGE_KEY = 'goldenray_cart_v1';

// { items: [{ id, name, brand, sku, price, image_url, qty }] }
const initialState = { items: [] };

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':     return action.payload || initialState;
    case 'ADD': {
      const existing = state.items.find(x => x.id === action.product.id);
      if (existing) {
        return { items: state.items.map(x => x.id === action.product.id ? { ...x, qty: x.qty + (action.qty || 1) } : x) };
      }
      return { items: [...state.items, { ...action.product, qty: action.qty || 1 }] };
    }
    case 'SET_QTY':
      return { items: state.items.map(x => x.id === action.id ? { ...x, qty: Math.max(1, action.qty) } : x) };
    case 'REMOVE':
      return { items: state.items.filter(x => x.id !== action.id) };
    case 'CLEAR':
      return { items: [] };
    default: return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
    } catch {/* ignore */}
  }, []);

  // Persist whenever state changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* ignore */}
  }, [state]);

  const count    = state.items.reduce((s, x) => s + x.qty, 0);
  const subtotal = state.items.reduce((s, x) => s + x.qty * Number(x.price), 0);

  const api = {
    items: state.items,
    count,
    subtotal,
    drawerOpen,
    openDrawer:  () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    add:    (product, qty = 1) => { dispatch({ type: 'ADD', product, qty }); setDrawerOpen(true); },
    setQty: (id, qty)          => dispatch({ type: 'SET_QTY', id, qty }),
    remove: (id)               => dispatch({ type: 'REMOVE', id }),
    clear:  ()                 => dispatch({ type: 'CLEAR' }),
  };

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
