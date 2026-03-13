import { useState, useMemo } from "react";
import { RouteRecord } from "@/hooks/useRouteData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Props {
  data: RouteRecord[];
}

type SortKey = keyof RouteRecord;

export default function DataTable({ data }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.start_location.toLowerCase().includes(q) ||
        r.end_location.toLowerCase().includes(q) ||
        r.weather.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Dataset</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search routes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-background text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {([
                ["start_location", "Start"],
                ["end_location", "End"],
                ["distance_km", "Distance (km)"],
                ["travel_time_minutes", "Time (min)"],
                ["weather", "Weather"],
                ["day_type", "Day Type"],
                ["timestamp", "Timestamp"],
              ] as [SortKey, string][]).map(([key, label]) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none text-xs"
                  onClick={() => toggleSort(key)}
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon col={key} />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">{r.start_location}</TableCell>
                <TableCell className="text-xs">{r.end_location}</TableCell>
                <TableCell className="text-xs font-mono">{r.distance_km}</TableCell>
                <TableCell className="text-xs font-mono">{r.travel_time_minutes}</TableCell>
                <TableCell className="text-xs">{r.weather}</TableCell>
                <TableCell className="text-xs">{r.day_type}</TableCell>
                <TableCell className="text-xs font-mono">{r.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>{sorted.length} records</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(0)}>
            <ChevronsLeft className="w-3 h-3" />
          </Button>
          <span>Page {page + 1} of {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronsRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
