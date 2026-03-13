import { MapPin } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="flex items-center justify-between py-6 px-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">RouteWise</h1>
          <p className="text-sm text-muted-foreground">Travel Route Analytics Dashboard</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground font-mono">
        {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
    </header>
  );
}
