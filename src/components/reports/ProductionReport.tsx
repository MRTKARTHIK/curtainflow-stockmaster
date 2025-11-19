import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Calendar as CalendarIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const stageLabels: Record<string, string> = {
  cutting: "Cutting",
  stitching: "Stitching",
  finishing: "Finishing",
  quality_check: "Quality Check",
  packing_dispatch: "Packing/Dispatch",
};

export const ProductionReport = () => {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("production_stages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting production stage");
    } else {
      toast.success("Production stage deleted successfully");
      loadStages();
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("production_stages")
      .delete()
      .in("id", ids);

    if (error) {
      toast.error("Error deleting production stages");
    } else {
      toast.success(`Successfully deleted ${ids.length} production stages`);
      setSelectedIds(new Set());
      loadStages();
    }
    setShowBulkDelete(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const completedIds = stages
        .filter((stage) => stage.completed_at)
        .map((stage) => stage.id);
      setSelectedIds(new Set(completedIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const exportToCSV = () => {
    const headers = [
      "Date & Time",
      "Job Number",
      "Customer",
      "Stage",
      "Responsible User",
      "Status",
      "Notes",
    ];

    const rows = stages.map((stage) => [
      new Date(stage.started_at).toLocaleString(),
      stage.job_cards?.job_number || "",
      stage.job_cards?.customer_name || "",
      `${stage.stage_number}. ${stageLabels[stage.stage]}`,
      stage.profiles?.full_name || "",
      stage.completed_at ? "Completed" : "In Progress",
      stage.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `production_logs_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully");
  };

  useEffect(() => {
    loadStages();
  }, [startDate, endDate]);

  const loadStages = async () => {
    setLoading(true);
    let query = supabase
      .from("production_stages")
      .select(`
        *,
        job_cards(job_number, customer_name),
        profiles(full_name)
      `)
      .order("created_at", { ascending: false });

    if (startDate) {
      query = query.gte("started_at", startDate.toISOString());
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("started_at", endOfDay.toISOString());
    }

    const { data, error } = await query.limit(50);

    if (error) {
      toast.error("Error loading production stages");
    } else {
      setStages(data || []);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const completedStagesCount = stages.filter((s) => s.completed_at).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {stages.length === 0 ? (
        <p className="text-muted-foreground">No production stages found</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === completedStagesCount && completedStagesCount > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Job Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Responsible User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage) => (
                <TableRow key={stage.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(stage.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(stage.id, checked as boolean)
                      }
                      disabled={!stage.completed_at}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(stage.started_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {stage.job_cards?.job_number}
                  </TableCell>
                  <TableCell>{stage.job_cards?.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {stage.stage_number}. {stageLabels[stage.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell>{stage.profiles?.full_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={stage.completed_at ? "default" : "secondary"}
                      className={stage.completed_at ? "bg-success" : ""}
                    >
                      {stage.completed_at ? "Completed" : "In Progress"}
                    </Badge>
                  </TableCell>
                  <TableCell>{stage.notes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(stage.id)}
                      disabled={!stage.completed_at}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production stage log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Production Stages</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} production stage logs? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
