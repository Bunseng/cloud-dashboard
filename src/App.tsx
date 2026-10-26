import { TooltipProvider } from "@/components/ui/tooltip";

import { FirstUserProvider } from "./firstusersrc/FirstUserContext";
import { DatabaseBackupProvider } from "./pages/database/DatabaseBackupContext";
import { VpsSnapshotProvider } from "./pages/vps/VpsSnapshotContext";
import { PlanScheduleProvider } from "./context/PlanScheduleContext";
import { AccountBalanceProvider } from "./context/AccountBalanceContext";
import { ProjectProvider } from "./context/ProjectContext";
import DashboardPage from "./DashboardPage";

function App() {
  return (
    <FirstUserProvider>
      <ProjectProvider>
        <DatabaseBackupProvider>
          <VpsSnapshotProvider>
            <PlanScheduleProvider>
              <AccountBalanceProvider>
                <TooltipProvider delayDuration={200}>
                  <DashboardPage />
                </TooltipProvider>
              </AccountBalanceProvider>
            </PlanScheduleProvider>
          </VpsSnapshotProvider>
        </DatabaseBackupProvider>
      </ProjectProvider>
    </FirstUserProvider>
  );
}

export default App;
