// 認証済みページレイアウト
import { SideNav } from "./components/SideNav";
import { AuthLayout as AuthGuard } from "./auth-layout";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="sm:flex min-h-screen">
        <SideNav />
        <div className="flex-1 sm:ml-64">{children}</div>
      </div>
    </AuthGuard>
  );
}
