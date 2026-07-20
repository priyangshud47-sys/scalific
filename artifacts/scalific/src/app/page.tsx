import Home from "@/views/Home";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Page() {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["preloader_logo_url", "logo_url", "color_primary"]);

  let initialPreloaderLogo = null;
  let initialBrandColor = null;
  let initialLogo = null;

  if (data) {
    const preloaderLogo = data.find((d) => d.key === "preloader_logo_url")?.value;
    const logo = data.find((d) => d.key === "logo_url")?.value;
    initialLogo = logo || null;
    initialPreloaderLogo = preloaderLogo || logo || null;
    initialBrandColor = data.find((d) => d.key === "color_primary")?.value || null;
    console.log("SERVER SIDE FETCH:", { preloaderLogo, logo, initialPreloaderLogo });
  }

  return (
    <Home
      initialPreloaderLogo={initialPreloaderLogo}
      initialLogo={initialLogo}
      initialBrandColor={initialBrandColor}
    />
  );
}
