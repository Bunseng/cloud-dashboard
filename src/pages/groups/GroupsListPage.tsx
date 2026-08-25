import { useState } from "react";

import { ResourceListView } from "../../components/ResourceListView";
import { createGroup, deleteGroup, GROUPS, type Group } from "../../data/groups";
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

export function GroupsListPage({ onViewGroup }: { onViewGroup: (id: string) => void }) {
  // Re-seeds from the shared GROUPS array on every mount — Layout
  // remounts this route on navigation, which is exactly when edits
  // made from a Group's detail page (rename/delete/members) need to
  // show up back here.
  const [groups, setGroups] = useState<Group[]>(() => [...GROUPS]);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Group Members
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Bundle teammates into a Group and grant the bundle one shared set of
        resource permissions, instead of inviting each person separately.
      </p>

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

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(name) => setGroups((prev) => [...prev, createGroup(name)])}
      />
    </div>
  );
}
