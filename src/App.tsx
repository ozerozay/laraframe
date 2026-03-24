import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Forge } from "@/pages/Forge";
import { CloudPage } from "@/pages/CloudPage";
import { Nightwatch } from "@/pages/Nightwatch";
import { AiAssistant } from "@/pages/AiAssistant";
import { SettingsPage } from "@/pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/cloud" element={<CloudPage />} />
          <Route path="/nightwatch" element={<Nightwatch />} />
          <Route path="/ai" element={<AiAssistant />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
