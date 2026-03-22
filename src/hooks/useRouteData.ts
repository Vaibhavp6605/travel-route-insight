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
    start_location: r.start_location ?? r.startArea ?? "",
    end_location: r.end_location ?? r.endArea ?? "",
    distance_km: Number(r.distance_km ?? r.distanceKm) || 0,
    travel_time_minutes: Number(r.travel_time_minutes ?? r.travelTimeMinutes) || 0,
    weather: r.weather ?? r.weatherCondition ?? "",
    day_type: r.day_type ?? r.dayOfWeek ?? "",
    timestamp: r.timestamp ?? r.timeOfDay ?? "",
  };
}

async function fetchData(): Promise<RouteRecord[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch route data");
  const data = await res.json();
  const raw = Array.isArray(data) ? data : data.data ?? data.records ?? [];
  return raw.map(mapRecord);
}

export function useRouteData() {
  return useQuery<RouteRecord[]>({
    queryKey: ["route-data"],
    queryFn: fetchData,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export async function addRecord(record: Omit<RouteRecord, "timestamp">) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...record, timestamp: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Failed to add record");
  return res.json();
}

export async function updateRecord(rowIndex: number, record: Partial<RouteRecord>) {
  const res = await fetch(`${API_URL}/${rowIndex}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to update record");
  return res.json();
}

export async function deleteRecord(rowIndex: number) {
  const res = await fetch(`${API_URL}/${rowIndex}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete record");
  return res.json();
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
