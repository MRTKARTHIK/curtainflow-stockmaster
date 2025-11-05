import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { format } from "date-fns";

interface StageProgressProps {
  stages: any[];
  currentStage: string;
}

const stageOrder = ["cutting", "stitching", "finishing", "quality_check", "packing_dispatch"];

const stageLabels: Record<string, string> = {
  cutting: "Cutting",
  stitching: "Stitching",
  finishing: "Finishing",
  quality_check: "Quality Check",
  packing_dispatch: "Packing/Dispatch",
};

export const StageProgress = ({ stages, currentStage }: StageProgressProps) => {
  const getStageStatus = (stageName: string) => {
    const stageData = stages.find(s => s.stage === stageName);
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageName);

    if (stageData?.completed_at) return "completed";
    if (stageIndex === currentIndex) return "current";
    if (stageIndex < currentIndex) return "completed";
    return "pending";
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case "current":
        return <Clock className="h-6 w-6 text-primary" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stageOrder.map((stageName, index) => {
            const status = getStageStatus(stageName);
            const stageData = stages.find(s => s.stage === stageName);
            const isLast = index === stageOrder.length - 1;

            return (
              <div key={stageName} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    {getStageIcon(status)}
                    {!isLast && (
                      <div className={`w-0.5 h-16 mt-2 ${
                        status === "completed" ? "bg-success" : "bg-border"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${
                        status === "current" ? "text-primary" : ""
                      }`}>
                        {stageLabels[stageName]}
                      </h3>
                      {status === "current" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          In Progress
                        </span>
                      )}
                    </div>
                    {stageData && (
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p>
                          Started: {format(new Date(stageData.started_at), "PPp")}
                        </p>
                        {stageData.completed_at && (
                          <p>
                            Completed: {format(new Date(stageData.completed_at), "PPp")}
                          </p>
                        )}
                        <p>Responsible: {stageData.profiles?.full_name}</p>
                        {stageData.notes && (
                          <p className="italic">Notes: {stageData.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
