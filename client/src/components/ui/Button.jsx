import clsx from 'clsx';
export default function Button({ children, onClick, variant = 'primary', size = 'md', icon: Icon, disabled, block, className }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold font-body rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-amber-500 text-black hover:bg-amber-400',
    dark: 'bg-gray-900 text-white hover:bg-gray-800',
    ghost: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    success: 'bg-emerald-500 text-white hover:bg-emerald-400',
    danger: 'bg-red-500 text-white hover:bg-red-400',
    outline: 'border border-gray-200 text-gray-600 hover:bg-gray-50',
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
