/**
 * Menyetel data-theme sebelum peramban melukis, supaya halaman tidak berkedip
 * putih sedetik sebelum tema gelap terpasang. Tanpa ini, pengunjung malam hari
 * kena kilatan terang setiap kali pindah halaman.
 *
 * Tiga keadaan: "dark", "light", dan tidak ada atribut sama sekali — yang
 * terakhir berarti ikut sistem, dan ditangani oleh @media di globals.css.
 */
export function ThemeScript() {
  const code = `
(function(){
  try {
    var saved = localStorage.getItem("iysa-theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    /* Mode privat atau penyimpanan diblokir: biarkan preferensi sistem bekerja. */
  }
})();`.trim();

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
