import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RefreshCw } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Forge = lazy(() => import("@/pages/Forge").then(m => ({ default: m.Forge })));
const CloudPage = lazy(() => import("@/pages/CloudPage").then(m => ({ default: m.CloudPage })));
const Nightwatch = lazy(() => import("@/pages/Nightwatch").then(m => ({ default: m.Nightwatch })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <RefreshCw className="h-5 w-5 animate-spin text-primary/60" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forge" element={<Forge />} />
            <Route path="/cloud" element={<CloudPage />} />
            <Route path="/nightwatch" element={<Nightwatch />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
