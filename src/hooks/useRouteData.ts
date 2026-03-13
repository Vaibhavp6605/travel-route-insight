import { useQuery } from "@tanstack/react-query";

export interface RouteRecord {
  start_location: string;
  end_location: string;
  distance_km: number;
  travel_time_minutes: number;
  weather: string;
  day_type: string;
  timestamp: string;
}

const API_URL = "https://api.sheetninja.io/3a8d841ff1944bf293a902ff958caf51/delhiTrafficSet/sheet1";

export function useRouteData() {
  return useQuery<RouteRecord[]>({
    queryKey: ["route-data"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch route data");
      const data = await res.json();
      return (Array.isArray(data) ? data : data.data ?? data.records ?? []).map((r: any) => ({
        ...r,
        distance_km: Number(r.distance_km) || 0,
        travel_time_minutes: Number(r.travel_time_minutes) || 0,
      }));
    },
    staleTime: 60_000,
  });
}

export function filterData(
  data: RouteRecord[],
  filters: { start?: string; end?: string; weather?: string; dayType?: string }
) {
  return data.filter((r) => {
    if (filters.start && r.start_location !== filters.start) return false;
    if (filters.end && r.end_location !== filters.end) return false;
    if (filters.weather && r.weather !== filters.weather) return false;
    if (filters.dayType && r.day_type !== filters.dayType) return false;
    return true;
  });
}

export function getUniqueValues(data: RouteRecord[], key: keyof RouteRecord) {
  return [...new Set(data.map((r) => String(r[key])))].sort();
}
