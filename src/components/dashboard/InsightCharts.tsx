import { RouteRecord } from "@/hooks/useRouteData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from "recharts";

interface Props {
  data: RouteRecord[];
}

const COLORS = [
  "hsl(220, 90%, 56%)",
  "hsl(160, 84%, 39%)",
  "hsl(280, 65%, 60%)",
  "hsl(35, 92%, 55%)",
  "hsl(350, 80%, 55%)",
];

const chartTooltipStyle = {
  contentStyle: {
    background: "hsl(0 0% 100%)",
    border: "1px solid hsl(220, 13%, 91%)",
    borderRadius: "8px",
    fontSize: "12px",
  },
};

export default function InsightCharts({ data }: Props) {
  // Top 5 routes
  const routeCounts: Record<string, number> = {};
  data.forEach((r) => {
    const key = `${r.start_location} → ${r.end_location}`;
    routeCounts[key] = (routeCounts[key] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route: route.length > 25 ? route.slice(0, 25) + "…" : route, count }));

  // Avg travel time by route
  const routeTime: Record<string, { sum: number; count: number }> = {};
  data.forEach((r) => {
    const key = `${r.start_location} → ${r.end_location}`;
    if (!routeTime[key]) routeTime[key] = { sum: 0, count: 0 };
    routeTime[key].sum += r.travel_time_minutes;
    routeTime[key].count++;
  });
  const avgTimeByRoute = Object.entries(routeTime)
    .map(([route, v]) => ({ route: route.length > 25 ? route.slice(0, 25) + "…" : route, avg: Math.round(v.sum / v.count) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // Busy travel times (by time of day period)
  const periodCounts: Record<string, number> = {};
  data.forEach((r) => {
    const period = r.timestamp || "Unknown";
    periodCounts[period] = (periodCounts[period] || 0) + 1;
  });
  const periodOrder = ["Morning Peak", "Afternoon", "Evening Peak", "Night"];
  const busyTimes = Object.entries(periodCounts)
    .sort((a, b) => {
      const ai = periodOrder.indexOf(a[0]);
      const bi = periodOrder.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([period, trips]) => ({ hour: period, trips }));

  // Weather impact
  const weatherTime: Record<string, { sum: number; count: number }> = {};
  data.forEach((r) => {
    if (!weatherTime[r.weather]) weatherTime[r.weather] = { sum: 0, count: 0 };
    weatherTime[r.weather].sum += r.travel_time_minutes;
    weatherTime[r.weather].count++;
  });
  const weatherImpact = Object.entries(weatherTime).map(([weather, v]) => ({
    weather,
    avg: Math.round(v.sum / v.count),
  }));

  // Trip volume by day type and weather
  const comboCount: Record<string, number> = {};
  data.forEach((r) => {
    const key = `${r.day_type} - ${r.weather}`;
    comboCount[key] = (comboCount[key] || 0) + 1;
  });
  const tripVolume = Object.entries(comboCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, trips]) => ({ date: label, trips }));

  // Distance distribution
  const distBins = [
    { range: "0–5 km", min: 0, max: 5, count: 0 },
    { range: "5–10 km", min: 5, max: 10, count: 0 },
    { range: "10–20 km", min: 10, max: 20, count: 0 },
    { range: "20+ km", min: 20, max: Infinity, count: 0 },
  ];
  data.forEach((r) => {
    const bin = distBins.find((b) => r.distance_km >= b.min && r.distance_km < b.max);
    if (bin) bin.count++;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 5 Routes */}
      <div className="chart-container">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top 5 Routes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topRoutes} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis type="number" fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <YAxis type="category" dataKey="route" width={120} fontSize={10} tick={{ fill: "hsl(220,10%,46%)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="count" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg Travel Time by Route */}
      <div className="chart-container">
        <h3 className="text-sm font-semibold text-foreground mb-3">Avg Travel Time by Route</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={avgTimeByRoute} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis type="number" fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <YAxis type="category" dataKey="route" width={120} fontSize={10} tick={{ fill: "hsl(220,10%,46%)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="avg" fill={COLORS[1]} radius={[0, 4, 4, 0]} name="Avg Time (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Busy Travel Times */}
      <div className="chart-container">
        <h3 className="text-sm font-semibold text-foreground mb-3">Busy Travel Times</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={busyTimes}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="hour" fontSize={10} tick={{ fill: "hsl(220,10%,46%)" }} interval={3} />
            <YAxis fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Line type="monotone" dataKey="trips" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weather Impact */}
      <div className="chart-container">
        <h3 className="text-sm font-semibold text-foreground mb-3">Weather Impact on Travel</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weatherImpact}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="weather" fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <YAxis fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="avg" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Avg Time (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trip Volume Over Time */}
      <div className="chart-container">
        <h3 className="text-sm font-semibold text-foreground mb-3">Trip Volume Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={tripVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="date" fontSize={10} tick={{ fill: "hsl(220,10%,46%)" }} />
            <YAxis fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Area type="monotone" dataKey="trips" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Distance Distribution */}
      <div className="chart-container">
        <h3 className="text-sm font-semibold text-foreground mb-3">Distance Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distBins}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="range" fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <YAxis fontSize={11} tick={{ fill: "hsl(220,10%,46%)" }} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="count" fill={COLORS[4]} radius={[4, 4, 0, 0]} name="Trips" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
