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

function mapRecord(r: any): RouteRecord {
  return {
    start_location: r.startArea ?? r.start_location ?? "",
    end_location: r.endArea ?? r.end_location ?? "",
    distance_km: Number(r.distanceKm ?? r.distance_km) || 0,
    travel_time_minutes: Number(r.travelTimeMinutes ?? r.travel_time_minutes) || 0,
    weather: r.weatherCondition ?? r.weather ?? "",
    day_type: r.dayOfWeek ?? r.day_type ?? "",
    timestamp: r.timeOfDay ?? r.timestamp ?? "",
  };
}

async function fetchData(): Promise<RouteRecord[]> {
  const limit = 100;
  const maxRows = 1000;

  const firstRes = await fetch(`${API_URL}?limit=${limit}&offset=0`);
  if (!firstRes.ok) throw new Error("Failed to fetch route data");

  const firstJson = await firstRes.json();
  const firstRaw: any[] = firstJson.data ?? firstJson.records ?? (Array.isArray(firstJson) ? firstJson : []);
  const firstPage = firstRaw.map(mapRecord);

  const firstMeta = firstJson.meta;
  if (!firstMeta?.has_more || firstPage.length >= maxRows) {
    return firstPage.slice(0, maxRows);
  }

  const remainingOffsets: number[] = [];
  for (let offset = limit; offset < maxRows; offset += limit) {
    remainingOffsets.push(offset);
  }

  const remainingPages = await Promise.allSettled(
    remainingOffsets.map(async (offset) => {
      const res = await fetch(`${API_URL}?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`Failed to fetch route data at offset ${offset}`);
      const json = await res.json();
      const raw: any[] = json.data ?? json.records ?? (Array.isArray(json) ? json : []);
      return raw.map(mapRecord);
    })
  );

  const successfulRows = remainingPages.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  return [...firstPage, ...successfulRows].slice(0, maxRows);
}

export function useRouteData() {
  return useQuery<RouteRecord[]>({
    queryKey: ["route-data"],
    queryFn: fetchData,
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
