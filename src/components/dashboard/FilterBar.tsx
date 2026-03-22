import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterBarProps {
  starts: string[];
  ends: string[];
  weathers: string[];
  dayTypes: string[];
  filters: { start?: string; end?: string; weather?: string; dayType?: string };
  onChange: (filters: { start?: string; end?: string; weather?: string; dayType?: string }) => void;
}

export default function FilterBar({ starts, ends, weathers, dayTypes, filters, onChange }: FilterBarProps) {
  const set = (key: string, val: string) => {
    onChange({ ...filters, [key]: val === "__all__" ? undefined : val });
  };

  return (
    <div className="filter-bar flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground mr-1 sm:mr-2">
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filters</span>
      </div>
      <Select value={filters.start ?? "__all__"} onValueChange={(v) => set("start", v)}>
        <SelectTrigger className="w-[130px] sm:w-[180px] bg-background text-xs sm:text-sm">
          <SelectValue placeholder="Start Area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Start Areas</SelectItem>
          {starts.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.end ?? "__all__"} onValueChange={(v) => set("end", v)}>
        <SelectTrigger className="w-[130px] sm:w-[180px] bg-background text-xs sm:text-sm">
          <SelectValue placeholder="End Area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All End Areas</SelectItem>
          {ends.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.weather ?? "__all__"} onValueChange={(v) => set("weather", v)}>
        <SelectTrigger className="w-[110px] sm:w-[150px] bg-background text-xs sm:text-sm">
          <SelectValue placeholder="Weather" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Weather</SelectItem>
          {weathers.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.dayType ?? "__all__"} onValueChange={(v) => set("dayType", v)}>
        <SelectTrigger className="w-[110px] sm:w-[150px] bg-background text-xs sm:text-sm">
          <SelectValue placeholder="Day Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Days</SelectItem>
          {dayTypes.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
