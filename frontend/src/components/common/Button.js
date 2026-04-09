const Button = ({ children, variant = 'primary', className = '', disabled, ...props }) => {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary-dark',
    secondary:
      'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400 border border-slate-200',
    ghost: 'text-primary hover:bg-primary/10 focus-visible:outline-primary/40',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;


