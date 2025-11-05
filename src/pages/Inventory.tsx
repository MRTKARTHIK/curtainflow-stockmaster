import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FabricTable } from "@/components/inventory/FabricTable";
import { AddFabricDialog } from "@/components/inventory/AddFabricDialog";
import { IssueReturnDialog } from "@/components/inventory/IssueReturnDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Inventory = () => {
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  const [actionType, setActionType] = useState<"issue" | "return">("issue");

  useEffect(() => {
    loadFabrics();
  }, []);

  const loadFabrics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fabrics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading fabrics");
    } else {
      setFabrics(data || []);
    }
    setLoading(false);
  };

  const handleIssueReturn = (fabric: any, type: "issue" | "return") => {
    setSelectedFabric(fabric);
    setActionType(type);
    setIssueDialogOpen(true);
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Fabric Inventory</h1>
              <p className="text-muted-foreground">
                Manage fabric stock, batches, and movements
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fabric
            </Button>
          </div>

          <FabricTable
            fabrics={fabrics}
            loading={loading}
            onIssueReturn={handleIssueReturn}
            onRefresh={loadFabrics}
          />

          <AddFabricDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onSuccess={loadFabrics}
          />

          <IssueReturnDialog
            open={issueDialogOpen}
            onOpenChange={setIssueDialogOpen}
            fabric={selectedFabric}
            actionType={actionType}
            onSuccess={loadFabrics}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Inventory;
