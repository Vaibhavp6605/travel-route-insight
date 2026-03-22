import { RouteRecord } from "@/hooks/useRouteData";
import { Route, Clock, Ruler, TrendingUp, Zap, MapPinned } from "lucide-react";

interface KpiCardsProps {
  data: RouteRecord[];
}

export default function KpiCards({ data }: KpiCardsProps) {
  const totalTrips = data.length;
  const avgDist = totalTrips ? (data.reduce((s, r) => s + r.distance_km, 0) / totalTrips).toFixed(1) : "0";
  const avgTime = totalTrips ? (data.reduce((s, r) => s + r.travel_time_minutes, 0) / totalTrips).toFixed(0) : "0";

  const routeCounts: Record<string, number> = {};
  data.forEach((r) => {
    const key = `${r.start_location} → ${r.end_location}`;
    routeCounts[key] = (routeCounts[key] || 0) + 1;
  });
  const popularRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  const longestDist = totalTrips ? Math.max(...data.map((r) => r.distance_km)).toFixed(1) : "0";

  const routeAvgTime: Record<string, { sum: number; count: number }> = {};
  data.forEach((r) => {
    const key = `${r.start_location} → ${r.end_location}`;
    if (!routeAvgTime[key]) routeAvgTime[key] = { sum: 0, count: 0 };
    routeAvgTime[key].sum += r.travel_time_minutes;
    routeAvgTime[key].count++;
  });
  const fastestRoute = Object.entries(routeAvgTime)
    .map(([k, v]) => ({ route: k, avg: v.sum / v.count }))
    .sort((a, b) => a.avg - b.avg)[0]?.route ?? "N/A";

  const kpis = [
    { label: "Total Trips", value: totalTrips.toLocaleString(), icon: Route, color: "text-kpi-blue" },
    { label: "Avg Distance", value: `${avgDist} km`, icon: Ruler, color: "text-kpi-green" },
    { label: "Avg Travel Time", value: `${avgTime} min`, icon: Clock, color: "text-kpi-orange" },
    { label: "Most Popular Route", value: popularRoute, icon: TrendingUp, color: "text-kpi-purple", small: true },
    { label: "Longest Distance", value: `${longestDist} km`, icon: MapPinned, color: "text-kpi-red" },
    { label: "Fastest Avg Route", value: fastestRoute, icon: Zap, color: "text-kpi-teal", small: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="kpi-card flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <kpi.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${kpi.color}`} />
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">{kpi.label}</span>
          </div>
          <span className={`font-bold ${kpi.small ? "text-xs sm:text-sm" : "text-base sm:text-xl"} text-foreground leading-tight truncate`}>
            {kpi.value}
          </span>
        </div>
      ))}
    </div>
  );
}
