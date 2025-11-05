import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddJobFabricDialog } from "./AddJobFabricDialog";

interface JobFabricsProps {
  jobId: string;
  fabrics: any[];
  onRefresh: () => void;
}

export const JobFabrics = ({ jobId, fabrics, onRefresh }: JobFabricsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fabric Requirements</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Fabric
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fabrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fabrics assigned yet
            </p>
          ) : (
            <div className="space-y-4">
              {fabrics.map((fabric) => (
                <div
                  key={fabric.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{fabric.fabrics?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Required: {fabric.required_quantity} {fabric.fabrics?.unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Issued: {fabric.issued_quantity} {fabric.fabrics?.unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available Stock: {fabric.fabrics?.current_quantity} {fabric.fabrics?.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    {fabric.issued_quantity >= fabric.required_quantity ? (
                      <span className="text-sm text-success">✓ Complete</span>
                    ) : (
                      <span className="text-sm text-warning">
                        Pending: {fabric.required_quantity - fabric.issued_quantity} {fabric.fabrics?.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddJobFabricDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobId={jobId}
        onSuccess={() => {
          onRefresh();
          setDialogOpen(false);
        }}
      />
    </>
  );
};
