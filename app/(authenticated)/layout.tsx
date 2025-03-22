import { SideNav } from "@/app/(authenticated)/components/SideNav";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="sm:flex min-h-screen">
      <SideNav />
      <div className="flex-1 sm:ml-48">{children}</div>
    </div>
  );
}
