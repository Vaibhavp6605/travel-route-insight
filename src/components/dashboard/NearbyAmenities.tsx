import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Fuel, ShoppingCart, Scissors, Landmark, UtensilsCrossed, Building2, Loader2, Star } from "lucide-react";
import { getUniqueValues, RouteRecord } from "@/hooks/useRouteData";

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

const AMENITY_CATEGORIES = [
  { value: "restaurant", label: "Restaurants", icon: UtensilsCrossed, tag: '["amenity"="restaurant"]' },
  { value: "fuel", label: "Petrol Pumps", icon: Fuel, tag: '["amenity"="fuel"]' },
  { value: "supermarket", label: "Supermarkets", icon: ShoppingCart, tag: '["shop"="supermarket"]' },
  { value: "hairdresser", label: "Parlors / Salons", icon: Scissors, tag: '["shop"="hairdresser"]' },
  { value: "atm", label: "ATMs", icon: Landmark, tag: '["amenity"="atm"]' },
  { value: "hospital", label: "Hospitals", icon: Building2, tag: '["amenity"="hospital"]' },
];

const CUISINE_FILTERS = [
  { value: "all", label: "All Cuisines" },
  { value: "indian", label: "Indian" },
  { value: "chinese", label: "Chinese" },
  { value: "italian", label: "Italian" },
  { value: "fast_food", label: "Fast Food" },
  { value: "south_indian", label: "South Indian" },
  { value: "mughlai", label: "Mughlai" },
];

type Place = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  cuisine?: string;
  phone?: string;
  opening_hours?: string;
};

interface NearbyAmenitiesProps {
  data: RouteRecord[];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyAmenities({ data }: NearbyAmenitiesProps) {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [cuisine, setCuisine] = useState("all");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const locations = useMemo(() => {
    const fromData = [...getUniqueValues(data, "start_location"), ...getUniqueValues(data, "end_location")];
    const unique = Array.from(new Set(fromData)).filter((l) => DELHI_COORDS[l]);
    return unique.sort();
  }, [data]);

  const selectedCategory = AMENITY_CATEGORIES.find((c) => c.value === category);

  const search = async () => {
    if (!location) return;
    const coords = DELHI_COORDS[location];
    if (!coords) return;

    setLoading(true);
    setSearched(true);
    setPlaces([]);

    const [lat, lon] = coords;
    const radius = 2000;
    const tag = selectedCategory?.tag || '["amenity"="restaurant"]';

    const query = `[out:json][timeout:10];node${tag}(around:${radius},${lat},${lon});out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      let results: Place[] = (json.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any) => ({
          id: el.id,
          name: el.tags.name,
          lat: el.lat,
          lon: el.lon,
          distance: Math.round(haversineDistance(lat, lon, el.lat, el.lon) * 1000),
          cuisine: el.tags.cuisine || "",
          phone: el.tags.phone || el.tags["contact:phone"] || "",
          opening_hours: el.tags.opening_hours || "",
        }));

      // Filter by cuisine if restaurant category
      if (category === "restaurant" && cuisine !== "all") {
        results = results.filter((p) =>
          p.cuisine?.toLowerCase().includes(cuisine.replace("_", " "))
        );
      }

      results.sort((a, b) => a.distance - b.distance);
      setPlaces(results.slice(0, 20));
    } catch {
      setPlaces([]);
    }
    setLoading(false);
  };

  const CategoryIcon = selectedCategory?.icon || MapPin;

  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Nearby Amenities</h3>
      </div>

      <div className="flex flex-col gap-3">
        {/* Location + Category row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="bg-background">
                <MapPin className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={category} onValueChange={(v) => { setCategory(v); setCuisine("all"); }}>
              <SelectTrigger className="bg-background">
                <CategoryIcon className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMENITY_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2">
                      <c.icon className="w-3.5 h-3.5" />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cuisine filter (only for restaurants) */}
        {category === "restaurant" && (
          <Select value={cuisine} onValueChange={setCuisine}>
            <SelectTrigger className="bg-background">
              <UtensilsCrossed className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUISINE_FILTERS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button onClick={search} disabled={loading || !location} className="w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CategoryIcon className="w-4 h-4 mr-2" />}
          Find Nearby {selectedCategory?.label}
        </Button>
      </div>

      {/* Results */}
      {searched && !loading && (
        <div className="mt-4">
          {places.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No {selectedCategory?.label?.toLowerCase()} found within 2 km of {location}.
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground mb-2">
                Found {places.length} {selectedCategory?.label?.toLowerCase()} near {location}
              </p>
              {places.map((place) => (
                <div
                  key={place.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-primary/10">
                    <CategoryIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs text-muted-foreground">{place.distance}m away</span>
                      {place.cuisine && (
                        <span className="text-xs bg-accent/50 text-accent-foreground px-1.5 py-0.5 rounded">
                          {place.cuisine}
                        </span>
                      )}
                      {place.phone && (
                        <span className="text-xs text-muted-foreground">{place.phone}</span>
                      )}
                      {place.opening_hours && (
                        <span className="text-xs text-muted-foreground">🕐 {place.opening_hours}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
