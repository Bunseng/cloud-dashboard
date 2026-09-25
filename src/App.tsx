import { TooltipProvider } from "@/components/ui/tooltip";

import { FirstUserProvider } from "./firstusersrc/FirstUserContext";
import { DatabaseBackupProvider } from "./pages/database/DatabaseBackupContext";
import { PlanScheduleProvider } from "./context/PlanScheduleContext";
import { AccountBalanceProvider } from "./context/AccountBalanceContext";
import DashboardPage from "./DashboardPage";

function App() {
  return (
    <FirstUserProvider>
      <DatabaseBackupProvider>
        <PlanScheduleProvider>
          <AccountBalanceProvider>
            <TooltipProvider delayDuration={200}>
              <DashboardPage />
            </TooltipProvider>
          </AccountBalanceProvider>
        </PlanScheduleProvider>
      </DatabaseBackupProvider>
    </FirstUserProvider>
  );
}

export default App;
