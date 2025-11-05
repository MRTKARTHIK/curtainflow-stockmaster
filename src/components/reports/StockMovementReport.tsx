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

export const StockMovementReport = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        fabrics(name),
        profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Error loading stock movements");
    } else {
      setMovements(data || []);
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

  if (movements.length === 0) {
    return <p className="text-muted-foreground">No stock movements found</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Fabric</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                {new Date(movement.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="font-medium">{movement.fabrics?.name}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    movement.movement_type === "IN"
                      ? "default"
                      : movement.movement_type === "OUT"
                      ? "destructive"
                      : "secondary"
                  }
                  className={
                    movement.movement_type === "IN"
                      ? "bg-success"
                      : movement.movement_type === "RETURN"
                      ? "bg-warning"
                      : ""
                  }
                >
                  {movement.movement_type}
                </Badge>
              </TableCell>
              <TableCell>{movement.quantity}</TableCell>
              <TableCell>{movement.profiles?.full_name}</TableCell>
              <TableCell>{movement.notes || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
