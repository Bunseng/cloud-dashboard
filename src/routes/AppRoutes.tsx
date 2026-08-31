import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Layout } from "../components/Layout";
import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../components/atoms";
import { MultiSubscriptionView, SubscriptionPlanView } from "../components/PlanCards";
import { FEATURES } from "../data/nav";
import { PLACEHOLDER_SUBSCRIPTION_COUNT, WALLET_TABS } from "../data/billing";

import { HomePage } from "../pages/HomePage";
import { PlanningPage } from "../pages/PlanningPage";
import { BillingPage } from "../pages/BillingPage";
import { PaymentPage } from "../pages/PaymentPage";
import { TopUpPage } from "../pages/TopUpPage";
import { SubscribePage } from "../pages/SubscribePage";
import { LogOutPage } from "../pages/LogOutPage";
import { PublicPricingPage } from "../pages/PublicPricingPage";
import { PRICING_CATEGORIES, type PricingServiceKey } from "../data/pricing";

import { StoragePanel, StorageUsagePanel } from "../pages/storage/StoragePanel";
import { CreateBucketDialog } from "../pages/storage/BucketDialogs";
import { BucketDetailPage } from "../pages/storage/BucketDetailPage";

import {
  RUNAPP_PLAN_STATS,
  ServiceListPage,
  StackListPage,
  STACK_ROWS,
} from "../pages/runapp/RunAppComponents";
import { ServiceDetailPage } from "../pages/runapp/ServiceDetailPage";
import { CreateRunAppPage } from "../pages/runapp/CreateRunAppPage";

import {
  DATABASE_SUBSCRIPTION_STATS,
  DatabaseInstanceDetailPage,
} from "../pages/database/DatabaseInstanceDetailPage";

import {
  VPS_SUBSCRIPTION_STATS,
  VpsInstanceDetailPage,
} from "../pages/vps/VpsInstanceDetailPage";

import { GroupsListPage } from "../pages/groups/GroupsListPage";
import { GroupDetailPage } from "../pages/groups/GroupDetailPage";

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Routing shell — every page and drill-down below is a real URL rather
 * than sibling `open*` state, so back/forward, refresh, and sharing a
 * link all just work. `Layout` renders the persistent Sidebar/Topbar
 * frame around whatever route matched into its <Outlet/>; the small
 * *Route wrapper components below it translate between useParams/
 * useNavigate and the existing page components' plain props, so none of
 * those components needed to know routing exists.
 * ------------------------------------------------------------------ */

function HomeRoute() {
  const navigate = useNavigate();
  return (
    <HomePage
      onOpenService={(id: string) => navigate(`/dashboard/${id}`)}
      onOpenPlanning={() => navigate("/planning")}
    />
  );
}

function DashboardRoute() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const dashboardTab = FEATURES.some((f) => f.id === tab) ? tab : FEATURES[0].id;

  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>

      <Tabs value={dashboardTab} onValueChange={(id) => navigate(`/dashboard/${id}`)} className="mt-7">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          {FEATURES.map((f) => (
            <TabsTrigger key={f.id} value={f.id} className={PILL_TAB_TRIGGER_CLASS}>
              {f.tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>

        {FEATURES.map((f) => (
          <TabsContent key={f.id} value={f.id} className="mt-6">
            {f.multiSubscription ? (
              <MultiSubscriptionView
                resourceLabel={f.resourceLabel}
                planName={f.id === "database" || f.id === "vps" ? "Standard" : "Basic"}
                stats={
                  f.id === "database"
                    ? DATABASE_SUBSCRIPTION_STATS
                    : f.id === "vps"
                    ? VPS_SUBSCRIPTION_STATS
                    : RUNAPP_PLAN_STATS
                }
                // Picking a subscription here jumps straight into its
                // detail (instance / stack list) — no intermediate
                // "pick a subscription" list, since that's exactly what
                // this card already is.
                onSelectSubscription={(n: number) => {
                  if (f.id === "database") {
                    navigate(`/database/${encodeURIComponent(`DB Instance ${n}`)}`);
                  } else if (f.id === "vps") {
                    navigate(`/vps/${encodeURIComponent(`VPS Instance ${n}`)}`);
                  } else {
                    navigate(`/runapp/${n}`);
                  }
                }}
                onNewSubscription={() => navigate("/planning")}
              />
            ) : (
              <SubscriptionPlanView
                resourceLabel={f.resourceLabel}
                onSelectPlan={() => navigate(`/${f.id}`)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function BillingRoute() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab = WALLET_TABS.some((t) => t.key === tab) ? tab : WALLET_TABS[0].key;
  return (
    <BillingPage
      tab={activeTab}
      onTabChange={(key: string) => navigate(`/billing/${key}`)}
    />
  );
}

function PaymentRoute() {
  const navigate = useNavigate();
  return (
    <PaymentPage onViewBilling={() => navigate("/billing")} />
  );
}

function TopUpRoute() {
  const navigate = useNavigate();
  return <TopUpPage onDone={() => navigate("/payment")} />;
}

function SubscribeRoute() {
  const { category, tierId } = useParams<{ category: string; tierId: string }>();
  const navigate = useNavigate();
  const cat =
    PRICING_CATEGORIES.find((c) => c.key === category) ?? PRICING_CATEGORIES[0];

  return (
    <SubscribePage
      categoryKey={cat.key as PricingServiceKey}
      categoryLabel={cat.label}
      icon={cat.icon}
      initialTierId={tierId ?? ""}
      onDone={() =>
        navigate(FEATURES.some((f) => f.id === cat.key) ? `/dashboard/${cat.key}` : "/planning")
      }
      onCancel={() => navigate(-1)}
    />
  );
}

/* Storage — feature page header (title + Create Bucket) lives here since
   it's the one Feature with a create action; the bucket list and detail
   view are separate routes so each bucket gets its own URL. */
function StorageRoute() {
  const navigate = useNavigate();
  const [createBucketOpen, setCreateBucketOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Storage
        </h1>
        <Button
          variant="brand"
          onClick={() => setCreateBucketOpen(true)}
          className="h-9 shrink-0 px-4 text-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} animateOnHover animateOnTap />
          Create Bucket
        </Button>
      </div>

      <div className="mt-7 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <StoragePanel
            onViewBucket={(name: string) => navigate(`/storage/${encodeURIComponent(name)}`)}
          />
        </div>
        <StorageUsagePanel />
      </div>

      <CreateBucketDialog open={createBucketOpen} onOpenChange={setCreateBucketOpen} />
    </>
  );
}

function BucketDetailRoute() {
  const { bucketName } = useParams<{ bucketName: string }>();
  const navigate = useNavigate();
  return (
    <BucketDetailPage
      bucketName={decodeURIComponent(bucketName ?? "")}
      onBack={() => navigate("/storage")}
    />
  );
}

function RunAppRoute() {
  const navigate = useNavigate();
  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Run App
      </h1>
      <div className="mt-7">
        <MultiSubscriptionView
          resourceLabel="Stack"
          description={`${PLACEHOLDER_SUBSCRIPTION_COUNT} active — each stack can carry its own plan.`}
          footerLabel="View Stack List"
          planName="Basic"
          stats={RUNAPP_PLAN_STATS}
          onSelectSubscription={(n: number) => navigate(`/runapp/${n}`)}
          onNewSubscription={() => navigate("/planning")}
        />
      </div>
    </>
  );
}

function StackListRoute() {
  const { subNumber } = useParams<{ subNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // A stack just created on the full-page Create Run App flow arrives
  // via router state (see CreateRunAppRoute) since this list has no
  // shared store of its own.
  const createdStack = (location.state as { createdStack?: (typeof STACK_ROWS)[number] } | null)
    ?.createdStack;
  return (
    <StackListPage
      subscriptionNumber={subNumber ?? ""}
      onBack={() => navigate("/runapp")}
      onViewStack={(stackName: string) =>
        navigate(`/runapp/${subNumber}/${encodeURIComponent(stackName)}`)
      }
      onNewSubscription={() => navigate("/planning")}
      onCreateStack={() => navigate(`/runapp/${subNumber}/create`)}
      createdStack={createdStack}
    />
  );
}

function CreateRunAppRoute() {
  const { subNumber } = useParams<{ subNumber: string }>();
  const navigate = useNavigate();
  return (
    <CreateRunAppPage
      onBack={() => navigate(`/runapp/${subNumber}`)}
      onCreate={(stack) =>
        navigate(`/runapp/${subNumber}`, { replace: true, state: { createdStack: stack } })
      }
    />
  );
}

function ServiceListRoute() {
  const { subNumber, stackName } = useParams<{ subNumber: string; stackName: string }>();
  const navigate = useNavigate();
  return (
    <ServiceListPage
      stackName={decodeURIComponent(stackName ?? "")}
      onBack={() => navigate(`/runapp/${subNumber}`)}
      onViewService={(serviceName: string) =>
        navigate(`/runapp/${subNumber}/${stackName}/${encodeURIComponent(serviceName)}`)
      }
    />
  );
}

function ServiceDetailRoute() {
  const { subNumber, stackName, serviceName } = useParams<{
    subNumber: string;
    stackName: string;
    serviceName: string;
  }>();
  const navigate = useNavigate();
  return (
    <ServiceDetailPage
      stackName={decodeURIComponent(stackName ?? "")}
      serviceName={decodeURIComponent(serviceName ?? "")}
      onBack={() => navigate(`/runapp/${subNumber}/${stackName}`)}
    />
  );
}

function DatabaseRoute() {
  const navigate = useNavigate();
  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Databases
      </h1>
      <div className="mt-7">
        <MultiSubscriptionView
          resourceLabel="Database"
          description={`${PLACEHOLDER_SUBSCRIPTION_COUNT} active — each subscription runs one database instance.`}
          footerLabel="View Instance"
          planName="Standard"
          stats={DATABASE_SUBSCRIPTION_STATS}
          onSelectSubscription={(n: number) =>
            navigate(`/database/${encodeURIComponent(`DB Instance ${n}`)}`)
          }
          onNewSubscription={() => navigate("/planning")}
        />
      </div>
    </>
  );
}

function DatabaseInstanceRoute() {
  const { instanceName } = useParams<{ instanceName: string }>();
  const navigate = useNavigate();
  return (
    <DatabaseInstanceDetailPage
      instanceName={decodeURIComponent(instanceName ?? "")}
      onBack={() => navigate("/database")}
    />
  );
}

function VpsRoute() {
  const navigate = useNavigate();
  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        VPS
      </h1>
      <div className="mt-7">
        <MultiSubscriptionView
          resourceLabel="VPS"
          description={`${PLACEHOLDER_SUBSCRIPTION_COUNT} active — each subscription is one full root-access server.`}
          footerLabel="View Server"
          planName="Standard"
          stats={VPS_SUBSCRIPTION_STATS}
          onSelectSubscription={(n: number) =>
            navigate(`/vps/${encodeURIComponent(`VPS Instance ${n}`)}`)
          }
          onNewSubscription={() => navigate("/planning")}
        />
      </div>
    </>
  );
}

function GroupsRoute() {
  const navigate = useNavigate();
  return <GroupsListPage onViewGroup={(id) => navigate(`/groups/${id}`)} />;
}

function GroupDetailRoute() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  return <GroupDetailPage groupId={groupId ?? ""} onBack={() => navigate("/groups")} />;
}

function VpsInstanceRoute() {
  const { instanceName } = useParams<{ instanceName: string }>();
  const navigate = useNavigate();
  return (
    <VpsInstanceDetailPage
      instanceName={decodeURIComponent(instanceName ?? "")}
      onBack={() => navigate("/vps")}
      onUpgrade={() => navigate("/subscribe/vps/standard")}
    />
  );
}

export default function DashboardPage() {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);

  return (
    <Routes>
      {/* Logging out swaps the whole dashboard shell for the public
          landing page — no sidebar, its own top bar and footer — so it
          sits outside Layout entirely rather than being a page inside it. */}
      <Route
        path="/logout"
        element={<LogOutPage dark={dark} onToggleTheme={toggleTheme} onLogIn={() => navigate("/")} />}
      />

      {/* Public Pricing — reachable from the Log Out page's "View
          Plans"/"Pricing" links without signing in, so it sits outside
          Layout too, using the same public top bar/footer as Log Out
          (PublicShell) instead of the dashboard sidebar. */}
      <Route
        path="/pricing"
        element={<PublicPricingPage dark={dark} onToggleTheme={toggleTheme} onLogIn={() => navigate("/")} />}
      />

      <Route element={<Layout dark={dark} onToggleTheme={toggleTheme} />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/dashboard" element={<Navigate to={`/dashboard/${FEATURES[0].id}`} replace />} />
        <Route path="/dashboard/:tab" element={<DashboardRoute />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/payment" element={<PaymentRoute />} />
        <Route path="/billing" element={<Navigate to={`/billing/${WALLET_TABS[0].key}`} replace />} />
        <Route path="/billing/:tab" element={<BillingRoute />} />
        <Route path="/topup" element={<TopUpRoute />} />
        <Route path="/subscribe/:category/:tierId" element={<SubscribeRoute />} />
        <Route path="/storage" element={<StorageRoute />} />
        <Route path="/storage/:bucketName" element={<BucketDetailRoute />} />
        <Route path="/runapp" element={<RunAppRoute />} />
        <Route path="/runapp/:subNumber" element={<StackListRoute />} />
        <Route path="/runapp/:subNumber/create" element={<CreateRunAppRoute />} />
        <Route path="/runapp/:subNumber/:stackName" element={<ServiceListRoute />} />
        <Route path="/runapp/:subNumber/:stackName/:serviceName" element={<ServiceDetailRoute />} />
        <Route path="/database" element={<DatabaseRoute />} />
        <Route path="/database/:instanceName" element={<DatabaseInstanceRoute />} />
        <Route path="/vps" element={<VpsRoute />} />
        <Route path="/vps/:instanceName" element={<VpsInstanceRoute />} />
        <Route path="/groups" element={<GroupsRoute />} />
        <Route path="/groups/:groupId" element={<GroupDetailRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
