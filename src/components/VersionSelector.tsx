import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BibleVersion, getVersion, isBibleVersion, setVersion, getVersionsForLocale, getVersionInfo } from "@/lib/themes";
import { useTranslation } from "@/i18n";
import { useSubscription } from "@/hooks/useSubscription";

export default function VersionSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useTranslation();
  const { isPro } = useSubscription();
  const [currentVersion, setCurrentVersion] = useState<BibleVersion>(() => getVersion());

  const pathSegments = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);
  const validVersions = getVersionsForLocale(locale);

  useEffect(() => {
    const firstSegment = pathSegments[0];
    if (isBibleVersion(firstSegment) && firstSegment !== currentVersion) {
      setCurrentVersion(firstSegment);
      setVersion(firstSegment);
    }
  }, [currentVersion, pathSegments]);

  useEffect(() => {
    const syncVersion = () => setCurrentVersion(getVersion());
    const onStorage = (event: StorageEvent) => {
      if (event.key === "bv-version") syncVersion();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("bv-version-change", syncVersion);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bv-version-change", syncVersion);
    };
  }, []);

  const handleVersionChange = (version: BibleVersion) => {
    const info = getVersionInfo(version);
    if (info?.isPro && !isPro) {
      navigate("/pro");
      return;
    }

    setCurrentVersion(version);
    setVersion(version);

    // Aciona warmup proativo da nova versão em background
    import("@/utils/bibleWarmup").then(({ warmupAcfBibleCache }) => {
      warmupAcfBibleCache();
    });

    if (isBibleVersion(pathSegments[0])) {
      const nextPath = [version, ...pathSegments.slice(1)].join("/");
      navigate(`/${nextPath}${location.search}`);
    }
  };

  return (
    <select
      aria-label="Selecionar versão da Bíblia"
      className="h-8 rounded-full border border-border bg-app-raised px-3 font-sans text-[0.68rem] uppercase tracking-[0.08em] text-app-text outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => handleVersionChange(event.target.value as BibleVersion)}
      value={currentVersion}
    >
      {validVersions.map((v) => (
        <option key={v.id} value={v.id}>
          {v.id.toUpperCase()}
        </option>
      ))}
    </select>
  );
}