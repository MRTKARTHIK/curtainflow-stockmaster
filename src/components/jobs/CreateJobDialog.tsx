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

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateJobDialog = ({ open, onOpenChange, onSuccess }: CreateJobDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_number: "",
    customer_name: "",
    customer_contact: "",
    description: "",
    curtain_type: "",
    quantity: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: job, error: jobError } = await supabase
        .from("job_cards")
        .insert({
          job_number: formData.job_number,
          customer_name: formData.customer_name,
          customer_contact: formData.customer_contact || null,
          description: formData.description || null,
          curtain_type: formData.curtain_type || null,
          quantity: parseInt(formData.quantity),
          created_by: user.id,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create first production stage
      const { error: stageError } = await supabase
        .from("production_stages")
        .insert({
          job_card_id: job.id,
          stage: "cutting",
          stage_number: 1,
          responsible_user: user.id,
        });

      if (stageError) throw stageError;

      toast.success("Job card created successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        job_number: "",
        customer_name: "",
        customer_contact: "",
        description: "",
        curtain_type: "",
        quantity: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Error creating job card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Job Card</DialogTitle>
          <DialogDescription>
            Create a new production job card
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_number">Job Number *</Label>
              <Input
                id="job_number"
                value={formData.job_number}
                onChange={(e) => setFormData({ ...formData, job_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_contact">Customer Contact</Label>
              <Input
                id="customer_contact"
                value={formData.customer_contact}
                onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="curtain_type">Curtain Type</Label>
              <Input
                id="curtain_type"
                value={formData.curtain_type}
                onChange={(e) => setFormData({ ...formData, curtain_type: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Job Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
