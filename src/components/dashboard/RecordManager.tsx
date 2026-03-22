import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteRecord, addRecord, getUniqueValues } from "@/hooks/useRouteData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Edit2, X, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  data: RouteRecord[];
}

export default function RecordManager({ data }: Props) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RouteRecord>>({});
  const [newRecord, setNewRecord] = useState({
    start_location: "",
    end_location: "",
    distance_km: "",
    travel_time_minutes: "",
    weather: "",
    day_type: "",
  });
  const [loading, setLoading] = useState(false);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["route-data"] });

  const handleAdd = async () => {
    if (!newRecord.start_location || !newRecord.end_location) {
      toast.error("Start and end locations are required");
      return;
    }
    setLoading(true);
    try {
      await addRecord({
        start_location: newRecord.start_location,
        end_location: newRecord.end_location,
        distance_km: Number(newRecord.distance_km) || 0,
        travel_time_minutes: Number(newRecord.travel_time_minutes) || 0,
        weather: newRecord.weather,
        day_type: newRecord.day_type,
      });
      toast.success("Record added successfully!");
      setNewRecord({ start_location: "", end_location: "", distance_km: "", travel_time_minutes: "", weather: "", day_type: "" });
      setAdding(false);
      refetch();
    } catch {
      toast.error("Failed to add record");
    }
    setLoading(false);
  };

  const handleDelete = async (index: number) => {
    setLoading(true);
    try {
      const API_URL = "https://api.sheetninja.io/3a8d841ff1944bf293a902ff958caf51/delhiTrafficSet/sheet1";
      const res = await fetch(`${API_URL}/${index + 2}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Record deleted!");
      refetch();
    } catch {
      toast.error("Failed to delete record");
    }
    setLoading(false);
  };

  const handleUpdate = async (index: number) => {
    setLoading(true);
    try {
      const API_URL = "https://api.sheetninja.io/3a8d841ff1944bf293a902ff958caf51/delhiTrafficSet/sheet1";
      const res = await fetch(`${API_URL}/${index + 2}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) throw new Error();
      toast.success("Record updated!");
      setEditIdx(null);
      setEditValues({});
      refetch();
    } catch {
      toast.error("Failed to update record");
    }
    setLoading(false);
  };

  const startEdit = (index: number, record: RouteRecord) => {
    setEditIdx(index);
    setEditValues({ ...record });
  };

  const recentData = data.slice(-10).reverse();

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Record Manager</h3>
          <span className="text-xs text-muted-foreground">(Live sync every 10s)</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAdding(!adding)}>
            <Plus className="w-3 h-3 mr-1" />
            Add Record
          </Button>
        </div>
      </div>

      {adding && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <Input
            placeholder="Start Location"
            value={newRecord.start_location}
            onChange={(e) => setNewRecord({ ...newRecord, start_location: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="End Location"
            value={newRecord.end_location}
            onChange={(e) => setNewRecord({ ...newRecord, end_location: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Distance (km)"
            type="number"
            value={newRecord.distance_km}
            onChange={(e) => setNewRecord({ ...newRecord, distance_km: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Time (min)"
            type="number"
            value={newRecord.travel_time_minutes}
            onChange={(e) => setNewRecord({ ...newRecord, travel_time_minutes: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Weather"
            value={newRecord.weather}
            onChange={(e) => setNewRecord({ ...newRecord, weather: e.target.value })}
            className="text-sm"
          />
          <div className="flex gap-1">
            <Input
              placeholder="Day Type"
              value={newRecord.day_type}
              onChange={(e) => setNewRecord({ ...newRecord, day_type: e.target.value })}
              className="text-sm flex-1"
            />
            <Button size="sm" onClick={handleAdd} disabled={loading} className="shrink-0">
              <Check className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Start</TableHead>
              <TableHead className="text-xs">End</TableHead>
              <TableHead className="text-xs">Distance</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Weather</TableHead>
              <TableHead className="text-xs">Day</TableHead>
              <TableHead className="text-xs w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentData.map((r, displayIdx) => {
              const realIdx = data.length - 1 - displayIdx;
              const isEditing = editIdx === realIdx;

              return (
                <TableRow key={displayIdx}>
                  {isEditing ? (
                    <>
                      <TableCell><Input className="text-xs h-7" value={editValues.start_location ?? ""} onChange={(e) => setEditValues({ ...editValues, start_location: e.target.value })} /></TableCell>
                      <TableCell><Input className="text-xs h-7" value={editValues.end_location ?? ""} onChange={(e) => setEditValues({ ...editValues, end_location: e.target.value })} /></TableCell>
                      <TableCell><Input className="text-xs h-7" type="number" value={editValues.distance_km ?? 0} onChange={(e) => setEditValues({ ...editValues, distance_km: Number(e.target.value) })} /></TableCell>
                      <TableCell><Input className="text-xs h-7" type="number" value={editValues.travel_time_minutes ?? 0} onChange={(e) => setEditValues({ ...editValues, travel_time_minutes: Number(e.target.value) })} /></TableCell>
                      <TableCell><Input className="text-xs h-7" value={editValues.weather ?? ""} onChange={(e) => setEditValues({ ...editValues, weather: e.target.value })} /></TableCell>
                      <TableCell><Input className="text-xs h-7" value={editValues.day_type ?? ""} onChange={(e) => setEditValues({ ...editValues, day_type: e.target.value })} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleUpdate(realIdx)}>
                            <Check className="w-3 h-3 text-accent" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditIdx(null)}>
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-xs">{r.start_location}</TableCell>
                      <TableCell className="text-xs">{r.end_location}</TableCell>
                      <TableCell className="text-xs font-mono">{r.distance_km}</TableCell>
                      <TableCell className="text-xs font-mono">{r.travel_time_minutes}</TableCell>
                      <TableCell className="text-xs">{r.weather}</TableCell>
                      <TableCell className="text-xs">{r.day_type}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(realIdx, r)}>
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(realIdx)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
