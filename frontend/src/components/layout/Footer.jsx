const Footer = () => (
  <footer className="mt-16 border-t border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="font-medium text-slate-600">© {new Date().getFullYear()} Grab and Go Technologies. All rights reserved.</p>
        <p>Reliable local commerce and delivery operations for customers, vendors, and riders.</p>
      </div>
      <div className="flex gap-6">
        <a href="/vendor/dashboard" className="hover:text-primary">
          Vendor Portal
        </a>
        <a href="/rider/dashboard" className="hover:text-primary">
          Rider App
        </a>
        <a href="/admin/dashboard" className="hover:text-primary">
          Admin Console
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
