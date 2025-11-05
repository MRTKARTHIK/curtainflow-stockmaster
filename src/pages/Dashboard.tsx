import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Package, Clipboard, TrendingUp, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFabrics: 0,
    lowStockItems: 0,
    activeJobs: 0,
    completedJobs: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load fabric count
    const { count: fabricCount } = await supabase
      .from("fabrics")
      .select("*", { count: "exact", head: true });

    // Load low stock items
    const { data: lowStockData } = await supabase
      .from("fabrics")
      .select("*");
    
    const lowStock = lowStockData?.filter(f => f.current_quantity <= f.reorder_level) || [];

    // Load job cards
    const { count: activeJobCount } = await supabase
      .from("job_cards")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress");

    const { count: completedJobCount } = await supabase
      .from("job_cards")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Load recent stock movements
    const { data: movements } = await supabase
      .from("stock_movements")
      .select(`
        *,
        fabrics(name),
        profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({
      totalFabrics: fabricCount || 0,
      lowStockItems: lowStock.length,
      activeJobs: activeJobCount || 0,
      completedJobs: completedJobCount || 0,
    });

    setRecentActivity(movements || []);
  };

  const statCards = [
    {
      title: "Total Fabric Types",
      value: stats.totalFabrics,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Clipboard,
      color: "text-accent",
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs,
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your curtain factory operations
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {activity.movement_type} - {activity.fabrics?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.quantity} units by {activity.profiles?.full_name}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Dashboard;
