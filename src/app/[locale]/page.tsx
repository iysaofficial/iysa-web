import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { Section, StatRow, MoreLink, Pill } from "@/components/ui";
import { SubscribeForm } from "@/components/subscribe-form";
import { EventCard } from "@/components/event-card";
import { HeroAtom } from "@/components/hero-atom";
import { statusEvent, waktuEvent } from "@/lib/event-seri";
import { PartnerWall } from "@/components/partner-wall";
import { MitraMasterWall } from "@/components/mitra-master-wall";
import { ambilMitraMaster, situsMitra } from "@/lib/mitra-dashboard";
import { EdisiDashboardKartu, KisiKartuEdisi } from "@/components/edisi-dashboard-kartu";
import { ambilSemuaSeriDashboard, milikSitus } from "@/lib/dashboard-event";
import { KurasiPanel } from "@/components/kurasi-panel";
import { PitaDaftar } from "@/components/pita-daftar";
import { pageMetadata } from "@/lib/seo";
import { stats, allEvents, allAffiliates } from "@/lib/data";
import { semuaTerbitan } from "@/lib/newsletter";
import { ambilKalender, ratakan } from "@/lib/kalender";
import { judulNewsletter } from "@/lib/teks-event";
import { intro, vision, mission, goals } from "@/content/profile";
import { affiliateNames } from "@/content/affiliates";
import { mediaPartners } from "@/content/external";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return pageMetadata({
    locale,
    path: "/",
    title: t("heroTitle"),
    description: t("heroBody"),
    ogTitle: "Indonesian Young Scientist Association",
    og: { eyebrow: "IYSA", heading: t("heroTitle"), meta: t("heroLead") },
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const s = stats();

  /* Enam event untuk seksi "Yang sedang berjalan".
   *
   * Versi sebelumnya mengurutkan menurut ada-tidaknya `registrationUrl` —
   * dan KE-66 event punya URL pendaftaran, jadi pengurutannya tidak berefek
   * apa pun. Yang tampil enam event pertama menurut ID internal: semuanya
   * 2024, semuanya sudah selesai, di bawah judul "Yang sedang berjalan".
   *
   * Sekarang urutannya memakai status yang dihitung dari tanggal: pendaftaran
   * terbuka dulu, lalu yang akan datang, lalu yang paling baru selesai —
   * masing-masing dari yang paling dekat waktunya. Judulnya jadi benar.
   */
  const events = allEvents();
  const peringkat = { terbuka: 0, akan: 1, selesai: 2 } as const;
  const kini = new Date();
  const featured = [...events]
    .sort((a, b) => {
      const beda = peringkat[statusEvent(a, kini)] - peringkat[statusEvent(b, kini)];
      if (beda !== 0) return beda;
      // Dalam kelompok yang sama: yang belum lewat diurut dari yang terdekat,
      // yang sudah lewat dari yang paling baru.
      return statusEvent(a, kini) === "selesai"
        ? waktuEvent(b) - waktuEvent(a)
        : waktuEvent(a) - waktuEvent(b);
    })
    .slice(0, 6);

  const { terbitan } = await semuaTerbitan();
  /* Seksi partner: master institusi mitra Divisi Kemitraan (dasbor). */
  const mitraMaster = await ambilMitraMaster();
  /* Beranda (permintaan Pras, 2026-11-20): UNIKOM, UP, Warmadewa, YPBI tidak
     dipajang di sini (tetap ada di /mitra). Dinding logo hanya baris penuh
     (kelipatan 6 = 2/3/6 kolom); sisanya ikut daftar nama di bawahnya. */
  const SEMBUNYI_BERANDA = new Set(["UNIKOM", "UP", "UNIVERSITAS WARMADEWA", "YPBI"]);
  const mitraBeranda = (mitraMaster ?? []).filter(
    (m) => !SEMBUNYI_BERANDA.has((m.singkatan ?? "").toUpperCase()) && !SEMBUNYI_BERANDA.has(m.nama.toUpperCase()),
  );
  const berlogo = mitraBeranda.filter((m) => m.logo);
  const dindingMitra = berlogo.slice(0, Math.floor(berlogo.length / 6) * 6 || berlogo.length);
  const pilMitra = mitraBeranda.filter((m) => !dindingMitra.includes(m));

  /* Agenda terdekat: satu kegiatan per edisi, lima ke depan (kalender dasbor). */
  const hariIni = kini.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const sampai = new Date(kini.getTime() + 200 * 86_400_000).toISOString().slice(0, 10);
  const kal = (await ambilKalender(hariIni, sampai, locale)) ?? [];
  const sudah = new Set<string>();
  const agendaDekat = ratakan(kal)
    .filter((e) => e.tanggal >= hariIni && !sudah.has(e.edisi.akronim) && (sudah.add(e.edisi.akronim), true))
    .slice(0, 5)
    .map((e) => ({
      tanggalPendek: new Date(`${e.tanggal}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }),
      judul: e.judul,
      edisi: `${e.edisi.akronim} ${e.edisi.tahun}`,
    }));
  const latestIssue = terbitan.find((i) => i.hasPdf);

  /* Edisi yang pendaftarannya benar-benar dibuka menurut dashboard. Ini satu-
     satunya sumber yang tahu saklarnya, dan sebagian edisi di sini belum
     pernah ada di data warisan sama sekali. Seri yang belum dipin panitia
     tidak menjawab, dan beranda diam-diam tampil tanpa blok ini. */
  const seriDasbor = [...(await ambilSemuaSeriDashboard()).values()].filter(milikSitus);
  const semuaDibuka = seriDasbor
    .filter((e) => e.pendaftaranDibuka)
    .sort((a, b) => (a.pendaftaranTutup ?? "9999").localeCompare(b.pendaftaranTutup ?? "9999"));
  const dibuka = semuaDibuka.slice(0, 3);
  /* Edisi yang belum selesai (dihitung dari tanggal dasbor), selain tiga di
     atas; yang sudah selesai dilewati. */
  const sudahTampil = new Set(dibuka.map((e) => e.id));
  const akanDatang = seriDasbor
    .filter((e) => e.status !== "selesai" && !sudahTampil.has(e.id))
    .sort((a, b) => (a.mulai ?? "9999").localeCompare(b.mulai ?? "9999"))
    .slice(0, 6);
  const tutupIso = semuaDibuka.find((e) => e.pendaftaranTutup)?.pendaftaranTutup ?? null;
  const tutupTerdekat = tutupIso
    ? new Date(`${tutupIso}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <>
      {/* ── Hero (konsep GYSO): bidang navy bergradasi + logo IYSA 3D ── */}
      <section className="relative isolate overflow-hidden bg-[#0b2948] text-white">
        {/* Latar polos bergradasi: gelap di sisi teks (kontras judul), makin biru
            ke sisi lambang 3D — tanpa kisi, tanpa foto. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,#0a2443_0%,#0b2948_45%,#123d6f_78%,#1a4f8c_100%)]" />
        <div className="shell grid items-center gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <p className="rise font-sans text-[11.5px] font-bold tracking-[0.16em] text-white/75 uppercase">{t("eyebrow")}</p>
            <h1 className="rise mt-5 max-w-[16ch] font-serif text-[clamp(2.6rem,1.4rem+5vw,5.5rem)] leading-[1.03] tracking-[-0.02em] text-white">
              {t("heroTitle")}
            </h1>
            <p className="rise mt-6 max-w-[54ch] font-sans text-lead text-white/85">{t("heroBody")}</p>
            <div className="rise mt-10 flex flex-wrap gap-3">
              <Link href="/event" className="group inline-flex items-center gap-3 bg-white px-6 py-3.5 text-[14.5px] font-bold text-[#0b2948] transition-opacity hover:opacity-90">
                {t("ctaEvents")} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link href="/profil" className="inline-flex items-center gap-3 border-2 border-white px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:border-white hover:bg-white/10">
                {t("ctaProfile")}
              </Link>
            </div>
          </div>
          {/* Lambang IYSA tiga dimensi, bergerak. Warnanya dibaca dari --logo-*:
              selagi di hero navy dipakai orbit putih + teal/oranye jenuh dan bola
              dunia putih berbenua biru (warnaHero), tanpa sorot. */}
          <div className="md:col-span-5">
            <HeroAtom className="mx-auto md:mr-0 md:ml-auto"
              warnaHero={{ navy: "#ffffff", teal: "#2ec4b6", coral: "#ff6b4a", "bola-benua": "#1f5fae", "bola-badan": "#ffffff" }} />
            <p className="mt-6 max-w-[40ch] text-[15px] leading-relaxed text-white/75 md:ml-auto">{intro[locale]}</p>
          </div>
        </div>
      </section>

      {/* ── Pita info navy ── */}
      <section className="tema-navy">
        <div className="shell flex flex-col gap-2 py-4 text-[13.5px] md:flex-row md:items-center md:justify-between md:gap-8">
          <p className="font-sans text-[11px] font-bold tracking-[0.16em] text-[var(--ink-faint)] uppercase">{t("stripEyebrow")}</p>
          <p className="text-[var(--ink)]">
            {dibuka.length > 0
              ? tutupTerdekat ? t("stripOpen", { count: semuaDibuka.length, date: tutupTerdekat }) : t("stripOpenNoDate", { count: semuaDibuka.length })
              : t("stripClosed")}
          </p>
          <Link href="/event" className="font-bold text-[var(--ink)] hover:underline">{t("stripCta")} →</Link>
        </div>
      </section>

      {/* ── Linimasa agenda terdekat (kalender dasbor) ── */}
      {agendaDekat.length > 0 && (
        <section className="border-b border-[var(--line)]">
          <div className="shell py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{t("timelineEyebrow")}</p>
                <h2 className="mt-3 font-serif text-display font-normal text-[var(--navy)]">{t("timelineTitle")}</h2>
              </div>
              <MoreLink href="/kalender">{t("timelineAll")}</MoreLink>
            </div>
            {/* Ponsel: daftar rapat bertanggal di kiri (dulu tiap agenda
                memakan ±130 px). Layar lebar: linimasa mendatar seperti semula. */}
            <ol className="relative mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)] sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-8 sm:divide-y-0 sm:border-b-0 sm:border-t-2 sm:border-[var(--navy)] lg:grid-cols-5 lg:gap-0">
              {agendaDekat.map((a, k) => (
                <li key={k} className="relative grid grid-cols-[76px_1fr] gap-x-3 py-3.5 sm:block sm:py-0 sm:pt-8 lg:border-l lg:border-[var(--line)] lg:px-5 lg:first:border-l-0 lg:first:pl-0">
                  <span aria-hidden className="absolute -top-[7px] left-0 hidden h-3 w-3 rounded-full border-2 border-[var(--navy)] bg-[var(--bg)] sm:block lg:left-5 lg:first:left-0" />
                  <p className="tnum row-span-2 font-serif text-[19px] leading-tight text-[var(--teal)] uppercase sm:text-[24px] sm:leading-normal">{a.tanggalPendek}</p>
                  <p className="font-serif text-[16px] leading-snug text-[var(--ink)] sm:mt-3">{a.judul}</p>
                  <p className="mt-1 text-[12.5px] text-[var(--ink-faint)] sm:mt-2">{a.edisi}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── Angka ─────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--line)]">
        <div className="shell py-12 md:py-16">
          <p className="eyebrow mb-8">{t("statsEyebrow")}</p>
          <StatRow
            items={[
              { value: s.events, label: t("statEvents") },
              { value: s.affiliates, label: t("statAffiliates") },
              { value: s.partners, label: t("statPartners") },
              { value: `${s.countries}+`, label: t("statCountries") },
              { value: terbitan.length, label: t("statIssues") },
              { value: s.people, label: t("statPeople") },
            ]}
          />
        </div>
      </section>

      {/* ── Pendaftaran terbuka ───────────────────────────────────────
          Mendahului sorotan event. Pengunjung beranda yang datang untuk ikut
          lomba menanyakan satu hal lebih dulu — mana yang masih bisa saya
          daftari sekarang — dan hanya dashboard yang tahu jawabannya. */}
      {dibuka.length > 0 && (
        <Section eyebrow={t("openNowEyebrow")} title={t("openNowTitle")}>
          <KisiKartuEdisi jumlah={dibuka.length}>
            {dibuka.map((e) => (
              <li key={e.id} className="flex">
                <EdisiDashboardKartu edisi={e} />
              </li>
            ))}
          </KisiKartuEdisi>
        </Section>
      )}

      {/* ── Akan datang (dasbor) ───────────────────────────────────
          Dulu dari data warisan situs lama (poster, judul, tanggal yang sudah
          tidak sesuai, termasuk event yang sudah selesai). Sejak 2026-11-20
          (permintaan Pras): edisi dasbor yang belum selesai, di luar yang
          sudah tampil di "Pendaftaran terbuka", urut dari yang terdekat.
          Bila dasbor tidak terjangkau, kembali ke daftar warisan. */}
      {akanDatang.length > 0 ? (
        <Section
          eyebrow={t("eventsEyebrow")}
          title={t("upcomingTitle")}
          action={<MoreLink href="/event">{t("eventsAll")}</MoreLink>}
        >
          <KisiKartuEdisi jumlah={akanDatang.length}>
            {akanDatang.map((e) => (
              <li key={e.id} className="flex">
                <EdisiDashboardKartu edisi={e} />
              </li>
            ))}
          </KisiKartuEdisi>
        </Section>
      ) : seriDasbor.length === 0 ? (
        <Section
          eyebrow={t("eventsEyebrow")}
          title={t("eventsTitle")}
          action={<MoreLink href="/event">{t("eventsAll")}</MoreLink>}
        >
          <ul className="rise-stagger grid grid-cols-2 border-t border-l border-[var(--line)] lg:grid-cols-3">
            {featured.map((e) => (
              <li key={e.slug} className="border-r border-b border-[var(--line)] bg-[var(--bg)]">
                <EventCard event={e} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* ── Kurasi Puspresnas ─────────────────────────────────────────
          Duduk tepat setelah daftar event: di situlah pengunjung sedang
          menimbang mau ikut atau tidak, dan pengakuan resmi kementerian
          adalah yang membedakan ajang IYSA dari lomba biasa. Isinya, dan
          alasan ia satu-satunya blok berwarna penuh di halaman ini, ada di
          komponennya. */}
      <KurasiPanel locale={locale} />

      {/* ── Visi, misi, tujuan ────────────────────────────────────── */}
      <Section eyebrow={t("visionEyebrow")} title={t("visionTitle")} sunk>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h3 className="eyebrow">{t("vision")}</h3>
            <p className="mt-3 font-serif text-lead leading-snug text-[var(--ink)]">{vision[locale]}</p>
          </div>

          <div className="md:col-span-7 md:grid md:grid-cols-2 md:gap-10">
            <div>
              <h3 className="eyebrow">{t("mission")}</h3>
              <ol className="mt-3 flex flex-col gap-3">
                {mission.map((m, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-[var(--ink-muted)]">
                    <span className="tnum shrink-0 font-sans text-[12px] font-bold text-[var(--teal)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {m[locale]}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-8 md:mt-0">
              <h3 className="eyebrow">{t("goals")}</h3>
              <ol className="mt-3 flex flex-col gap-3">
                {goals.map((g, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-[var(--ink-muted)]">
                    <span className="tnum shrink-0 font-sans text-[12px] font-bold text-[var(--teal)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {g[locale]}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Mitra ─────────────────────────────────────────────────── */}
      <Section
        eyebrow={t("partnersEyebrow")}
        title={t("partnersTitle")}
        action={
          mitraMaster ? (
            <MoreLink href="/mitra#institusi">{t("partnersMasterAll", { count: mitraMaster.length })}</MoreLink>
          ) : (
            <MoreLink href="/mitra">{t("partnersAll", { count: allAffiliates().length })}</MoreLink>
          )
        }
      >
        {mitraMaster ? (
          /* Master data Divisi Kemitraan di dasbor (2026-11-20, permintaan
             Pras): yang berlogo tampil di dinding bernama, sisanya sebagai
             nama saja — tidak ada mitra yang tersebut dua kali. */
          <div>
            <MitraMasterWall mitra={dindingMitra} />
            {pilMitra.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {pilMitra
                  .map((m) => {
                    const href = situsMitra(m);
                    const kelas =
                      "inline-flex rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[13.5px] text-[var(--ink-muted)]";
                    return (
                      <li key={m.id}>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className={`${kelas} transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--teal)] hover:text-[var(--teal)]`}
                          >
                            {m.nama}
                          </a>
                        ) : (
                          <span className={kelas}>{m.nama}</span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        ) : (
          /* Cadangan bila dasbor tidak terjangkau: daftar warisan situs lama. */
          <>
            <ul className="flex flex-wrap gap-2">
              {allAffiliates().map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/mitra/${a.slug}`}
                    className="inline-flex rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[13.5px] text-[var(--ink-muted)] transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
                  >
                    {affiliateNames[a.slug] ?? a.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <h3 className="eyebrow">{t("partnersWallTitle")}</h3>
              <p className="mt-2 mb-6 max-w-[52ch] text-[14.5px] text-[var(--ink-muted)]">
                {t("partnersWallLead", { count: s.partners })}
              </p>
              <PartnerWall batas={12} />
              <div className="mt-5">
                <MoreLink href="/mitra#institusi">{t("partnersWallAll", { count: s.partners })}</MoreLink>
              </div>
            </div>
          </>
        )}

        <div>
          {/* Mitra media. Situs lama memberinya seksi sendiri di beranda; itu
              tidak ikut pindah sama sekali, jadi satu-satunya mitra media IYSA
              tak tersebut di mana pun. Ia menumpang di sini alih-alih diberi
              seksi sendiri — satu logo di bawah judul selebar layar akan
              terbaca sebagai ruang kosong, bukan sebagai pengakuan. */}
          <div className="mt-10 border-t border-[var(--line)] pt-8">
            <h3 className="eyebrow">{t("mediaPartnersTitle")}</h3>
            <ul className="mt-4 flex flex-wrap gap-4">
              {mediaPartners.map((m) => (
                /* Tanpa ubin terang `sel-logo` yang dipakai dinding mitra:
                   logo ini sudah membawa latarnya sendiri yang gelap, jadi
                   alas terang di baliknya cuma jadi bingkai canggung. */
                <li key={m.name} className="grid h-20 w-44 place-items-center overflow-hidden border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.logo}
                    alt={m.name}
                    width={176}
                    height={80}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {dibuka.length > 0 && (
        <PitaDaftar teks={t("openBar", { count: semuaDibuka.length })} aksi={t("openBarCta")} />
      )}

      {/* ── Pita ajakan biru (konsep GYSO) ── */}
      <section className="tema-biru">
        <div className="shell flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-16">
          <div>
            <p className="font-sans text-[11.5px] font-bold tracking-[0.16em] text-[var(--ink-muted)] uppercase">{t("ctaBandEyebrow")}</p>
            <h2 className="mt-3 font-serif text-display font-normal text-white">{t("ctaBandTitle")}</h2>
            <p className="mt-3 max-w-[52ch] text-[15px] text-[var(--ink-muted)]">{t("ctaBandBody")}</p>
          </div>
          <Link href="/event" className="group inline-flex shrink-0 items-center gap-3 bg-white px-7 py-3.5 text-[14.5px] font-bold text-[#0b2948] transition-opacity hover:opacity-90">
            {t("ctaBandButton")} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <Section sunk>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <p className="eyebrow">{t("newsletterEyebrow")}</p>
            <h2 className="mt-2 font-serif text-title text-[var(--ink)]">{t("newsletterTitle")}</h2>
            <p className="mt-3 max-w-[52ch] font-sans text-[var(--ink-muted)]">{t("newsletterBody")}</p>
            {latestIssue && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Pill tone="teal">{latestIssue.year}</Pill>
                <MoreLink href={`/newsletter/${latestIssue.slug}`}>
                  {judulNewsletter(latestIssue, locale)}
                </MoreLink>
              </div>
            )}
            <div className="mt-7">
              <MoreLink href="/newsletter">{t("newsletterAll")}</MoreLink>
            </div>
          </div>
          <div className="md:col-span-5">
            <SubscribeForm />
          </div>
        </div>
      </Section>
    </>
  );
}
