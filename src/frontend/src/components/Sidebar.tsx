import { Home, Music, Music2, Radio, Settings, User, X } from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/songs", label: "Songs", icon: Music },
  { path: "/live", label: "Live", icon: Radio },
  { path: "/about", label: "About Creator", icon: User },
];

export function Sidebar({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}: SidebarProps) {
  const handleNav = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed top-0 left-0 h-full z-50 w-[260px] flex flex-col",
          "bg-card border-r border-border",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        data-ocid="sidebar.panel"
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(var(--primary) / 0.18)" }}
          >
            <Music2 size={20} style={{ color: "var(--accent-color)" }} />
          </div>
          <span className="font-bold text-base text-foreground tracking-tight">
            Musical Rhythms
          </span>
          {/* Mobile close */}
          <button
            type="button"
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = currentPage === path;
            return (
              <button
                type="button"
                key={path}
                onClick={() => handleNav(path)}
                data-ocid={`sidebar.${label.toLowerCase().replace(/ /g, "_")}.link`}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
                style={
                  isActive
                    ? {
                        background: "oklch(var(--primary) / 0.15)",
                        color: "oklch(var(--primary))",
                      }
                    : {}
                }
              >
                <Icon
                  size={18}
                  style={isActive ? { color: "var(--accent-color)" } : {}}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="px-3 pb-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => handleNav("/settings")}
            data-ocid="sidebar.settings.link"
            className={[
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
              "transition-all duration-200",
              currentPage === "/settings"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ].join(" ")}
            style={
              currentPage === "/settings"
                ? {
                    background: "oklch(var(--primary) / 0.15)",
                    color: "oklch(var(--primary))",
                  }
                : {}
            }
          >
            <Settings
              size={18}
              style={
                currentPage === "/settings"
                  ? { color: "var(--accent-color)" }
                  : {}
              }
            />
            Settings
          </button>
          <p className="text-xs text-muted-foreground px-4 pt-2">
            Music by Soham Jagtap
          </p>
        </div>
      </aside>
    </>
  );
}
