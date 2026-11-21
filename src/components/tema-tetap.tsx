"use client";

import { useLayoutEffect } from "react";
import { useLocale } from "next-intl";
import { terapkanTemaTersimpan } from "@/lib/theme-store";

/**
 * Menjaga tema pilihan pengunjung saat bahasa diganti. useLayoutEffect
 * berjalan sesudah <html> baru dipasang tetapi SEBELUM peramban melukis,
 * jadi tidak ada kilatan tema yang salah. Lihat `terapkanTemaTersimpan`.
 */
export function TemaTetap() {
  const locale = useLocale();
  useLayoutEffect(() => {
    terapkanTemaTersimpan();
  }, [locale]);
  return null;
}
