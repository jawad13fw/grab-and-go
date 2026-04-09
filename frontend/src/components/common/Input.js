const Input = ({ label, helper, className = '', ...props }) => (
  <label className={`flex flex-col gap-1 text-sm text-slate-600 ${className}`}>
    {label && <span className="font-medium text-slate-800">{label}</span>}
    <input
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      {...props}
    />
    {helper && <span className="text-xs text-slate-500">{helper}</span>}
  </label>
);

export default Input;


