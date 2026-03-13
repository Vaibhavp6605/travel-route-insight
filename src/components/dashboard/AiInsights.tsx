import { RouteRecord } from "@/hooks/useRouteData";
import { Sparkles } from "lucide-react";

interface Props {
  data: RouteRecord[];
}

export default function AiInsights({ data }: Props) {
  if (!data.length) return null;

  // Generate insights
  const insights: string[] = [];

  // Most popular route
  const routeCounts: Record<string, number> = {};
  data.forEach((r) => {
    const key = `${r.start_location} → ${r.end_location}`;
    routeCounts[key] = (routeCounts[key] || 0) + 1;
  });
  const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topRoute) {
    insights.push(`The most frequent route is ${topRoute[0]} with ${topRoute[1]} trips recorded.`);
  }

  // Weekday vs weekend
  const weekday = data.filter((r) => r.day_type === "Weekday");
  const weekend = data.filter((r) => r.day_type === "Weekend");
  if (weekday.length && weekend.length) {
    const wdAvg = weekday.reduce((s, r) => s + r.travel_time_minutes, 0) / weekday.length;
    const weAvg = weekend.reduce((s, r) => s + r.travel_time_minutes, 0) / weekend.length;
    const diff = Math.abs(wdAvg - weAvg).toFixed(0);
    insights.push(
      wdAvg > weAvg
        ? `Weekday trips take ~${diff} minutes longer on average than weekend trips, suggesting higher congestion during work days.`
        : `Weekend trips take ~${diff} minutes longer on average, possibly due to leisure travel patterns.`
    );
  }

  // Weather impact
  const weatherTime: Record<string, { sum: number; count: number }> = {};
  data.forEach((r) => {
    if (!weatherTime[r.weather]) weatherTime[r.weather] = { sum: 0, count: 0 };
    weatherTime[r.weather].sum += r.travel_time_minutes;
    weatherTime[r.weather].count++;
  });
  const weatherAvgs = Object.entries(weatherTime).map(([w, v]) => ({ weather: w, avg: v.sum / v.count }));
  const slowest = weatherAvgs.sort((a, b) => b.avg - a.avg)[0];
  const fastest = weatherAvgs.sort((a, b) => a.avg - b.avg)[0];
  if (slowest && fastest && slowest.weather !== fastest.weather) {
    insights.push(
      `${slowest.weather} weather increases average travel time to ${slowest.avg.toFixed(0)} min, compared to ${fastest.avg.toFixed(0)} min during ${fastest.weather} conditions.`
    );
  }

  // Peak travel period
  const periodCounts: Record<string, number> = {};
  data.forEach((r) => {
    const period = r.timestamp || "Unknown";
    periodCounts[period] = (periodCounts[period] || 0) + 1;
  });
  const peakPeriod = Object.entries(periodCounts).sort((a, b) => b[1] - a[1])[0];
  if (peakPeriod) {
    insights.push(`Peak travel period is "${peakPeriod[0]}" with ${peakPeriod[1]} trips recorded.`);
  }

  return (
    <div className="chart-container border-l-4 border-l-primary">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">AI Insights</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
