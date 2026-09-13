import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/* /ExpertStaff dan /ExpertTeam di situs lama menampilkan isi yang sama dari
   sumber yang sama. Digabung jadi satu halaman; alamat ini tetap hidup. */
export default async function ExpertStaffPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect({ href: "/tim/ahli", locale });
}
