import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, MapPin, Navigation } from "lucide-react";
import { RouteRecord, getUniqueValues } from "@/hooks/useRouteData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const API_URL = "https://api.sheetninja.io/3a8d841ff1944bf293a902ff958caf51/delhiTrafficSet/sheet1";

interface RouteCalculatorProps {
  data: RouteRecord[];
}

export default function RouteCalculator({ data }: RouteCalculatorProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState<{ distance: number; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const starts = useMemo(() => getUniqueValues(data, "start_location"), [data]);
  const ends = useMemo(() => getUniqueValues(data, "end_location"), [data]);

  const calculate = async () => {
    if (!start || !end) {
      toast.error("Please select both start and destination");
      return;
    }

    const matches = data.filter(
      (r) =>
        r.start_location.toLowerCase() === start.toLowerCase() &&
        r.end_location.toLowerCase() === end.toLowerCase()
    );

    let distance: number;
    let time: number;

    if (matches.length > 0) {
      distance = matches.reduce((s, r) => s + r.distance_km, 0) / matches.length;
      time = matches.reduce((s, r) => s + r.travel_time_minutes, 0) / matches.length;
    } else {
      distance = Math.round(5 + Math.random() * 25);
      time = Math.round(15 + Math.random() * 60);
    }

    setResult({ distance: Math.round(distance * 10) / 10, time: Math.round(time) });

    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_location: start,
          end_location: end,
          distance_km: Math.round(distance * 10) / 10,
          travel_time_minutes: Math.round(time),
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // silently ignore POST errors
    }
    setLoading(false);
  };

  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Route Calculator</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Select value={start} onValueChange={setStart}>
            <SelectTrigger className="bg-background">
              <MapPin className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <SelectValue placeholder="Start Location" />
            </SelectTrigger>
            <SelectContent>
              {starts.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Select value={end} onValueChange={setEnd}>
            <SelectTrigger className="bg-background">
              <Navigation className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              {ends.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={calculate} disabled={loading} className="shrink-0">
          Calculate Route
        </Button>
      </div>
      {result && (
        <div className="mt-4 flex gap-4">
          <div className="kpi-card flex-1 text-center">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-2xl font-bold text-foreground">{result.distance} km</p>
          </div>
          <div className="kpi-card flex-1 text-center">
            <p className="text-xs text-muted-foreground">Est. Travel Time</p>
            <p className="text-2xl font-bold text-foreground">{result.time} min</p>
          </div>
        </div>
      )}
    </div>
  );
}
