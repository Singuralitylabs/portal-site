// 認証済みページレイアウト
import { SideNav } from "./components/SideNav";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="sm:flex min-h-screen">
      <SideNav />
      <div className="flex-1 sm:ml-48">{children}</div>
    </div>
  );
}
