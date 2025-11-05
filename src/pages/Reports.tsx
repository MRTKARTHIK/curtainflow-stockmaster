import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockMovementReport } from "@/components/reports/StockMovementReport";
import { ProductionReport } from "@/components/reports/ProductionReport";

const Reports = () => {
  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Logs</h1>
            <p className="text-muted-foreground">
              View detailed reports and activity logs
            </p>
          </div>

          <Tabs defaultValue="stock" className="space-y-6">
            <TabsList>
              <TabsTrigger value="stock">Stock Movements</TabsTrigger>
              <TabsTrigger value="production">Production Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="stock">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Movement History</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockMovementReport />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="production">
              <Card>
                <CardHeader>
                  <CardTitle>Production Stage Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductionReport />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Reports;
