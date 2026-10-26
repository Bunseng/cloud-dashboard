import { useState } from "react";

import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../../components/atoms";
import { ResourceListView } from "../../components/ResourceListView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  acceptInvite,
  createGroup,
  CURRENT_CLOUD_ID,
  declineInvite,
  deleteGroup,
  GROUP_INVITES,
  GROUPS,
  type Group,
  type GroupInvite,
} from "../../data/groups";
import { CreateGroupDialog } from "./GroupDialogs";

/* ------------------------------------------------------------------ *
 * Groups list — Sidebar "Manage" → Groups. One row per Group, showing
 * how many members it has and how many resources it's been granted
 * access to, so you can tell a stale/unused Group apart from a real
 * one without opening it. "View Detail" drops into its Member /
 * Permission / Setting tabs; "Create Group" only asks for a name.
 * ------------------------------------------------------------------ */

const GROUP_COLUMNS = [
  {
    key: "name",
    header: "Group Name",
    className: "w-[260px] font-medium text-zinc-900 dark:text-zinc-100",
  },
  {
    key: "members",
    header: "Members",
    render: (row: Group) => `${row.members.length} member${row.members.length === 1 ? "" : "s"}`,
  },
  {
    key: "permissions",
    header: "Resource Access",
    render: (row: Group) => {
      const count = Object.values(row.permissions).filter((p) => p !== "No Access").length;
      return count === 0 ? "No access granted" : `${count} resource${count === 1 ? "" : "s"}`;
    },
  },
];

function InvitesTab({
  invites,
  onChange,
}: {
  invites: GroupInvite[];
  onChange: () => void;
}) {
  if (invites.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        No pending invites. When another group invites you, it shows up here.
      </p>
    );
  }

  return (
    <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {invites.map((invite) => {
        const group = GROUPS.find((g) => g.id === invite.groupId);
        return (
          <div key={invite.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {group?.name ?? "Unknown group"}
              </p>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Invited to join as {invite.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 text-sm"
                onClick={() => {
                  declineInvite(invite.id);
                  onChange();
                }}
              >
                Decline
              </Button>
              <Button
                variant="brand"
                className="h-8 text-sm"
                onClick={() => {
                  acceptInvite(invite.id);
                  onChange();
                }}
              >
                Accept
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function GroupsListPage({ onViewGroup }: { onViewGroup: (id: string) => void }) {
  // Re-seeds from the shared GROUPS/GROUP_INVITES arrays on every mount —
  // Layout remounts this route on navigation, which is exactly when
  // edits made elsewhere (rename/delete/members, a new invite sent to
  // you) need to show up back here.
  const [groups, setGroups] = useState<Group[]>(() => [...GROUPS]);
  const [invites, setInvites] = useState<GroupInvite[]>(() =>
    GROUP_INVITES.filter((i) => i.cloudId === CURRENT_CLOUD_ID)
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("groups");

  function refreshInvites() {
    setInvites(GROUP_INVITES.filter((i) => i.cloudId === CURRENT_CLOUD_ID));
    setGroups([...GROUPS]);
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Group Members
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Bundle teammates into a Group and grant the bundle one shared set of
        resource permissions, instead of inviting each person separately.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          <TabsTrigger value="groups" className={PILL_TAB_TRIGGER_CLASS}>
            My Groups
          </TabsTrigger>
          <TabsTrigger value="invites" className={PILL_TAB_TRIGGER_CLASS}>
            Invites
            {invites.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1C75BC] px-1 text-[10px] font-semibold text-white">
                {invites.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <ResourceListView
            columns={GROUP_COLUMNS}
            rows={groups as unknown as { id: string; name: string; [key: string]: any }[]}
            createLabel="Create Group"
            emptyTitle="No groups yet"
            emptyDescription="Create a group to invite teammates and grant them shared access."
            onViewDetail={(name) => {
              const group = groups.find((g) => g.name === name);
              if (group) onViewGroup(group.id);
            }}
            onCreate={() => setCreateOpen(true)}
            onDelete={(row) => {
              deleteGroup(row.id as string);
              setGroups((prev) => prev.filter((g) => g.id !== row.id));
            }}
          />
        </TabsContent>

        <TabsContent value="invites">
          <InvitesTab invites={invites} onChange={refreshInvites} />
        </TabsContent>
      </Tabs>

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(name) => setGroups((prev) => [...prev, createGroup(name)])}
      />
    </div>
  );
}
