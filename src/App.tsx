import { TooltipProvider } from "@/components/ui/tooltip";

import { FirstUserProvider } from "./firstusersrc/FirstUserContext";
import DashboardPage from "./DashboardPage";

function App() {
  return (
    <FirstUserProvider>
      <TooltipProvider delayDuration={200}>
        <DashboardPage />
      </TooltipProvider>
    </FirstUserProvider>
  );
}

export default App;
