import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditJobDialog } from "@/components/jobs/EditJobDialog";
import { StageProgress } from "@/components/jobs/StageProgress";
import { JobFabrics } from "@/components/jobs/JobFabrics";
import { format } from "date-fns";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobDetails();
    }
  }, [id]);

  const loadJobDetails = async () => {
    setLoading(true);
    
    // Load job card details
    const { data: jobData, error: jobError } = await supabase
      .from("job_cards")
      .select(`
        *,
        profiles(full_name)
      `)
      .eq("id", id)
      .single();

    if (jobError) {
      toast.error("Error loading job details");
      navigate("/jobs");
      return;
    }

    // Load production stages
    const { data: stagesData, error: stagesError } = await supabase
      .from("production_stages")
      .select(`
        *,
        profiles(full_name)
      `)
      .eq("job_card_id", id)
      .order("stage_number");

    // Load fabric requirements
    const { data: fabricsData, error: fabricsError } = await supabase
      .from("job_card_fabrics")
      .select(`
        *,
        fabrics(name, unit, current_quantity)
      `)
      .eq("job_card_id", id);

    if (!stagesError) setStages(stagesData || []);
    if (!fabricsError) setFabrics(fabricsData || []);
    setJob(jobData);
    setLoading(false);
  };

  const handleAdvanceStage = async () => {
    const currentStageData = stages.find(s => s.stage === job.current_stage);
    
    if (!currentStageData) {
      toast.error("Current stage not found");
      return;
    }

    // Complete current stage
    const { error: completeError } = await supabase
      .from("production_stages")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", currentStageData.id);

    if (completeError) {
      toast.error("Error completing stage");
      return;
    }

    // Check if this is the last stage
    const stageOrder = ["cutting", "stitching", "finishing", "quality_check", "packing_dispatch"];
    const currentIndex = stageOrder.indexOf(job.current_stage);
    
    if (currentIndex === stageOrder.length - 1) {
      // Mark job as completed
      const { error: jobError } = await supabase
        .from("job_cards")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (jobError) {
        toast.error("Error completing job");
        return;
      }
      
      toast.success("Job completed successfully!");
    } else {
      // Move to next stage
      const nextStage = stageOrder[currentIndex + 1] as "cutting" | "stitching" | "finishing" | "quality_check" | "packing_dispatch";
      const { error: jobError } = await supabase
        .from("job_cards")
        .update({ current_stage: nextStage })
        .eq("id", id);

      if (jobError) {
        toast.error("Error advancing to next stage");
        return;
      }

      toast.success("Advanced to next stage");
    }

    loadJobDetails();
  };

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  if (!job) {
    return null;
  }

  const stageLabels: Record<string, string> = {
    cutting: "Cutting",
    stitching: "Stitching",
    finishing: "Finishing",
    quality_check: "Quality Check",
    packing_dispatch: "Packing/Dispatch",
  };

  const currentStageCompleted = stages.find(s => s.stage === job.current_stage)?.completed_at;

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/jobs")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Job Card: {job.job_number}</h1>
                <p className="text-muted-foreground">{job.customer_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Button>
              {job.status === "in_progress" && !currentStageCompleted && (
                <Button onClick={handleAdvanceStage}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete {stageLabels[job.current_stage]}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={job.status === "completed" ? "default" : "secondary"}
                    className={job.status === "completed" ? "bg-success" : ""}
                  >
                    {job.status === "in_progress" ? "In Progress" : "Completed"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Contact</p>
                  <p className="font-medium">{job.customer_contact || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Curtain Type</p>
                  <p className="font-medium">{job.curtain_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{job.quantity} pieces</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {format(new Date(job.started_at), "PPP")}
                  </p>
                </div>
                {job.completed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {format(new Date(job.completed_at), "PPP")}
                    </p>
                  </div>
                )}
                {job.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{job.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{job.profiles?.full_name}</p>
                </div>
              </CardContent>
            </Card>

            <JobFabrics jobId={id!} fabrics={fabrics} onRefresh={loadJobDetails} />
          </div>

          <StageProgress stages={stages} currentStage={job.current_stage} />

          <EditJobDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            job={job}
            onSuccess={loadJobDetails}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default JobDetail;
