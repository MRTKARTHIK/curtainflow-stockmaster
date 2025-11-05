import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  onSuccess: () => void;
}

export const EditJobDialog = ({
  open,
  onOpenChange,
  job,
  onSuccess,
}: EditJobDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: job.customer_name,
    customer_contact: job.customer_contact || "",
    curtain_type: job.curtain_type || "",
    quantity: job.quantity,
    description: job.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("job_cards")
      .update(formData)
      .eq("id", job.id);

    if (error) {
      toast.error("Error updating job card");
    } else {
      toast.success("Job card updated successfully");
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_contact">Customer Contact</Label>
            <Input
              id="customer_contact"
              value={formData.customer_contact}
              onChange={(e) =>
                setFormData({ ...formData, customer_contact: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="curtain_type">Curtain Type</Label>
            <Input
              id="curtain_type"
              value={formData.curtain_type}
              onChange={(e) =>
                setFormData({ ...formData, curtain_type: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
