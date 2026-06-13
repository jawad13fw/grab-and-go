const VendorStatCard = ({ label, value, trend, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <h4 className="text-2xl font-semibold text-slate-900">{value}</h4>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
    </div>
    {trend !== undefined && trend !== null && (
      <p className={`mt-3 text-sm ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
      </p>
    )}
  </div>
);

export default VendorStatCard;
