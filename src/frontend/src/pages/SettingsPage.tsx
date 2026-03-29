import { Check, ChevronRight, Lock, Moon, Sun } from "lucide-react";
import { useState } from "react";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  themeId: string;
  customTheme: { bg: string; accent: string } | null;
  onThemeChange: (id: string, custom?: { bg: string; accent: string }) => void;
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
}: SettingsPageProps) {
  const isLightMode = themeId.startsWith("light-");
  const activePresets = isLightMode ? LIGHT_PRESETS : DARK_PRESETS;

  const [customBg, setCustomBg] = useState(customTheme?.bg ?? "#1d1b2e");
  const [customAccent, setCustomAccent] = useState(
    customTheme?.accent ?? "#9b6ef3",
  );

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
        {/* Appearance card */}
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

        {/* Admin section */}
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
