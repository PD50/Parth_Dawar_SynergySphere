import { MainLayout } from "@/components/layout/main-layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </MainLayout>
  );
}