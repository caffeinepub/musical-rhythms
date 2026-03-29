import { ArrowLeft } from "lucide-react";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

const aboutParagraphs = [
  "Hello, I am Soham Jagtap. I am currently a student and deeply passionate about music. I am learning and growing in music every day, and I aspire to build my career in this field.",
  "As I continue my journey, I record the new things I learn and experiment with, and I share them here on this website. You will find my latest singing covers, instrumentals, and musical creations all in one place.",
  "I also go live at times to share music in real-time, and you are always welcome to join and be a part of that experience.",
  "This website, Musical Rhythms, is not just a platform \u2014 it is a reflection of my journey, my learning, and my passion for music.",
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {/* Back button */}
      <div className="max-w-xl mx-auto mb-6">
        <button
          type="button"
          onClick={() => onNavigate("/")}
          data-ocid="about.back.button"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="max-w-xl mx-auto flex flex-col items-center gap-6 pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/uploads/unnamed-019d39d0-d234-7035-b935-2f8115eca61d-1.png"
            alt="Musical Rhythms Logo"
            className="w-28 h-auto object-contain"
          />
          <div className="text-center">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--accent-color)" }}
            >
              Musical Rhythms
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Music by Soham Jagtap
            </p>
          </div>
        </div>

        {/* About text */}
        <div
          className="w-full rounded-2xl border border-border p-6 space-y-4"
          style={{ background: "oklch(var(--card))" }}
        >
          {aboutParagraphs.map((para) => (
            <p
              key={para.slice(0, 30)}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
