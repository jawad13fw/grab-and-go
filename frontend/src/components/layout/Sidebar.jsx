import { NavLink } from 'react-router-dom';

const Sidebar = ({ routes }) => (
  <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 md:w-64">
    <nav className="space-y-2 text-sm font-medium text-slate-600">
      {routes.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            `flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-primary/10 hover:text-primary ${
              isActive ? 'bg-primary/10 text-primary' : ''
            }`
          }
        >
          {route.label}
          {route.badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {route.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
