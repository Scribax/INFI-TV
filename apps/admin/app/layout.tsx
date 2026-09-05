import type { Metadata } from "next";
import { APP_NAME } from "@infitv/config";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} Admin`,
    template: `%s · ${APP_NAME} Admin`,
  },
  description: "Panel administrativo de INFI TV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
