import type { ReactNode } from "react";

/**
 * Root layout sengaja kosong: elemen <html> dipegang app/[locale]/layout.tsx,
 * karena atribut lang dan dir baru diketahui setelah locale ditentukan.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
