import { TooltipProvider } from "@/components/ui/tooltip";

import { FirstUserProvider } from "./firstusersrc/FirstUserContext";
import { DatabaseBackupProvider } from "./pages/database/DatabaseBackupContext";
import DashboardPage from "./DashboardPage";

function App() {
  return (
    <FirstUserProvider>
      <DatabaseBackupProvider>
        <TooltipProvider delayDuration={200}>
          <DashboardPage />
        </TooltipProvider>
      </DatabaseBackupProvider>
    </FirstUserProvider>
  );
}

export default App;
