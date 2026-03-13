import { useState } from "react";
import { RouteRecord } from "@/hooks/useRouteData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Clock } from "lucide-react";

interface Props {
  data: RouteRecord[];
  starts: string[];
  ends: string[];
  weathers: string[];
  dayTypes: string[];
}

export default function PredictionModule({ data, starts, ends, weathers, dayTypes }: Props) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [weather, setWeather] = useState("");
  const [dayType, setDayType] = useState("");
  const [prediction, setPrediction] = useState<number | null>(null);

  const predict = () => {
    // Simple weighted average regression
    let matches = data;
    const weights: { records: RouteRecord[]; weight: number }[] = [];

    // Exact matches get highest weight
    const exact = data.filter(
      (r) => r.start_location === start && r.end_location === end && r.weather === weather && r.day_type === dayType
    );
    if (exact.length) weights.push({ records: exact, weight: 4 });

    // Route + weather
    const routeWeather = data.filter(
      (r) => r.start_location === start && r.end_location === end && r.weather === weather
    );
    if (routeWeather.length) weights.push({ records: routeWeather, weight: 3 });

    // Route only
    const routeOnly = data.filter(
      (r) => r.start_location === start && r.end_location === end
    );
    if (routeOnly.length) weights.push({ records: routeOnly, weight: 2 });

    // Weather + day type fallback
    const weatherDay = data.filter((r) => r.weather === weather && r.day_type === dayType);
    if (weatherDay.length) weights.push({ records: weatherDay, weight: 1 });

    if (weights.length === 0) {
      // Global average
      const avg = matches.reduce((s, r) => s + r.travel_time_minutes, 0) / (matches.length || 1);
      setPrediction(Math.round(avg));
      return;
    }

    let totalWeight = 0;
    let weightedSum = 0;
    weights.forEach(({ records, weight }) => {
      const avg = records.reduce((s, r) => s + r.travel_time_minutes, 0) / records.length;
      weightedSum += avg * weight;
      totalWeight += weight;
    });

    setPrediction(Math.round(weightedSum / totalWeight));
  };

  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-kpi-purple" />
        <h3 className="font-semibold text-foreground">Travel Time Prediction</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Select value={start} onValueChange={setStart}>
          <SelectTrigger className="bg-background text-sm"><SelectValue placeholder="Start" /></SelectTrigger>
          <SelectContent>{starts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={end} onValueChange={setEnd}>
          <SelectTrigger className="bg-background text-sm"><SelectValue placeholder="End" /></SelectTrigger>
          <SelectContent>{ends.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={weather} onValueChange={setWeather}>
          <SelectTrigger className="bg-background text-sm"><SelectValue placeholder="Weather" /></SelectTrigger>
          <SelectContent>{weathers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={dayType} onValueChange={setDayType}>
          <SelectTrigger className="bg-background text-sm"><SelectValue placeholder="Day Type" /></SelectTrigger>
          <SelectContent>{dayTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={predict} disabled={!start || !end || !weather || !dayType}>
          Predict Travel Time
        </Button>
        {prediction !== null && (
          <div className="kpi-card flex items-center gap-3 px-6">
            <Clock className="w-5 h-5 text-kpi-purple" />
            <div>
              <p className="text-xs text-muted-foreground">Predicted Travel Time</p>
              <p className="text-2xl font-bold text-foreground">{prediction} min</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
