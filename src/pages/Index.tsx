import { useState, useMemo } from "react";
import { useRouteData, filterData, getUniqueValues } from "@/hooks/useRouteData";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import KpiCards from "@/components/dashboard/KpiCards";
import RouteCalculator from "@/components/dashboard/RouteCalculator";
import InsightCharts from "@/components/dashboard/InsightCharts";
import DataTable from "@/components/dashboard/DataTable";
import PredictionModule from "@/components/dashboard/PredictionModule";
import AiInsights from "@/components/dashboard/AiInsights";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { data: rawData, isLoading, error } = useRouteData();
  const [filters, setFilters] = useState<{ start?: string; end?: string; weather?: string; dayType?: string }>({});

  const allData = rawData ?? [];
  const starts = useMemo(() => getUniqueValues(allData, "start_location"), [allData]);
  const ends = useMemo(() => getUniqueValues(allData, "end_location"), [allData]);
  const weathers = useMemo(() => getUniqueValues(allData, "weather"), [allData]);
  const dayTypes = useMemo(() => getUniqueValues(allData, "day_type"), [allData]);
  const filtered = useMemo(() => filterData(allData, filters), [allData, filters]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading route data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-destructive">
          <p className="font-semibold">Failed to load data</p>
          <p className="text-sm text-muted-foreground mt-1">Please check the API connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 pb-6 sm:pb-10">
        <DashboardHeader />

        <div className="space-y-5">
          <FilterBar
            starts={starts}
            ends={ends}
            weathers={weathers}
            dayTypes={dayTypes}
            filters={filters}
            onChange={setFilters}
          />

          <KpiCards data={filtered} />

          <RouteCalculator data={allData} />

          <InsightCharts data={filtered} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PredictionModule data={allData} starts={starts} ends={ends} weathers={weathers} dayTypes={dayTypes} />
            <AiInsights data={filtered} />
          </div>

          <DataTable data={filtered} />
        </div>
      </div>
    </div>
  );
};

export default Index;
