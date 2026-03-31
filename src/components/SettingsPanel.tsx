import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ReadingPreferences, ReadingTtsRate } from "@/hooks/useReadingPreferences";
import { cn } from "@/lib/utils";
import { RotateCcw, Type } from "lucide-react";
import { useRef, useMemo } from "react";
import { useTranslation } from "@/i18n";

interface SettingsPanelProps {
  hasPortugueseVoice: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
  open: boolean;
  preferences: ReadingPreferences;
  updatePreference: <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => void;
}

const getFontOptions = (t: (key: string) => string): Array<{
  badge?: string;
  description: string;
  id: ReadingPreferences["font"];
  previewClass: string;
  title: string;
}> => [
    {
      id: "lora",
      title: "Lora",
      badge: t("settings.fontLoraBadge"),
      description: t("settings.fontLoraDesc"),
      previewClass: "font-serif",
    },
    {
      id: "dm-sans",
      title: "DM Sans",
      description: t("settings.fontDmSansDesc"),
      previewClass: "font-sans",
    },
    {
      id: "open-dyslexic",
      title: "OpenDyslexic",
      badge: t("settings.fontDyslexicBadge"),
      description: t("settings.fontDyslexicDesc"),
      previewClass: "[font-family:var(--font-reading)]",
    },
  ];

function PanelBody({ preferences, updatePreference, onReset, hasPortugueseVoice }: Omit<SettingsPanelProps, "open" | "onOpenChange">) {
  const { t } = useTranslation();
  const rateOptions: ReadingTtsRate[] = [0.75, 1, 1.25, 1.5];
  const fontOptions = useMemo(() => getFontOptions(t), [t]);

  return (
    <div className="reading-panel-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6">
      <section className="space-y-3 border-b border-border/60 pb-5">
        <h3 className="font-serif text-sm text-gold">{t("settings.font")}</h3>
        <div className="space-y-2">
          {fontOptions.map((option) => {
            const active = preferences.font === option.id;
            return (
              <button
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-gold border-2 bg-accent/50"
                    : "border-border bg-transparent hover:border-gold/40 hover:bg-accent/20",
                )}
                key={option.id}
                onClick={() => updatePreference("font", option.id)}
                type="button"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-sans text-sm text-app-text">{option.title}</p>
                  {option.badge && <span className="rounded-full bg-accent px-2 py-0.5 text-[0.64rem] text-app-text">{option.badge}</span>}
                </div>
                <p className={cn("text-base text-app-text", option.previewClass)}>{t("settings.fontPreview")}</p>
                <p className="mt-1 text-xs text-app-text-muted">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 border-b border-border/60 py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm text-gold">{t("settings.fontSize")}</h3>
          <span className="font-micro text-xs text-app-text-muted">{t("settings.fontSizeLabel", { size: preferences.fontSize })}</span>
        </div>

        <div className="flex items-center gap-2">
          <Type className="h-3.5 w-3.5 text-app-text-muted" />
          <Slider
            aria-label={t("settings.fontSizeLabel", { size: preferences.fontSize })}
            aria-valuemax={28}
            aria-valuemin={14}
            aria-valuenow={preferences.fontSize}
            aria-valuetext={t("settings.fontSizePixels", { size: preferences.fontSize })}
            max={28}
            min={14}
            onValueChange={([value]) => updatePreference("fontSize", value)}
            step={1}
            value={[preferences.fontSize]}
          />
          <Type className="h-5 w-5 text-app-text" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[14, 16, 18, 22].map((size) => (
            <Button
              className={preferences.fontSize === size ? "bg-primary text-primary-foreground" : ""}
              key={size}
              onClick={() => updatePreference("fontSize", size)}
              size="sm"
              type="button"
              variant="outline"
            >
              {size}
            </Button>
          ))}
        </div>

        <p className="text-[0.68rem] text-app-text-muted">{t("settings.fontSizeNames")}</p>
      </section>

      <section className="space-y-3 border-b border-border/60 py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm text-gold">{t("settings.verseSpacing")}</h3>
          <span className="font-micro text-xs text-app-text-muted">{preferences.verseSpacing.toFixed(1)}rem</span>
        </div>

        <Slider
          max={1.6}
          min={0.4}
          onValueChange={([value]) => updatePreference("verseSpacing", Number(value.toFixed(1)))}
          step={0.1}
          value={[preferences.verseSpacing]}
        />
        <p className="text-[0.68rem] text-app-text-muted">{t("settings.verseSpacingDesc")}</p>
      </section>

      <section className="space-y-3 border-b border-border/60 py-5">
        <h3 className="font-serif text-sm text-gold">{t("settings.columnWidth")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "narrow", label: t("settings.columnNarrow") },
            { key: "normal", label: t("settings.columnNormal") },
            { key: "wide", label: t("settings.columnWide") },
          ].map((item) => (
            <Button
              className={preferences.columnWidth === item.key ? "bg-primary text-primary-foreground" : ""}
              key={item.key}
              onClick={() => updatePreference("columnWidth", item.key as ReadingPreferences["columnWidth"])}
              size="sm"
              type="button"
              variant="outline"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-border/60 py-5">
        <h3 className="font-serif text-sm text-gold">{t("settings.theme")}</h3>
        <ThemeToggle />
      </section>

      <section className="space-y-3 border-b border-border/60 py-5">
        <h3 className="font-serif text-sm text-gold">{t("settings.tts")}</h3>
        <div className="grid grid-cols-4 gap-2">
          {rateOptions.map((rate) => (
            <Button
              className={preferences.ttsRate === rate ? "bg-primary text-primary-foreground" : ""}
              key={rate}
              onClick={() => updatePreference("ttsRate", rate)}
              size="sm"
              type="button"
              variant="outline"
            >
              {rate}x
            </Button>
          ))}
        </div>
        {!hasPortugueseVoice && (
          <p className="text-xs text-app-text-muted">{t("settings.ttsNoVoice")}</p>
        )}
      </section>

      <section className="space-y-3 py-5">
        <div className="flex items-center justify-between rounded-lg border border-border bg-app-bg px-3 py-2">
          <Label className="text-sm text-app-text" htmlFor="focus-mode-toggle">
            {t("settings.focusMode")}
          </Label>
          <Switch
            checked={preferences.focusMode}
            id="focus-mode-toggle"
            onCheckedChange={(checked) => updatePreference("focusMode", checked)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-app-bg px-4 py-3">
        <p
          className="text-app-text"
          style={{
            fontFamily: "var(--font-reading)",
            fontSize: "var(--font-size-reading)",
            lineHeight: `calc(1.7 + var(--verse-spacing) / 4)`,
          }}
        >
          Porque Deus amou o mundo — João 3:16
        </p>
      </section>

      <div className="mt-4 pb-2">
        <Button className="w-full gap-2" onClick={onReset} type="button" variant="outline">
          <RotateCcw className="h-3.5 w-3.5" />
          {t("settings.reset")}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPanel(props: SettingsPanelProps) {
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  useFocusTrap(panelRef, props.open);

  if (isMobile) {
    return (
      <Drawer onOpenChange={props.onOpenChange} open={props.open}>
        <DrawerContent aria-label={t("settings.panelAriaLabel")} className="h-[70vh] overflow-hidden border-border bg-[hsl(var(--reading-panel-bg))]">
          <div className="flex h-full min-h-0 flex-col" ref={panelRef}>
            <DrawerHeader>
              <DrawerTitle className="font-serif text-base text-gold">{t("settings.title")}</DrawerTitle>
              <DrawerDescription className="break-words">{t("settings.description")}</DrawerDescription>
            </DrawerHeader>
            <PanelBody {...props} />
            <DrawerFooter>
              <DrawerClose asChild>
                <Button aria-label={t("settings.close")} variant="outline">{t("settings.close")}</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet onOpenChange={props.onOpenChange} open={props.open}>
      <SheetContent aria-label={t("settings.panelAriaLabel")} className="w-[300px] overflow-hidden border-l border-l-gold/20 bg-[hsl(var(--reading-panel-bg))] p-0 sm:max-w-[300px]">
        <div className="flex h-full min-h-0 flex-col" ref={panelRef}>
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="font-serif text-base text-gold">{t("settings.title")}</SheetTitle>
            <SheetDescription className="break-words">{t("settings.description")}</SheetDescription>
          </SheetHeader>
          <PanelBody {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}