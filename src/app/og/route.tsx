import { ImageResponse } from "next/og";

/**
 * OG image dinamis, dirakit per permintaan.
 *
 * Situs lama tidak punya Open Graph sama sekali: setiap tautan yang dibagikan
 * ke WhatsApp atau Instagram — kanal utama IYSA — tampil sebagai kotak kosong
 * tanpa judul. Di sini tiap halaman mengirim judulnya sendiri lewat query.
 *
 * Tanpa gambar dan tanpa font kustom: hanya warna merek dan tipografi sistem,
 * supaya tidak ada berkas font yang harus diambil di tepi jaringan.
 */
export const runtime = "edge";

const NAVY = "#1B3A6B";
const TEAL = "#1F7A74";
const CORAL = "#C2410C";
const INK = "#0E1726";
const MUTED = "#4A5568";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const heading = (searchParams.get("h") ?? "Indonesian Young Scientist Association").slice(0, 120);
  const eyebrow = (searchParams.get("e") ?? "IYSA").slice(0, 48);
  const meta = searchParams.get("m")?.slice(0, 64) ?? null;

  // Judul panjang turun ukurannya supaya tidak terpotong.
  const size = heading.length > 78 ? 50 : heading.length > 48 ? 62 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", background: "#FFFFFF",
          padding: "64px 72px", fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Pita tiga warna — proporsi yang sama dengan peran warnanya di situs. */}
        <div style={{ display: "flex", height: 8, width: 260 }}>
          <div style={{ background: NAVY, width: "58%" }} />
          <div style={{ background: TEAL, width: "24%" }} />
          <div style={{ background: CORAL, width: "18%" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: MUTED }}>
            {eyebrow}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: size, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, color: NAVY }}>
            {heading}
          </div>
          {meta && <div style={{ fontSize: 26, color: MUTED }}>{meta}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 22, color: INK }}>
          <div style={{ fontWeight: 700 }}>iysa.or.id</div>
          <div style={{ color: MUTED }}>Indonesian Young Scientist Association</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
