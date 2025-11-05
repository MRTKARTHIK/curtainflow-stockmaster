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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("production_stages")
      .select(`
        *,
        job_cards(job_number, customer_name),
        profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Error loading production stages");
    } else {
      setStages(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (stages.length === 0) {
    return <p className="text-muted-foreground">No production stages found</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Job Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Responsible User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage) => (
            <TableRow key={stage.id}>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
