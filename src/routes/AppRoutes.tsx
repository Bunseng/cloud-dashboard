import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Box } from "@/components/animate-ui/icons/box";
import { Database } from "@/components/animate-ui/icons/database";
import { Layers } from "@/components/animate-ui/icons/layers";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Server } from "@/components/animate-ui/icons/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Layout } from "../components/Layout";
import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../components/atoms";
import { MultiSubscriptionView, SubscriptionPlanView } from "../components/PlanCards";
import { EmptyState } from "../firstusersrc/EmptyState";
import { useFirstUser } from "../firstusersrc/FirstUserContext";
import { useSubscribeNavigate } from "../firstusersrc/useSubscribeNavigate";
import { FEATURES } from "../data/nav";
import { PLACEHOLDER_SUBSCRIPTION_COUNT, WALLET_TABS } from "../data/billing";

import { HomePage } from "../pages/HomePage";
import { PlanningPage } from "../pages/PlanningPage";
import { BillingPage } from "../pages/BillingPage";
import { PaymentPage } from "../pages/PaymentPage";
import { ProfilePage } from "../pages/ProfilePage";
import { TopUpPage } from "../pages/TopUpPage";
import { SubscribePage } from "../pages/SubscribePage";
import { LogOutPage } from "../pages/LogOutPage";
import { PublicPricingPage } from "../pages/PublicPricingPage";
import { PRICING_CATEGORIES, type PricingCategory, type PricingServiceKey } from "../data/pricing";

// Database Backup isn't a real service tab (not in PRICING_CATEGORIES),
// so its icon is typed the same loose way PricingCategory.icon is —
// otherwise Database's own narrow animation-trigger type doesn't line up
// with SubscribePage's broader `icon` prop type.
const DATABASE_BACKUP_ICON: PricingCategory["icon"] = Database;

import { StoragePanel, StorageUsagePanel } from "../pages/storage/StoragePanel";
import { CreateBucketDialog } from "../pages/storage/BucketDialogs";
import { BucketDetailPage } from "../pages/storage/BucketDetailPage";

import {
  RUNAPP_PLAN_STATS,
  SERVICE_ROWS,
  ServiceListPage,
  StackListPage,
  STACK_ROWS,
} from "../pages/runapp/RunAppComponents";
import { ServiceDetailPage } from "../pages/runapp/ServiceDetailPage";
import { CreateRunAppPage, type RunAppServiceSeed } from "../pages/runapp/CreateRunAppPage";
import { RESOURCE_PRESETS } from "../pages/runapp/RunAppDialogs";

import {
  DATABASE_INSTANCES,
  DATABASE_SUBSCRIPTION_STATS,
  DatabaseInstanceDetailPage,
} from "../pages/database/DatabaseInstanceDetailPage";
import { DatabaseBackupsPage } from "../pages/database/DatabaseBackupsPage";
import { DatabaseInstanceBackupsPage } from "../pages/database/DatabaseInstanceBackupsPage";
import { useDatabaseBackup } from "../pages/database/DatabaseBackupContext";

import {
  VPS_INSTANCES,
  VPS_SUBSCRIPTION_STATS,
  VpsInstanceDetailPage,
} from "../pages/vps/VpsInstanceDetailPage";
import { VpsMonitoringPage } from "../pages/vps/VpsMonitoringPage";
import { VpsSnapshotsPage } from "../pages/vps/VpsSnapshotsPage";
import { CreateVpsPage, VPS_PROVISIONED, type VpsCreateResult } from "../pages/vps/CreateVpsPage";

/* Subscription 3 is the one VPS subscription whose server hasn't been
   provisioned yet — visiting it shows CreateVpsPage (same idea as Run
   App's empty Stack List prompting "Create Stack") instead of a
   ready-made instance, until you actually create one. */
const UNPROVISIONED_VPS_INSTANCE = "VPS Instance 3";

import { GroupsListPage } from "../pages/groups/GroupsListPage";
import { GroupDetailPage } from "../pages/groups/GroupDetailPage";

import { MediaLayout } from "../media/MediaLayout";
import { RoomsPage } from "../pages/media/RoomsPage";
import { RoomDetailPage } from "../pages/media/RoomDetailPage";
import { AnalyticsPage as MediaAnalyticsPage } from "../pages/media/AnalyticsPage";
import { PlansPage as MediaPlansPage } from "../pages/media/PlansPage";

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
  const { isFirstUser } = useFirstUser();
  const subscribeNavigate = useSubscribeNavigate();

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
            {isFirstUser ? (
              <EmptyState
                icon={f.icon}
                title={`No ${f.navLabel} subscriptions yet`}
                description={`Subscribe to a ${f.resourceLabel} plan to get started with ${f.navLabel}.`}
                actionLabel="Subscribe Plan"
                onAction={() =>
                  subscribeNavigate(
                    `/subscribe/${f.id}/${f.id === "database" || f.id === "vps" ? "standard" : f.id === "storage" ? "free" : "basic"}`
                  )
                }
              />
            ) : f.multiSubscription ? (
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
                onUpgrade={() => {
                  const currentTierId = f.id === "database" || f.id === "vps" ? "standard" : "basic";
                  navigate(`/subscribe/${f.id}/${currentTierId}?upgrade=1`);
                }}
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

function ProfileRoute() {
  return <ProfilePage />;
}

function TopUpRoute() {
  const navigate = useNavigate();
  return <TopUpPage onDone={() => navigate("/payment")} />;
}

function SubscribeRoute() {
  const { category, tierId } = useParams<{ category: string; tierId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscribe, addBackup } = useDatabaseBackup();

  // Database Backup is its own add-on subscription, not one of the real
  // services listed on Planning/Public Pricing — same Plan → Payment →
  // Success flow (SubscribePage), but it isn't in PRICING_CATEGORIES.
  // It's also always scoped to one specific database instance (?instance=
  // — every entry point into this flow is a specific instance's own
  // Backups page auto-redirecting here), not one blanket subscription
  // for every database, so finishing it only enables Backup for that
  // instance and lands back on ?return= (that instance's Backups page).
  // Backups are automatic once subscribed — no manual "Create Backup"
  // step anywhere — so the plan's first backup is captured right here.
  if (category === "databaseBackup") {
    const returnTo = searchParams.get("return") || "/database/backups";
    const instanceForBackup = searchParams.get("instance");
    const isBackupUpgrade = Boolean(searchParams.get("upgrade"));
    return (
      <SubscribePage
        categoryKey="databaseBackup"
        categoryLabel="Database Backup"
        icon={DATABASE_BACKUP_ICON}
        initialTierId={tierId ?? "basic"}
        mode={isBackupUpgrade ? "upgrade" : "new"}
        onDone={(purchasedTierId) => {
          if (instanceForBackup) {
            subscribe(instanceForBackup, purchasedTierId);
            // Upgrading an existing plan changes the tier only — it
            // doesn't produce a fresh backup the way first subscribing
            // does.
            if (!isBackupUpgrade) {
              addBackup({
                name: `${instanceForBackup}-backup`,
                instanceName: instanceForBackup,
                size: DATABASE_INSTANCES[instanceForBackup]?.resource.storage ?? "60 GB",
                createdOn: new Date().toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              });
            }
          }
          navigate(returnTo);
        }}
        onCancel={() => navigate(returnTo)}
      />
    );
  }

  const cat =
    PRICING_CATEGORIES.find((c) => c.key === category) ?? PRICING_CATEGORIES[0];

  return (
    <SubscribePage
      categoryKey={cat.key as PricingServiceKey}
      categoryLabel={cat.label}
      icon={cat.icon}
      initialTierId={tierId ?? ""}
      mode={searchParams.get("upgrade") ? "upgrade" : "new"}
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
  const { isFirstUser } = useFirstUser();
  const subscribeNavigate = useSubscribeNavigate();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Storage
        </h1>
        {!isFirstUser && (
          <Button
            variant="brand"
            onClick={() => setCreateBucketOpen(true)}
            className="h-9 shrink-0 px-4 text-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} animateOnHover animateOnTap />
            Create Bucket
          </Button>
        )}
      </div>

      <div className="mt-7">
        {isFirstUser ? (
          <EmptyState
            icon={Box}
            title="No Storage subscriptions yet"
            description="Subscribe to a Storage plan to create your first bucket."
            actionLabel="Subscribe Plan"
            onAction={() => subscribeNavigate("/subscribe/storage/free")}
          />
        ) : (
          <div className="flex items-start gap-6">
            <div className="min-w-0 flex-1">
              <StoragePanel
                onViewBucket={(name: string) => navigate(`/storage/${encodeURIComponent(name)}`)}
              />
            </div>
            <StorageUsagePanel onUpgrade={() => navigate("/subscribe/storage/free?upgrade=1")} />
          </div>
        )}
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
  const { isFirstUser } = useFirstUser();
  const subscribeNavigate = useSubscribeNavigate();
  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Run App
      </h1>
      <div className="mt-7">
        {isFirstUser ? (
          <EmptyState
            icon={Layers}
            title="No Run App subscriptions yet"
            description="Subscribe to a Stack plan to deploy your first app."
            actionLabel="Subscribe Plan"
            onAction={() => subscribeNavigate("/subscribe/runapp/basic")}
          />
        ) : (
          <MultiSubscriptionView
            resourceLabel="Stack"
            description={`${PLACEHOLDER_SUBSCRIPTION_COUNT} active — each stack can carry its own plan.`}
            footerLabel="View Stack List"
            planName="Basic"
            stats={RUNAPP_PLAN_STATS}
            onSelectSubscription={(n: number) => navigate(`/runapp/${n}`)}
            onNewSubscription={() => navigate("/planning")}
            onUpgrade={() => navigate("/subscribe/runapp/basic?upgrade=1")}
          />
        )}
      </div>
    </>
  );
}

function StackListRoute() {
  const { subNumber } = useParams<{ subNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // A stack just created or renamed on the full-page Create/Edit Run
  // App flow arrives via router state (see CreateRunAppRoute /
  // EditRunAppRoute) since this list has no shared store of its own.
  const { createdStack, renamedStack } =
    (location.state as {
      createdStack?: (typeof STACK_ROWS)[number];
      renamedStack?: { from: string; to: string };
    } | null) ?? {};
  return (
    <StackListPage
      subscriptionNumber={subNumber ?? ""}
      onBack={() => navigate("/runapp")}
      onViewStack={(stackName: string) =>
        navigate(`/runapp/${subNumber}/${encodeURIComponent(stackName)}`)
      }
      onUpgrade={() => navigate("/subscribe/runapp/basic?upgrade=1")}
      onCreateStack={() => navigate(`/runapp/${subNumber}/create`)}
      onEditStack={(stackName: string) =>
        navigate(`/runapp/${subNumber}/${encodeURIComponent(stackName)}/edit`)
      }
      createdStack={createdStack}
      renamedStack={renamedStack}
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

function EditRunAppRoute() {
  const { subNumber, stackName } = useParams<{ subNumber: string; stackName: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(stackName ?? "");
  // Same 3 sample services every stack's Service List shows today (this
  // mock has no real per-stack service store) — seeded into the same
  // "Create Run App" fields so editing shows exactly what creating did.
  const initialServices: RunAppServiceSeed[] = SERVICE_ROWS.map((row) => ({
    name: row.name,
    image: row.detail.containerImage,
    hostName: row.detail.hostName === "NONE" ? "" : row.detail.hostName,
    registryAuth: row.detail.registryAuth,
    registryId: row.detail.registryId,
    env: row.detail.env,
    resourcePreset:
      RESOURCE_PRESETS.find(
        (p) => p.cpu === row.detail.resource.cpu && p.memory === row.detail.resource.memory
      )?.label ?? RESOURCE_PRESETS[0].label,
    replica: row.detail.replica,
  }));
  return (
    <CreateRunAppPage
      mode="edit"
      initialStackName={decodedName}
      initialServices={initialServices}
      onBack={() => navigate(`/runapp/${subNumber}`)}
      onSave={(nextName) =>
        navigate(`/runapp/${subNumber}`, {
          replace: true,
          state: { renamedStack: { from: decodedName, to: nextName } },
        })
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
  const { isFirstUser } = useFirstUser();
  const subscribeNavigate = useSubscribeNavigate();
  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Databases
      </h1>
      <div className="mt-7">
        {isFirstUser ? (
          <EmptyState
            icon={Database}
            title="No Database subscriptions yet"
            description="Subscribe to a Database plan to create your first instance."
            actionLabel="Subscribe Plan"
            onAction={() => subscribeNavigate("/subscribe/database/standard")}
          />
        ) : (
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
            onUpgrade={() => navigate("/subscribe/database/standard?upgrade=1")}
          />
        )}
      </div>
    </>
  );
}

function DatabaseInstanceRoute() {
  const { instanceName } = useParams<{ instanceName: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(instanceName ?? "");
  return (
    <DatabaseInstanceDetailPage
      instanceName={decodedName}
      onBack={() => navigate("/database")}
      onUpgrade={() => navigate("/subscribe/database/standard?upgrade=1")}
      onOpenBackups={() => navigate(`/database/${encodeURIComponent(decodedName)}/backups`)}
    />
  );
}

function DatabaseInstanceBackupsRoute() {
  const { instanceName } = useParams<{ instanceName: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(instanceName ?? "");
  return (
    <DatabaseInstanceBackupsPage
      instanceName={decodedName}
      onBack={() => navigate(`/database/${encodeURIComponent(decodedName)}`)}
    />
  );
}

function VpsRoute() {
  const navigate = useNavigate();
  const { isFirstUser } = useFirstUser();
  const subscribeNavigate = useSubscribeNavigate();
  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        VPS
      </h1>
      <div className="mt-7">
        {isFirstUser ? (
          <EmptyState
            icon={Server}
            title="No VPS subscriptions yet"
            description="Subscribe to a VPS plan to provision your first server."
            actionLabel="Subscribe Plan"
            onAction={() => subscribeNavigate("/subscribe/vps/standard")}
          />
        ) : (
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
            onUpgrade={() => navigate("/subscribe/vps/standard?upgrade=1")}
          />
        )}
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
  const decodedName = decodeURIComponent(instanceName ?? "");
  const [provisioned, setProvisioned] = useState<VpsCreateResult | null>(
    () => VPS_PROVISIONED[decodedName] ?? null
  );

  if (decodedName === UNPROVISIONED_VPS_INSTANCE && !provisioned) {
    return (
      <CreateVpsPage
        instanceName={decodedName}
        onBack={() => navigate("/vps")}
        onCreate={(result) => {
          VPS_PROVISIONED[decodedName] = result;
          setProvisioned(result);
        }}
      />
    );
  }

  return (
    <VpsInstanceDetailPage
      instanceName={decodedName}
      onBack={() => navigate("/vps")}
      onUpgrade={() => navigate("/subscribe/vps/standard?upgrade=1")}
      onMonitoring={() => navigate(`/vps/${encodeURIComponent(decodedName)}/monitoring`)}
      overrides={provisioned ?? undefined}
    />
  );
}

function VpsMonitoringRoute() {
  const { instanceName } = useParams<{ instanceName: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(instanceName ?? "");
  const instance = VPS_INSTANCES[decodedName];
  return (
    <VpsMonitoringPage
      instanceName={decodedName}
      publicIp={instance?.network.publicIp ?? "103.56.1.11"}
      hostname={instance?.hostname}
      os={instance?.os}
      region={instance?.region}
      cpuCores={instance ? parseFloat(instance.resource.cpu) : undefined}
      memoryTotalGiB={instance ? parseFloat(instance.resource.memory) : undefined}
      storageTotalGiB={instance ? parseFloat(instance.resource.storage) : undefined}
      onBack={() => navigate(`/vps/${encodeURIComponent(decodedName)}`)}
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
        <Route path="/profile" element={<ProfileRoute />} />
        <Route path="/billing" element={<Navigate to={`/billing/${WALLET_TABS[0].key}`} replace />} />
        <Route path="/billing/:tab" element={<BillingRoute />} />
        <Route path="/topup" element={<TopUpRoute />} />
        <Route path="/subscribe/:category/:tierId" element={<SubscribeRoute />} />
        <Route path="/storage" element={<StorageRoute />} />
        <Route path="/storage/:bucketName" element={<BucketDetailRoute />} />
        <Route path="/runapp" element={<RunAppRoute />} />
        <Route path="/runapp/:subNumber" element={<StackListRoute />} />
        <Route path="/runapp/:subNumber/create" element={<CreateRunAppRoute />} />
        <Route path="/runapp/:subNumber/:stackName/edit" element={<EditRunAppRoute />} />
        <Route path="/runapp/:subNumber/:stackName" element={<ServiceListRoute />} />
        <Route path="/runapp/:subNumber/:stackName/:serviceName" element={<ServiceDetailRoute />} />
        <Route path="/database" element={<DatabaseRoute />} />
        <Route path="/database/backups" element={<DatabaseBackupsPage />} />
        <Route path="/database/:instanceName" element={<DatabaseInstanceRoute />} />
        <Route path="/database/:instanceName/backups" element={<DatabaseInstanceBackupsRoute />} />
        <Route path="/vps" element={<VpsRoute />} />
        <Route path="/vps/snapshots" element={<VpsSnapshotsPage />} />
        <Route path="/vps/:instanceName" element={<VpsInstanceRoute />} />
        <Route path="/vps/:instanceName/monitoring" element={<VpsMonitoringRoute />} />
        <Route path="/groups" element={<GroupsRoute />} />
        <Route path="/groups/:groupId" element={<GroupDetailRoute />} />
      </Route>

      {/* Media — its own Sidebar/header (MediaLayout), separate from the
          main dashboard's Layout, the way /logout and /pricing already
          sit outside it. Reached from the account menu's "Media" item. */}
      <Route element={<MediaLayout dark={dark} onToggleTheme={toggleTheme} />}>
        <Route path="/media" element={<Navigate to="/media/rooms" replace />} />
        <Route path="/media/rooms" element={<RoomsPage />} />
        <Route path="/media/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/media/analytics" element={<MediaAnalyticsPage />} />
        <Route path="/media/plans" element={<MediaPlansPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
