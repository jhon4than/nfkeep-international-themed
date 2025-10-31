import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function WebhookTest() {
  return (
    <AppSidebarLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta página é um stub para testes de webhook.</p>
          </CardContent>
        </Card>
      </div>
    </AppSidebarLayout>
  );
}