const AdminStatCard = ({ title, value, change, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h4 className="text-2xl font-semibold text-slate-900">{value}</h4>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        {icon}
      </div>
    </div>
    {change && (
      <p className={`mt-3 text-sm ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {change > 0 ? '+' : '-'} {Math.abs(change)}% vs last week
      </p>
    )}
  </div>
);

export default AdminStatCard;
