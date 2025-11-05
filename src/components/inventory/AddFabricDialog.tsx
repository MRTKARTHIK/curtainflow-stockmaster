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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddFabricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddFabricDialog = ({ open, onOpenChange, onSuccess }: AddFabricDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fabric_type: "",
    color: "",
    initial_quantity: "",
    unit: "meters",
    reorder_level: "",
    supplier_name: "",
    batch_number: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create fabric
      const { data: fabric, error: fabricError } = await supabase
        .from("fabrics")
        .insert({
          name: formData.name,
          fabric_type: formData.fabric_type,
          color: formData.color || null,
          current_quantity: parseFloat(formData.initial_quantity),
          unit: formData.unit,
          reorder_level: parseFloat(formData.reorder_level) || 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (fabricError) throw fabricError;

      // Create batch record
      const { error: batchError } = await supabase
        .from("fabric_batches")
        .insert({
          fabric_id: fabric.id,
          batch_number: formData.batch_number,
          quantity: parseFloat(formData.initial_quantity),
          supplier_name: formData.supplier_name || null,
          purchase_date: new Date().toISOString().split("T")[0],
          created_by: user.id,
        });

      if (batchError) throw batchError;

      // Create stock movement
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          fabric_id: fabric.id,
          movement_type: "IN",
          quantity: parseFloat(formData.initial_quantity),
          notes: "Initial stock",
          created_by: user.id,
        });

      if (movementError) throw movementError;

      toast.success("Fabric added successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        fabric_type: "",
        color: "",
        initial_quantity: "",
        unit: "meters",
        reorder_level: "",
        supplier_name: "",
        batch_number: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Error adding fabric");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Fabric</DialogTitle>
          <DialogDescription>
            Add a new fabric type to your inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fabric Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric_type">Fabric Type *</Label>
              <Input
                id="fabric_type"
                value={formData.fabric_type}
                onChange={(e) => setFormData({ ...formData, fabric_type: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_quantity">Initial Quantity *</Label>
              <Input
                id="initial_quantity"
                type="number"
                step="0.01"
                value={formData.initial_quantity}
                onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                step="0.01"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Fabric"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
