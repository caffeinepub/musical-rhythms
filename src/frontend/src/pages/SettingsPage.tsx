import {
  AlertTriangle,
  Check,
  ChevronRight,
  Lock,
  Moon,
  Sun,
  Volume2,
  Wifi,
} from "lucide-react";
import { useState } from "react";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  themeId: string;
  customTheme: { bg: string; accent: string } | null;
  onThemeChange: (id: string, custom?: { bg: string; accent: string }) => void;
  dataSaver: boolean;
  onDataSaverChange: (value: boolean) => void;
}

const DARK_PRESETS = [
  { id: "dark-purple", label: "Dark Purple", bg: "#1d1b2e", accent: "#9b6ef3" },
  { id: "dark-red", label: "Dark Red", bg: "#1d1b1b", accent: "#e05252" },
  { id: "dark-blue", label: "Dark Blue", bg: "#141927", accent: "#5b8dee" },
  { id: "dark-teal", label: "Dark Teal", bg: "#121e1e", accent: "#3dbdbd" },
  { id: "dark-orange", label: "Dark Orange", bg: "#1e1710", accent: "#f0913a" },
  { id: "dark-green", label: "Dark Green", bg: "#111e14", accent: "#4caf73" },
];

const LIGHT_PRESETS = [
  { id: "light-blue", label: "Light Blue", bg: "#f5f7ff", accent: "#3b7cf4" },
  {
    id: "light-purple",
    label: "Light Purple",
    bg: "#f8f5ff",
    accent: "#8b5cf6",
  },
  { id: "light-green", label: "Light Green", bg: "#f3faf5", accent: "#22c55e" },
  { id: "light-rose", label: "Light Rose", bg: "#fff5f7", accent: "#f43f7e" },
];

export function SettingsPage({
  onNavigate,
  themeId,
  customTheme,
  onThemeChange,
  dataSaver,
  onDataSaverChange,
}: SettingsPageProps) {
  const isLightMode = themeId.startsWith("light-");
  const activePresets = isLightMode ? LIGHT_PRESETS : DARK_PRESETS;

  const [customBg, setCustomBg] = useState(customTheme?.bg ?? "#1d1b2e");
  const [customAccent, setCustomAccent] = useState(
    customTheme?.accent ?? "#9b6ef3",
  );

  const [volume, setVolume] = useState(80);

  const isHighVolume = volume > 80;
  const sliderColor = isHighVolume ? "#ef4444" : "var(--accent-color)";

  const handleModeSelect = (mode: "dark" | "light") => {
    if (mode === "dark" && isLightMode) {
      onThemeChange("dark-purple");
    } else if (mode === "light" && !isLightMode) {
      onThemeChange("light-blue");
    }
  };

  const panelStyle = {
    background: "oklch(var(--card))",
    border: "1px solid oklch(var(--border))",
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* 1. Audio Settings */}
        <div className="rounded-2xl p-5" style={panelStyle}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Audio Settings
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isHighVolume
                  ? "rgba(239,68,68,0.15)"
                  : "oklch(var(--primary) / 0.12)",
              }}
            >
              <Volume2
                size={16}
                style={{
                  color: isHighVolume ? "#ef4444" : "var(--accent-color)",
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-0.5">
                Default Volume Level
              </p>
              <p className="text-xs text-muted-foreground">
                Set the default audio volume for songs
              </p>
            </div>
            <span
              className="text-sm font-semibold min-w-[36px] text-right"
              style={{
                color: isHighVolume ? "#ef4444" : "var(--accent-color)",
              }}
            >
              {volume}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: sliderColor,
              background: `linear-gradient(to right, ${sliderColor} ${volume}%, oklch(var(--muted)) ${volume}%)`,
            }}
            data-ocid="settings.volume.input"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
          {isHighVolume && (
            <div
              className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <AlertTriangle
                size={15}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "#ef4444" }}
              />
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#ef4444" }}
              >
                ⚠️ High volume warning! Listening above 80% for extended periods
                can damage your hearing. Keep it safe for your ears.
              </p>
            </div>
          )}
        </div>

        {/* 2. Data Saver */}
        <div className="rounded-2xl p-5" style={panelStyle}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Data Saver
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(var(--primary) / 0.12)" }}
              >
                <Wifi size={16} style={{ color: "var(--accent-color)" }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Reduce Data Usage
                </p>
                <p className="text-xs text-muted-foreground">
                  Lower video quality to save data
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDataSaverChange(!dataSaver)}
              className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
              style={{
                background: dataSaver
                  ? "var(--accent-color)"
                  : "oklch(var(--muted))",
              }}
              data-ocid="settings.data_saver.toggle"
              aria-pressed={dataSaver}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{
                  transform: dataSaver ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </button>
          </div>
          {dataSaver && (
            <p
              className="mt-3 text-xs px-3 py-2 rounded-lg"
              style={{
                background: "oklch(var(--primary) / 0.08)",
                color: "var(--accent-color)",
              }}
            >
              Data Saver is ON — videos will stream at slightly lower quality.
            </p>
          )}
        </div>

        {/* 3. Appearance */}
        <div className="rounded-2xl p-5" style={panelStyle}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Appearance
          </h2>

          {/* Mode selection — radio/tick style */}
          <div className="space-y-2 mb-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Mode
            </p>
            {[
              {
                mode: "dark" as const,
                label: "Dark",
                icon: <Moon size={15} />,
              },
              {
                mode: "light" as const,
                label: "Light",
                icon: <Sun size={15} />,
              },
            ].map(({ mode, label, icon }) => {
              const selected = mode === "dark" ? !isLightMode : isLightMode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeSelect(mode)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                  style={{
                    background: selected
                      ? "oklch(var(--primary) / 0.12)"
                      : "oklch(var(--muted))",
                    border: selected
                      ? "1.5px solid var(--accent-color)"
                      : "1.5px solid transparent",
                  }}
                  data-ocid={`settings.${mode}_mode.toggle`}
                >
                  {/* Tick circle */}
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: selected
                        ? "var(--accent-color)"
                        : "transparent",
                      border: selected
                        ? "2px solid var(--accent-color)"
                        : "2px solid oklch(var(--muted-foreground))",
                    }}
                  >
                    {selected && (
                      <Check size={9} color="#fff" strokeWidth={3} />
                    )}
                  </span>
                  <span style={{ color: "var(--accent-color)" }}>{icon}</span>
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Color theme presets */}
          <div className="mb-5">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Color Theme
            </p>
            <div className="grid grid-cols-3 gap-2">
              {activePresets.map((preset) => {
                const selected = themeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onThemeChange(preset.id)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                    style={{
                      background: "oklch(var(--muted))",
                      border: selected
                        ? `2px solid ${preset.accent}`
                        : "2px solid transparent",
                    }}
                    data-ocid={`settings.${preset.id}.button`}
                  >
                    <div className="flex gap-1">
                      <span
                        className="w-5 h-5 rounded-full"
                        style={{
                          background: preset.bg,
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      />
                      <span
                        className="w-5 h-5 rounded-full"
                        style={{ background: preset.accent }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">
                      {preset.label}
                    </span>
                    {selected && (
                      <Check
                        size={10}
                        style={{ color: preset.accent }}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom theme */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Custom Theme
            </p>
            <div className="flex gap-4 mb-3">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Background
                </span>
                <input
                  type="color"
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                  style={{ border: "none", padding: 0, background: "none" }}
                  data-ocid="settings.custom_bg.input"
                />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Accent</span>
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                  style={{ border: "none", padding: 0, background: "none" }}
                  data-ocid="settings.custom_accent.input"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onThemeChange("custom", { bg: customBg, accent: customAccent })
              }
              className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--accent-color)" }}
              data-ocid="settings.apply_custom.button"
            >
              Apply Custom Theme
            </button>
          </div>
        </div>

        {/* 4. Administration */}
        <div className="rounded-2xl p-5" style={panelStyle}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Administration
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("/admin")}
            className="w-full flex items-center justify-between group rounded-xl px-2 py-2 hover:bg-muted transition-colors"
            data-ocid="settings.admin.button"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(var(--primary) / 0.12)" }}
              >
                <Lock size={16} style={{ color: "var(--accent-color)" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  Admin Page
                </p>
                <p className="text-xs text-muted-foreground">
                  Login to manage content
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-foreground transition-colors"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
