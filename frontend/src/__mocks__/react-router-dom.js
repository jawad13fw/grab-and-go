// Manual mock for react-router-dom to work with Jest
import React from 'react';

export const BrowserRouter = ({ children }) => <>{children}</>;
export const Routes = ({ children }) => <>{children}</>;
export const Route = ({ element }) => element || null;
export const Link = ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>;
export const NavLink = ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>;
export const useNavigate = () => jest.fn();
export const useParams = () => ({});
export const useLocation = () => ({ pathname: '/', search: '', hash: '', state: null });
export const useSearchParams = () => [new URLSearchParams(), jest.fn()];
export const Outlet = () => null;
export const Navigate = ({ to }) => null;
export const RouterProvider = ({ router }) => null;
export const HydratedRouter = ({ children }) => <>{children}</>;

