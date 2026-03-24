import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, RefreshCw } from "lucide-react";

export function Nightwatch() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nightwatch</h1>
          <p className="text-muted-foreground">
            Monitor uptime, performance, and errors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Nightwatch</CardTitle>
          <CardDescription>
            Enter your Nightwatch API token to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            type="password"
            placeholder="Nightwatch API Token"
            className="max-w-md"
          />
          <Button>Connect</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center justify-center border-dashed py-12">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Activity className="h-8 w-8" />
            <p className="text-sm">No monitors yet</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
