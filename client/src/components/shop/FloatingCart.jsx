import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartDrawer from './CartDrawer';

export default function FloatingCart() {
  const { count, openDrawer } = useCart();

  return (
    <>
      <button onClick={openDrawer} title="Open cart"
        className="fixed top-24 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition">
        <ShoppingBag size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white text-[10px] flex items-center justify-center text-white font-bold shadow">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
