import { useState, useMemo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RouteRecord, getUniqueValues } from "@/hooks/useRouteData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Navigation, X } from "lucide-react";

const DELHI_COORDS: Record<string, [number, number]> = {
  "Connaught Place": [28.6315, 77.2195],
  "Karol Bagh": [28.6519, 77.1903],
  "Chandni Chowk": [28.6505, 77.2302],
  "Dwarka": [28.5921, 77.0460],
  "Saket": [28.5244, 77.2066],
  "Lajpat Nagar": [28.5700, 77.2373],
  "Rohini": [28.7495, 77.0565],
  "Janakpuri": [28.6219, 77.0814],
  "Nehru Place": [28.5491, 77.2533],
  "Pitampura": [28.6986, 77.1316],
  "Vasant Kunj": [28.5195, 77.1581],
  "Greater Kailash": [28.5485, 77.2432],
  "Hauz Khas": [28.5494, 77.2001],
  "Defence Colony": [28.5743, 77.2330],
  "South Extension": [28.5727, 77.2219],
  "Rajouri Garden": [28.6488, 77.1183],
  "Preet Vihar": [28.6420, 77.2946],
  "Model Town": [28.7160, 77.1912],
  "Mayur Vihar": [28.6090, 77.2930],
  "Green Park": [28.5594, 77.2071],
};

const DELHI_CENTER: [number, number] = [28.6139, 77.2090];

interface RouteMapProps {
  data: RouteRecord[];
}

export default function RouteMap({ data }: RouteMapProps) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Layer[]>([]);

  const starts = useMemo(() => getUniqueValues(data, "start_location"), [data]);
  const ends = useMemo(() => getUniqueValues(data, "end_location"), [data]);

  const startCoord = start ? DELHI_COORDS[start] ?? null : null;
  const endCoord = end ? DELHI_COORDS[end] ?? null : null;

  const routeStats = useMemo(() => {
    if (!start || !end) return null;
    const matches = data.filter(r => r.start_location === start && r.end_location === end);
    if (matches.length === 0) return null;
    const avgDist = matches.reduce((s, r) => s + r.distance_km, 0) / matches.length;
    const avgTime = matches.reduce((s, r) => s + r.travel_time_minutes, 0) / matches.length;
    return { distance: Math.round(avgDist * 10) / 10, time: Math.round(avgTime), trips: matches.length };
  }, [data, start, end]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(DELHI_CENTER, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [open]);

  // Update markers/route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous
    markersRef.current.forEach(l => map.removeLayer(l));
    markersRef.current = [];

    const greenIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });
    const redIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    if (startCoord) {
      const m = L.marker(startCoord, { icon: greenIcon }).addTo(map).bindPopup(start);
      markersRef.current.push(m);
    }
    if (endCoord) {
      const m = L.marker(endCoord, { icon: redIcon }).addTo(map).bindPopup(end);
      markersRef.current.push(m);
    }
    if (startCoord && endCoord) {
      const drawFallback = () => {
        if (!mapRef.current) return;
        const line = L.polyline([startCoord, endCoord], { color: "#3b82f6", weight: 4, dashArray: "10, 6" }).addTo(map);
        markersRef.current.push(line);
        map.fitBounds(L.latLngBounds([startCoord, endCoord]), { padding: [50, 50] });
      };

      // Fetch real road route from OSRM
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=full&geometries=geojson&alternatives=true`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      fetch(url, { signal: controller.signal })
        .then(res => {
          clearTimeout(timeout);
          if (!res.ok) throw new Error(`OSRM responded ${res.status}`);
          return res.json();
        })
        .then(routeData => {
          if (!mapRef.current) return;
          if (routeData.routes && routeData.routes.length > 0) {
            // Draw alternate routes first (behind primary)
            for (let i = routeData.routes.length - 1; i >= 1; i--) {
              const altCoords: [number, number][] = routeData.routes[i].geometry.coordinates.map(
                (c: [number, number]) => [c[1], c[0]] as [number, number]
              );
              const altDuration = Math.round(routeData.routes[i].duration / 60);
              const altDist = Math.round(routeData.routes[i].distance / 100) / 10;
              const altLine = L.polyline(altCoords, { color: "#94a3b8", weight: 5, opacity: 0.6, dashArray: "8, 8" }).addTo(map);
              altLine.bindPopup(`<b>Alternate Route</b><br/>${altDist} km · ~${altDuration} min`);
              markersRef.current.push(altLine);
            }
            // Draw primary route on top
            const coords: [number, number][] = routeData.routes[0].geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            );
            const primaryDuration = Math.round(routeData.routes[0].duration / 60);
            const primaryDist = Math.round(routeData.routes[0].distance / 100) / 10;
            const line = L.polyline(coords, { color: "#3b82f6", weight: 6, opacity: 0.9 }).addTo(map);
            line.bindPopup(`<b>Primary Route</b><br/>${primaryDist} km · ~${primaryDuration} min`);
            markersRef.current.push(line);
            map.fitBounds(line.getBounds(), { padding: [50, 50] });
          } else {
            drawFallback();
          }
        })
        .catch((err) => {
          clearTimeout(timeout);
          console.warn("[RouteMap] OSRM fetch failed, using fallback:", err.message);
          drawFallback();
        });
    } else if (startCoord) {
      map.setView(startCoord, 13);
    } else if (endCoord) {
      map.setView(endCoord, 13);
    }
  }, [startCoord, endCoord, start, end]);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg border-primary/30 bg-card hover:bg-primary hover:text-primary-foreground transition-all"
        size="icon"
      >
        <Map className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground text-lg">Delhi Route Map</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { setOpen(false); }}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border bg-muted/30">
          <div className="flex-1">
            <Select value={start} onValueChange={setStart}>
              <SelectTrigger className="bg-background">
                <MapPin className="w-4 h-4 text-accent mr-2 shrink-0" />
                <SelectValue placeholder="Start Location" />
              </SelectTrigger>
              <SelectContent>
                {starts.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={end} onValueChange={setEnd}>
              <SelectTrigger className="bg-background">
                <Navigation className="w-4 h-4 text-destructive mr-2 shrink-0" />
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                {ends.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {routeStats && (
          <div className="flex gap-4 px-4 py-2 bg-primary/5 border-b border-border text-sm">
            <span className="text-foreground font-medium">{routeStats.distance} km</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground font-medium">~{routeStats.time} min</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{routeStats.trips} trips recorded</span>
          </div>
        )}

        <div className="flex-1 min-h-[400px]" ref={mapContainerRef} />
      </div>
    </div>
  );
}
