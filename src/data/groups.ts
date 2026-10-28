/* ------------------------------------------------------------------ *
 * Groups — account-level access management, reached from the Sidebar's
 * "Manage" section. A Group is a named bundle of members (invited by
 * Cloud ID) sharing one set of resource permissions, so granting five
 * teammates the same access is "add them to a Group" instead of five
 * separate one-off grants.
 *
 * No real backend — GROUPS is a module-level mutable array (not React
 * state) so edits made from a Group's detail page (rename, delete,
 * add/remove member, change permissions) are still there if you
 * navigate back to the list, the same way a real API's writes would
 * be. Each page still keeps its own local `useState` for rendering;
 * it's just seeded from — and, through the helpers below, written
 * back to — this shared array instead of a throwaway per-mount copy.
 * ------------------------------------------------------------------ */

export interface CloudUser {
  cloudId: string;
  name: string;
  email: string;
}

/* The people you can invite into a Group — every account on Cloud+,
   looked up by Cloud ID rather than typed free-text so a Group can
   only ever contain real accounts. */
export const CLOUD_USERS: CloudUser[] = [
  { cloudId: "CLD-10234", name: "Sokha Ren", email: "sokha.ren@sabay.com" },
  { cloudId: "CLD-10235", name: "Bunseng Sorn", email: "sorn.bunseng@sabay.com" },
  { cloudId: "CLD-10236", name: "Dara Chan", email: "dara.chan@sabay.com" },
  { cloudId: "CLD-10237", name: "Sreymom Lim", email: "sreymom.lim@sabay.com" },
  { cloudId: "CLD-10238", name: "Vichet Ouk", email: "vichet.ouk@sabay.com" },
  { cloudId: "CLD-10239", name: "Channary Sok", email: "channary.sok@sabay.com" },
];


export type GroupRole = "Owner" | "Admin" | "Member";
export const GROUP_ROLES: GroupRole[] = ["Owner", "Admin", "Member"];

export interface GroupMember extends CloudUser {
  role: GroupRole;
}

/* One access level per resource — "No Access" hides the resource from
   the group entirely, "Admin" additionally covers destructive actions
   (delete/resize) that "Read & Write" doesn't. */
export type PermissionLevel = "No Access" | "Read Only" | "Read & Write" | "Admin";
export const PERMISSION_LEVELS: PermissionLevel[] = [
  "No Access",
  "Read Only",
  "Read & Write",
  "Admin",
];

export type PermissionResourceKey = "storage" | "runapp" | "database" | "vps" | "billing";

export const PERMISSION_RESOURCES: { key: PermissionResourceKey; label: string; description: string }[] = [
  { key: "storage", label: "Storage", description: "Buckets and sub-user access keys." },
  { key: "runapp", label: "Run App", description: "Stacks, services, and their deploys." },
  { key: "database", label: "Database", description: "Instances, connections, and IP whitelist." },
  { key: "vps", label: "VPS", description: "Servers and their consoles." },
  { key: "billing", label: "Billing", description: "Invoices, wallet, and plan changes." },
];

export type GroupPermissions = Record<PermissionResourceKey, PermissionLevel>;

export const DEFAULT_PERMISSIONS: GroupPermissions = {
  storage: "No Access",
  runapp: "No Access",
  database: "No Access",
  vps: "No Access",
  billing: "No Access",
};

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  // Billing is account-level, not tied to any one Project, so it lives
  // here rather than in `projectPermissions` below.
  permissions: GroupPermissions;
  // Storage/Run App/Database/VPS access is granted per Project — a group
  // might administer VPS on "web-frontend" but have no access at all on
  // "worker-queue". Keyed by Project id; a project with no entry here
  // reads as DEFAULT_PERMISSIONS (no access to anything yet).
  projectPermissions: Record<string, GroupPermissions>;
}

let nextGroupId = 1;
function makeGroupId() {
  return `grp-${Date.now()}-${nextGroupId++}`;
}

export const GROUPS: Group[] = [
  {
    id: "grp-devops",
    name: "DevOps Team",
    members: [
      { ...CLOUD_USERS[0], role: "Owner" },
      { ...CLOUD_USERS[2], role: "Member" },
    ],
    permissions: { ...DEFAULT_PERMISSIONS },
    projectPermissions: {
      "proj-web": { ...DEFAULT_PERMISSIONS, storage: "Read & Write", runapp: "Admin" },
      "proj-api": { ...DEFAULT_PERMISSIONS, runapp: "Admin", database: "Read & Write" },
      "proj-worker": { ...DEFAULT_PERMISSIONS, database: "Read & Write", vps: "Admin" },
    },
  },
  {
    id: "grp-finance",
    name: "Finance",
    members: [{ ...CLOUD_USERS[1], role: "Admin" }],
    permissions: { ...DEFAULT_PERMISSIONS, billing: "Read Only" },
    projectPermissions: {},
  },
];

export function createGroup(
  name: string,
  permissions: GroupPermissions = { ...DEFAULT_PERMISSIONS },
  projectPermissions: Record<string, GroupPermissions> = {}
): Group {
  const group: Group = {
    id: makeGroupId(),
    name,
    members: [],
    permissions: { ...permissions },
    projectPermissions: { ...projectPermissions },
  };
  GROUPS.push(group);
  return group;
}

export function deleteGroup(id: string) {
  const i = GROUPS.findIndex((g) => g.id === id);
  if (i !== -1) GROUPS.splice(i, 1);
}

export function renameGroup(id: string, name: string) {
  const group = GROUPS.find((g) => g.id === id);
  if (group) group.name = name;
}

export function addGroupMember(id: string, cloudId: string, role: GroupRole) {
  const group = GROUPS.find((g) => g.id === id);
  const user = CLOUD_USERS.find((u) => u.cloudId === cloudId);
  if (!group || !user || group.members.some((m) => m.cloudId === cloudId)) return;
  group.members.push({ ...user, role });
}

export function removeGroupMember(id: string, cloudId: string) {
  const group = GROUPS.find((g) => g.id === id);
  if (!group) return;
  group.members = group.members.filter((m) => m.cloudId !== cloudId);
}

export function setGroupMemberRole(id: string, cloudId: string, role: GroupRole) {
  const group = GROUPS.find((g) => g.id === id);
  const member = group?.members.find((m) => m.cloudId === cloudId);
  if (member) member.role = role;
}

export function saveGroupPermissions(id: string, permissions: GroupPermissions) {
  const group = GROUPS.find((g) => g.id === id);
  if (group) group.permissions = { ...permissions };
}

export function saveGroupProjectPermissions(
  id: string,
  projectId: string,
  permissions: GroupPermissions
) {
  const group = GROUPS.find((g) => g.id === id);
  if (group) group.projectPermissions = { ...group.projectPermissions, [projectId]: { ...permissions } };
}

// Total resources actually granted — account-level (Billing) plus every
// resource granted on any Project — so the Groups list can show one
// meaningful count instead of just the account-level slice.
export function countGrantedPermissions(group: Group): number {
  const accountCount = Object.values(group.permissions).filter((p) => p !== "No Access").length;
  const projectCount = Object.values(group.projectPermissions).reduce(
    (sum, perms) => sum + Object.values(perms).filter((p) => p !== "No Access").length,
    0
  );
  return accountCount + projectCount;
}

/* ------------------------------------------------------------------ *
 * Invites — inviting someone no longer adds them straight to a Group's
 * member list; it creates a pending invite they have to accept first,
 * same as a real "you've been invited" flow. "You" are whichever
 * CLOUD_USERS entry matches this account, hardcoded since there's no
 * real auth/session here.
 * ------------------------------------------------------------------ */

export const CURRENT_CLOUD_ID = "CLD-10235";

export interface GroupInvite {
  id: string;
  groupId: string;
  cloudId: string;
  role: GroupRole;
}

let nextInviteId = 1;
function makeInviteId() {
  return `inv-${Date.now()}-${nextInviteId++}`;
}

/* One sample invite waiting for "you" so the Invites tab isn't empty
   on first load. */
export const GROUP_INVITES: GroupInvite[] = [
  { id: "inv-seed-1", groupId: "grp-devops", cloudId: CURRENT_CLOUD_ID, role: "Member" },
];

export function inviteToGroup(groupId: string, cloudId: string, role: GroupRole) {
  const invite: GroupInvite = { id: makeInviteId(), groupId, cloudId, role };
  GROUP_INVITES.push(invite);
  return invite;
}

export function acceptInvite(inviteId: string) {
  const invite = GROUP_INVITES.find((i) => i.id === inviteId);
  if (!invite) return;
  addGroupMember(invite.groupId, invite.cloudId, invite.role);
  const i = GROUP_INVITES.findIndex((inv) => inv.id === inviteId);
  if (i !== -1) GROUP_INVITES.splice(i, 1);
}

export function declineInvite(inviteId: string) {
  const i = GROUP_INVITES.findIndex((inv) => inv.id === inviteId);
  if (i !== -1) GROUP_INVITES.splice(i, 1);
}
