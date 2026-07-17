import { Cog } from "lucide-react";

type LoadingGearProps = {
  compact?: boolean;
  label?: string;
  className?: string;
};

export function LoadingGear({ compact = false, label = "Carregando", className = "" }: LoadingGearProps) {
  if (compact) {
    return (
      <span className={`loading-gear loading-gear--compact ${className}`} role="status" aria-label={label}>
        <Cog aria-hidden="true" />
      </span>
    );
  }

  return (
    <div className={`loading-gear-screen ${className}`} role="status" aria-live="polite">
      <div className="loading-gear-halo" aria-hidden="true" />
      <span className="loading-gear" aria-hidden="true">
        <Cog />
        <span />
      </span>
      <p>{label}</p>
    </div>
  );
}
