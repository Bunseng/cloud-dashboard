import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Upload } from "@/components/animate-ui/icons/upload";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { slugify } from "@/lib/utils";

import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../../components/atoms";
import { RegistryAuthField } from "./RegistryDialogs";

/* ------------------------------------------------------------------ *
 * Run App create/edit dialogs. Creating a whole new stack now happens
 * on its own full page (CreateRunAppPage, matching Figma's "RunApp
 * Create" screen, node 456:14055) instead of a modal — these two
 * remain for managing services within a stack that already exists.
 *
 * Both Create and Edit share the same 3-tab shape as the service
 * detail page (Service Info: Overview/Connection/Controls,
 * Environment, Policy & Resource) so a service reads the same way
 * everywhere it's touched.
 * ------------------------------------------------------------------ */

export const RESOURCE_PRESETS = [
  { label: "1 Core / 1 GB", cpu: "1 Core", memory: "1 GB" },
  { label: "2 Core / 2 GB", cpu: "2 Core", memory: "2 GB" },
  { label: "2 Core / 4 GB", cpu: "2 Core", memory: "4 GB" },
];

export interface EnvRow {
  key: string;
  value: string;
}

/* Key/Value rows shared by Create and Edit's Environment tab. */
function EnvEditor({ rows, onChange }: { rows: EnvRow[]; onChange: (rows: EnvRow[]) => void }) {
  function update(i: number, patch: Partial<EnvRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="Key"
            className="h-9 font-mono text-[13px]"
          />
          <Input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Value"
            className="h-9 font-mono text-[13px]"
          />
          <button
            type="button"
            aria-label="Remove row"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-900"
          >
            <X className="h-3.5 w-3.5" animateOnHover animateOnTap />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
        className="h-8 gap-1.5 text-sm"
      >
        <Plus className="h-3.5 w-3.5" animateOnHover animateOnTap />
        Add Variable
      </Button>
    </div>
  );
}

export interface NewServiceFields {
  name: string;
  image: string;
  hostName: string;
  repository: string;
  autoStart: boolean;
  registryAuth: "public" | "private";
  registryId: string;
  env: EnvRow[];
  resourcePreset: (typeof RESOURCE_PRESETS)[number];
  replica: string;
}

/* Creating a service opens as a right-side Drawer — same Sheet shell
   and same 3-tab shape as the service detail page: Service Info
   (Overview/Connection/Controls), Environment, Policy & Resource.
   "Controls" here is just the desired starting state, since the
   service doesn't exist yet to actually start/stop. */
export function CreateServiceDrawer({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (fields: NewServiceFields) => void;
}) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [hostName, setHostName] = useState("");
  // Host Name follows Service Name (as a slug) until edited directly.
  const [hostNameEdited, setHostNameEdited] = useState(false);
  const [repository, setRepository] = useState("");
  const [autoStart, setAutoStart] = useState(true);
  const [registryAuth, setRegistryAuth] = useState<"public" | "private">("public");
  const [registryId, setRegistryId] = useState("");
  const [env, setEnv] = useState<EnvRow[]>([]);
  const [presetLabel, setPresetLabel] = useState(RESOURCE_PRESETS[0].label);
  const [replica, setReplica] = useState("1");

  const trimmedName = name.trim();
  const trimmedImage = image.trim();
  const valid = Boolean(trimmedName && trimmedImage);

  function reset() {
    setName("");
    setImage("");
    setHostName("");
    setHostNameEdited(false);
    setRepository("");
    setAutoStart(true);
    setRegistryAuth("public");
    setRegistryId("");
    setEnv([]);
    setPresetLabel(RESOURCE_PRESETS[0].label);
    setReplica("1");
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    const preset = RESOURCE_PRESETS.find((p) => p.label === presetLabel) ?? RESOURCE_PRESETS[0];
    onCreate({
      name: trimmedName,
      image: trimmedImage,
      hostName: hostName.trim(),
      repository: repository.trim(),
      autoStart,
      registryAuth,
      registryId,
      env: env.filter((r) => r.key.trim()),
      resourcePreset: preset,
      replica: replica.trim() || "1",
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Service</SheetTitle>
          <SheetDescription>Add a container to this stack.</SheetDescription>
        </SheetHeader>

        <form id="create-service-form" onSubmit={submit} className="mt-3 flex-1 overflow-y-auto">
          <Tabs defaultValue="info">
            <TabsList className={PILL_TABS_LIST_CLASS}>
              <TabsTrigger value="info" className={PILL_TAB_TRIGGER_CLASS}>
                Service Info
              </TabsTrigger>
              <TabsTrigger value="env" className={PILL_TAB_TRIGGER_CLASS}>
                Environment
              </TabsTrigger>
              <TabsTrigger value="policy" className={PILL_TAB_TRIGGER_CLASS}>
                Policy & Resource
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Overview</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="new-service-name" className="text-zinc-900 dark:text-zinc-100">
                      Service Name<span className="ml-0.5 text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-service-name"
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        const next = e.target.value;
                        setName(next);
                        if (!hostNameEdited) {
                          const slug = slugify(next);
                          setHostName(slug ? `${slug}.cloudplus.app` : "");
                        }
                      }}
                      placeholder="web"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-service-image" className="text-zinc-900 dark:text-zinc-100">
                      Container Image<span className="ml-0.5 text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-service-image"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="example/image:latest"
                      className="mt-2 font-mono text-[13px]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Connection</p>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Where this service will be reachable from.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="new-service-host" className="text-zinc-900 dark:text-zinc-100">
                      Host Name
                    </Label>
                    <Input
                      id="new-service-host"
                      value={hostName}
                      onChange={(e) => {
                        setHostName(e.target.value);
                        setHostNameEdited(true);
                      }}
                      placeholder="web-frontend.cloudplus.app"
                      className="mt-2 font-mono text-[13px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-service-repo" className="text-zinc-900 dark:text-zinc-100">
                      Repository
                    </Label>
                    <Input
                      id="new-service-repo"
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      placeholder="https://github.com/cloudplus/web-frontend"
                      className="mt-2 font-mono text-[13px]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <RegistryAuthField
                  isPrivate={registryAuth === "private"}
                  onIsPrivateChange={(isPrivate) => setRegistryAuth(isPrivate ? "private" : "public")}
                  registryId={registryId}
                  onRegistryIdChange={setRegistryId}
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Controls</p>
                  <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                    Start this service as soon as it's created.
                  </p>
                </div>
                <Label className="flex items-center gap-2 font-normal text-zinc-900 dark:text-zinc-100">
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[#1C75BC] focus-visible:outline-none dark:border-zinc-700"
                  />
                  Start automatically
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="env" className="mt-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Environment Variables
                </p>
                <div className="mt-3">
                  <EnvEditor rows={env} onChange={setEnv} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policy" className="mt-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Resource</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-service-replica" className="text-zinc-900 dark:text-zinc-100">
                      Replica
                    </Label>
                    <Input
                      id="new-service-replica"
                      value={replica}
                      onChange={(e) => setReplica(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-900 dark:text-zinc-100">Resource Size</Label>
                    <Select value={presetLabel} onValueChange={setPresetLabel}>
                      <SelectTrigger className="mt-2 h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_PRESETS.map((p) => (
                          <SelectItem key={p.label} value={p.label}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline" className="h-9 w-[164px] text-sm">
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="create-service-form"
            variant="brand"
            disabled={!valid}
            className="h-9 w-[164px] text-sm"
          >
            Create Service
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export interface EditableServiceInfo {
  containerImage: string;
  hostName: string;
  repository: string;
  replica: string;
  resource: { cpu: string; memory: string };
  env: EnvRow[];
  registryAuth: "public" | "private";
  registryId: string;
}

/* Editing a service's info opens as a right-side Drawer, same 3-tab
   shape as the service detail page it's launched from (Service Info:
   Overview/Connection/Controls, Environment, Policy & Resource) —
   Controls here operates the same running state the page's own
   Start/Stop/Restart buttons do, not a separate copy of it. */
export function EditServiceInfoDrawer({
  open,
  onOpenChange,
  serviceName,
  value,
  running,
  onRunningChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  value: EditableServiceInfo;
  running: boolean;
  onRunningChange: (running: boolean) => void;
  onSave: (next: EditableServiceInfo) => void;
}) {
  const [image, setImage] = useState(value.containerImage);
  const [hostName, setHostName] = useState(value.hostName);
  const [repository, setRepository] = useState(value.repository);
  const [replica, setReplica] = useState(value.replica);
  const [env, setEnv] = useState<EnvRow[]>(value.env);
  const [registryAuth, setRegistryAuth] = useState(value.registryAuth);
  const [registryId, setRegistryId] = useState(value.registryId);
  const [presetLabel, setPresetLabel] = useState(
    RESOURCE_PRESETS.find((p) => p.cpu === value.resource.cpu && p.memory === value.resource.memory)
      ?.label ?? RESOURCE_PRESETS[0].label
  );

  // Re-seed the draft from the current value each time the drawer opens.
  useEffect(() => {
    if (open) {
      setImage(value.containerImage);
      setHostName(value.hostName);
      setRepository(value.repository);
      setReplica(value.replica);
      setEnv(value.env);
      setRegistryAuth(value.registryAuth);
      setRegistryId(value.registryId);
      setPresetLabel(
        RESOURCE_PRESETS.find((p) => p.cpu === value.resource.cpu && p.memory === value.resource.memory)
          ?.label ?? RESOURCE_PRESETS[0].label
      );
    }
  }, [open, value]);

  const trimmedImage = image.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Service Info</SheetTitle>
          <SheetDescription>Update {serviceName || "this service"}'s configuration.</SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex-1 overflow-y-auto">
          <Tabs defaultValue="info">
            <TabsList className={PILL_TABS_LIST_CLASS}>
              <TabsTrigger value="info" className={PILL_TAB_TRIGGER_CLASS}>
                Service Info
              </TabsTrigger>
              <TabsTrigger value="env" className={PILL_TAB_TRIGGER_CLASS}>
                Environment
              </TabsTrigger>
              <TabsTrigger value="policy" className={PILL_TAB_TRIGGER_CLASS}>
                Policy & Resource
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Overview</p>
                <div className="mt-3">
                  <Label htmlFor="edit-service-image" className="text-zinc-900 dark:text-zinc-100">
                    Container Image
                  </Label>
                  <Input
                    id="edit-service-image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="example/image:latest"
                    className="mt-2 font-mono text-[13px]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Connection</p>
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                  Where this service is reachable from.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="edit-service-host" className="text-zinc-900 dark:text-zinc-100">
                      Host Name
                    </Label>
                    <Input
                      id="edit-service-host"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      className="mt-2 font-mono text-[13px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-service-repo" className="text-zinc-900 dark:text-zinc-100">
                      Repository
                    </Label>
                    <Input
                      id="edit-service-repo"
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      className="mt-2 font-mono text-[13px]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <RegistryAuthField
                  isPrivate={registryAuth === "private"}
                  onIsPrivateChange={(isPrivate) => setRegistryAuth(isPrivate ? "private" : "public")}
                  registryId={registryId}
                  onRegistryIdChange={setRegistryId}
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Controls</p>
                  <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                    Start, stop, or restart this service.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={running}
                    onClick={() => onRunningChange(true)}
                    className="h-8 gap-1.5 text-sm"
                  >
                    Start
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={!running}
                    onClick={() => onRunningChange(false)}
                    className="h-8 gap-1.5 text-sm"
                  >
                    Stop
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="env" className="mt-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Environment Variables
                </p>
                <div className="mt-3">
                  <EnvEditor rows={env} onChange={setEnv} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policy" className="mt-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Resource</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-service-replica" className="text-zinc-900 dark:text-zinc-100">
                      Replica
                    </Label>
                    <Input
                      id="edit-service-replica"
                      value={replica}
                      onChange={(e) => setReplica(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-900 dark:text-zinc-100">Resource Size</Label>
                    <Select value={presetLabel} onValueChange={setPresetLabel}>
                      <SelectTrigger className="mt-2 h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_PRESETS.map((p) => (
                          <SelectItem key={p.label} value={p.label}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" className="h-9 w-[164px] text-sm">
              Cancel
            </Button>
          </SheetClose>
          <Button
            variant="brand"
            disabled={!trimmedImage}
            onClick={() => {
              const preset = RESOURCE_PRESETS.find((p) => p.label === presetLabel) ?? RESOURCE_PRESETS[0];
              onSave({
                containerImage: trimmedImage,
                hostName: hostName.trim(),
                repository: repository.trim(),
                replica: replica.trim(),
                resource: { cpu: preset.cpu, memory: preset.memory },
                env: env.filter((r) => r.key.trim()),
                registryAuth,
                registryId,
              });
              onOpenChange(false);
            }}
            className="h-9 w-[164px] text-sm"
          >
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const DEFAULT_RUNAPP_CONFIG = `{
  "stackName": "",
  "sharedEnv": [],
  "services": []
}`;

/* Raw JSON editor for the whole Create Run App form — same "edit the
   underlying document" shape as Storage's Edit Bucket Policy dialog,
   for anyone who'd rather write the stack config directly than click
   through every field. */
export function RunAppEditorDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value ?? DEFAULT_RUNAPP_CONFIG);

  useEffect(() => {
    if (open) setDraft(value ?? DEFAULT_RUNAPP_CONFIG);
  }, [open, value]);

  let error: string | null = null;
  try {
    JSON.parse(draft);
  } catch {
    error = "Not valid JSON.";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Edit as JSON</DialogTitle>
          <DialogDescription>
            Define the stack's name, shared environment, and services directly.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          rows={14}
          className="font-mono text-[13px]"
        />
        {error && <p className="-mt-2 text-[13px] text-red-500">{error}</p>}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="brand"
            disabled={Boolean(error)}
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
            className="h-9 text-sm"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Upload a compose/config file instead of filling the form by hand —
   same drag-and-drop shell as Storage's Upload File dialog. */
export function RunAppUploadDialog({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function pickFile(list: FileList | null) {
    if (list && list[0]) setFile(list[0]);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFile(null);
          setDragging(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Upload Config</DialogTitle>
          <DialogDescription>
            Upload a docker-compose or stack config file to fill this form.
          </DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(e: DragEvent<HTMLLabelElement>) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e: DragEvent<HTMLLabelElement>) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files);
          }}
          className={
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center motion-safe:transition-colors " +
            (dragging
              ? "border-[#1C75BC] bg-[#EFF6FF] dark:bg-zinc-900"
              : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900")
          }
        >
          <input
            type="file"
            accept=".yml,.yaml,.json"
            className="sr-only"
            onChange={(e) => {
              pickFile(e.target.files);
              e.target.value = "";
            }}
          />
          <Upload className="h-8 w-8 text-zinc-400" strokeWidth={1.5} animateOnView />
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Drag & drop a file here
          </p>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            or <span className="text-[#1C75BC] dark:text-[#6FA8D8]">browse</span> from your computer
            {" "}(.yml, .yaml, .json)
          </p>
        </label>

        {file && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-900 dark:text-zinc-100">
              {file.name}
            </span>
            <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {(file.size / 1024).toFixed(2)} kb
            </span>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => setFile(null)}
              className="shrink-0 text-zinc-400 hover:text-red-500"
            >
              <X className="h-4 w-4" animateOnHover animateOnTap />
            </button>
          </div>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="brand"
            disabled={!file}
            onClick={() => {
              if (file) onUpload(file);
              onOpenChange(false);
            }}
            className="h-9 text-sm"
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
