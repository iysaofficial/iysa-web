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
  /* Tanda bahwa JavaScript benar-benar jalan.
   *
   * globals.css hanya menahan animasi [data-reveal] kalau tanda ini ada.
   * Tanpa tanda — JS dimatikan, skrip diblokir pemasang iklan, galat sebelum
   * baris ini, jaringan putus — tidak ada yang ditahan dan seluruh isi
   * halaman tampil apa adanya.
   *
   * Ini menggantikan @media (scripting: none), yang ternyata tidak menolong:
   * Chrome melaporkan scripting:enabled bahkan saat JavaScript dimatikan,
   * jadi pagar itu tidak pernah menyala untuk pengguna yang sebenarnya perlu.
   * Diuji langsung — halaman uji dengan ketiga nilai media feature memberi
   * hasil yang sama persis dengan dan tanpa --disable-javascript. */
  document.documentElement.setAttribute("data-gerak", "aktif");

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
