const Input = ({ label, helper, error, rightSlot, className = '', inputClassName = '', ...props }) => (
  <label className={`flex flex-col gap-1 text-sm text-slate-600 ${className}`}>
    {label && <span className="font-medium text-slate-800">{label}</span>}
    <div className="relative">
      <input
        className={`w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-200 focus:border-primary'
        } ${rightSlot ? 'pr-12' : ''} ${inputClassName}`}
        {...props}
      />
      {rightSlot && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {rightSlot}
        </div>
      )}
    </div>
    {error ? (
      <span className="text-xs text-rose-600">{error}</span>
    ) : helper ? (
      <span className="text-xs text-slate-500">{helper}</span>
    ) : null}
  </label>
);

export default Input;
