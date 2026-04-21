import clsx from 'clsx';
export default function Button({ children, onClick, variant = 'primary', size = 'md', icon: Icon, disabled, block, className }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold font-body rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white shadow-lg shadow-pink-200/70 hover:shadow-xl hover:shadow-pink-300/70 hover:-translate-y-0.5 animate-gradient',
    dark: 'bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-white hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-md',
    ghost: 'bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-amber-50 hover:to-pink-50',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-200',
    danger: 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-400 hover:to-red-400 shadow-md shadow-rose-200',
    outline: 'border-2 border-transparent bg-white text-gray-700 hover:text-pink-600 [background-clip:padding-box,border-box] [background-origin:padding-box,border-box] hover:[background-image:linear-gradient(white,white),linear-gradient(90deg,#f59e0b,#ec4899,#8b5cf6)]',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={clsx(base, variants[variant], sizes[size], block && 'w-full flex', className)}>
      {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 15} />}
      {children}
    </button>
  );
}
