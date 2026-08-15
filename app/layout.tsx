import type { Metadata } from "next";
import "./globals.css";

import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Ogigrid Workflow",
  description: "Internal work-management application for Ogigrid.",
  icons: {
    icon: "/ogigrid-logo.jpg",
    shortcut: "/ogigrid-logo.jpg",
    apple: "/ogigrid-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <RouteGuard>{children}</RouteGuard>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}