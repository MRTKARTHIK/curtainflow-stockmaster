import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JobCardTable } from "@/components/jobs/JobCardTable";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Jobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_cards")
      .select(`
        *,
        profiles(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading job cards");
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Job Cards</h1>
              <p className="text-muted-foreground">
                Manage production jobs and track progress through 5 stages
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Job Card
            </Button>
          </div>

          <JobCardTable jobs={jobs} loading={loading} onRefresh={loadJobs} />

          <CreateJobDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={loadJobs}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Jobs;
