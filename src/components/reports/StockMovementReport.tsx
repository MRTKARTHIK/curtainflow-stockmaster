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
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export const StockMovementReport = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("stock_movements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting stock movement");
    } else {
      toast.success("Stock movement deleted successfully");
      loadMovements();
    }
    setDeleteId(null);
  };

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
            <TableHead className="text-right">Actions</TableHead>
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
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(movement.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Movement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock movement log? This action cannot be undone.
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
    </div>
  );
};
