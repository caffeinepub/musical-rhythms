import { ChevronLeft, Menu } from "lucide-react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  "/": "Musical Rhythms",
  "/songs": "Songs",
  "/live": "Live",
  "/about": "About Creator",
  "/admin": "Admin Panel",
  "/settings": "Settings",
};

export function Header({ currentPage, onNavigate, onMenuToggle }: HeaderProps) {
  const isHome = currentPage === "/";
  const title = pageTitles[currentPage] ?? "Musical Rhythms";

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[260px] z-30 h-16 flex items-center px-4 gap-3"
      style={{
        background: "oklch(var(--card) / 0.95)",
        borderBottom: "1px solid oklch(var(--border))",
        backdropFilter: "blur(12px)",
      }}
      data-ocid="header.panel"
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        data-ocid="header.menu.button"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      {/* Back button on inner pages — always visible */}
      {!isHome && (
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
          data-ocid="header.back.button"
        >
          <ChevronLeft size={16} />
          Back
        </button>
      )}

      {/* Logo + title */}
      {isHome && (
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-lg text-foreground">{title}</span>
          <img
            src="/assets/uploads/unnamed-019d39d0-d234-7035-b935-2f8115eca61d-1.png"
            alt="MR Logo"
            className="w-9 h-9 object-contain"
          />
        </div>
      )}
      {!isHome && (
        <h1 className="font-bold text-lg text-foreground">{title}</h1>
      )}
    </header>
  );
}
