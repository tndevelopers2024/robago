import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-radial from-slate-100 to-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
