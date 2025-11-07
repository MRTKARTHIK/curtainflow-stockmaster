import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
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

interface FabricTableProps {
  fabrics: any[];
  loading: boolean;
  onIssueReturn: (fabric: any, type: "issue" | "return") => void;
  onRefresh: () => void;
}

export const FabricTable = ({ fabrics, loading, onIssueReturn, onRefresh }: FabricTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("fabrics")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting fabric");
    } else {
      toast.success("Fabric deleted successfully");
      onRefresh();
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (fabrics.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No fabrics found. Add your first fabric to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fabrics.map((fabric) => {
            const isLowStock = fabric.current_quantity <= fabric.reorder_level;
            return (
              <TableRow key={fabric.id}>
                <TableCell className="font-medium">{fabric.name}</TableCell>
                <TableCell>{fabric.fabric_type}</TableCell>
                <TableCell>{fabric.color || "-"}</TableCell>
                <TableCell className="font-semibold">{fabric.current_quantity}</TableCell>
                <TableCell>{fabric.unit}</TableCell>
                <TableCell>
                  {isLowStock ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-success">
                      In Stock
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIssueReturn(fabric, "issue")}
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-1" />
                      Issue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIssueReturn(fabric, "return")}
                    >
                      <ArrowUpFromLine className="h-4 w-4 mr-1" />
                      Return
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(fabric.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fabric</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fabric? This will also delete all related stock movements and batches. This action cannot be undone.
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
