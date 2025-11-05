import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IssueReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric: any;
  actionType: "issue" | "return";
  onSuccess: () => void;
}

export const IssueReturnDialog = ({
  open,
  onOpenChange,
  fabric,
  actionType,
  onSuccess,
}: IssueReturnDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const movementType = actionType === "issue" ? "OUT" : "RETURN";
      const qty = parseFloat(quantity);

      if (actionType === "issue" && qty > fabric.current_quantity) {
        throw new Error("Insufficient stock");
      }

      const { error } = await supabase
        .from("stock_movements")
        .insert({
          fabric_id: fabric.id,
          movement_type: movementType,
          quantity: qty,
          notes: notes || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success(`Fabric ${actionType === "issue" ? "issued" : "returned"} successfully`);
      onSuccess();
      onOpenChange(false);
      setQuantity("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || `Error ${actionType}ing fabric`);
    } finally {
      setLoading(false);
    }
  };

  if (!fabric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === "issue" ? "Issue Fabric" : "Return Fabric"}
          </DialogTitle>
          <DialogDescription>
            {actionType === "issue"
              ? "Issue fabric to production"
              : "Return fabric to inventory"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fabric</Label>
            <Input value={fabric.name} disabled />
          </div>

          <div className="space-y-2">
            <Label>Available Quantity</Label>
            <Input value={`${fabric.current_quantity} ${fabric.unit}`} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : actionType === "issue" ? "Issue" : "Return"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
