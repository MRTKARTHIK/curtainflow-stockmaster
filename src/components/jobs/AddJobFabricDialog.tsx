import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddJobFabricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onSuccess: () => void;
}

export const AddJobFabricDialog = ({
  open,
  onOpenChange,
  jobId,
  onSuccess,
}: AddJobFabricDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [selectedFabric, setSelectedFabric] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState("");

  useEffect(() => {
    if (open) {
      loadFabrics();
    }
  }, [open]);

  const loadFabrics = async () => {
    const { data } = await supabase
      .from("fabrics")
      .select("*")
      .order("name");
    
    if (data) setFabrics(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("job_card_fabrics")
      .insert({
        job_card_id: jobId,
        fabric_id: selectedFabric,
        required_quantity: parseFloat(requiredQuantity),
      });

    if (error) {
      toast.error("Error adding fabric requirement");
    } else {
      toast.success("Fabric requirement added");
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Fabric Requirement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fabric">Fabric *</Label>
            <Select value={selectedFabric} onValueChange={setSelectedFabric} required>
              <SelectTrigger>
                <SelectValue placeholder="Select fabric" />
              </SelectTrigger>
              <SelectContent>
                {fabrics.map((fabric) => (
                  <SelectItem key={fabric.id} value={fabric.id}>
                    {fabric.name} ({fabric.current_quantity} {fabric.unit} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Required Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={requiredQuantity}
              onChange={(e) => setRequiredQuantity(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedFabric}>
              {loading ? "Adding..." : "Add Fabric"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
