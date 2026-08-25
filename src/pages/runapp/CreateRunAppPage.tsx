import { useState } from "react";
import { ChevronLeft, Plus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../../components/atoms";
import { RESOURCE_PRESETS, RunAppEditorDialog, RunAppUploadDialog } from "./RunAppDialogs";
import { STACK_ROWS } from "./RunAppComponents";

/* ------------------------------------------------------------------ *
 * Create Run App — full page, matching Figma's "RunApp Create" screen
 * (fileKey EvjrpwXJD9JlayN1Ij5I4J, node 456:14055 / frame 198:12353)
 * rather than a small modal: a stack's shared environment plus one or
 * more service blocks (name, domain, registry auth, entrypoint,
 * dependency) defined together in one flow, built from this app's own
 * shadcn primitives (Card, Tabs, Checkbox, Select) instead of copying
 * the Figma markup verbatim.
 *
 * The Figma frame only shows the "Service Info" tab's fields — the
 * Environment and Policy & Resource tab panels weren't expanded in the
 * source, so their content here (per-service env vars; resource size +
 * replica) is a reasonable fill-in that matches what ServiceDetailPage
 * already tracks for a service, not a pixel-sourced spec.
 * ------------------------------------------------------------------ */

let serviceSeq = 0;
function nextServiceId() {
  serviceSeq += 1;
  return `svc-draft-${serviceSeq}`;
}

interface EnvRow {
  key: string;
  value: string;
}

interface ServiceDraft {
  id: string;
  name: string;
  hostName: string;
  containerPort: string;
  registryAuth: "public" | "private";
  registryCredential: string;
  entrypoint: string;
  dependOn: string;
  env: EnvRow[];
  resourcePreset: string;
  replica: string;
}

function makeServiceDraft(): ServiceDraft {
  return {
    id: nextServiceId(),
    name: "",
    hostName: "",
    containerPort: "",
    registryAuth: "public",
    registryCredential: "Default",
    entrypoint: "",
    dependOn: "",
    env: [],
    resourcePreset: RESOURCE_PRESETS[0].label,
    replica: "1",
  };
}

/* One Key/Value input row, shared by the stack's Shared Environment
   section and each service's own Environment tab. */
function EnvRowInputs({
  rows,
  onChange,
}: {
  rows: EnvRow[];
  onChange: (rows: EnvRow[]) => void;
}) {
  function update(i: number, patch: Partial<EnvRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  return (
    <div className="w-full space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="Key"
            className="h-9"
          />
          <Input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Value"
            className="h-9"
          />
          <button
            type="button"
            aria-label="Remove row"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="flex items-center gap-1">
          <Input disabled placeholder="Key" className="h-9" />
          <Input disabled placeholder="Value" className="h-9" />
        </div>
      )}
    </div>
  );
}

function ServiceBlock({
  service,
  otherServiceNames,
  onChange,
  onRemove,
  removable,
}: {
  service: ServiceDraft;
  otherServiceNames: string[];
  onChange: (next: ServiceDraft) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  function set<K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) {
    onChange({ ...service, [key]: value });
  }

  const preset =
    RESOURCE_PRESETS.find((p) => p.label === service.resourcePreset) ?? RESOURCE_PRESETS[0];

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Service Name</CardTitle>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Remove
          </button>
        )}
      </div>
      <Input
        value={service.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="Service Name"
        className="h-9"
      />

      <Tabs defaultValue="info">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          <TabsTrigger value="info" className={PILL_TAB_TRIGGER_CLASS}>
            Service Info
          </TabsTrigger>
          <TabsTrigger value="environment" className={PILL_TAB_TRIGGER_CLASS}>
            Environment
          </TabsTrigger>
          <TabsTrigger value="policy" className={PILL_TAB_TRIGGER_CLASS}>
            Policy & Resource
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Domain Name</p>
            <div className="mt-2 flex items-center gap-1">
              <Input
                value={service.hostName}
                onChange={(e) => set("hostName", e.target.value)}
                placeholder="Host Name"
                className="h-9"
              />
              <Input
                value={service.containerPort}
                onChange={(e) => set("containerPort", e.target.value)}
                placeholder="Container Port"
                className="h-9"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Registry Authentication
            </p>
            <div className="mt-2 flex items-center gap-4">
              <Label className="flex items-center gap-2 font-normal text-zinc-900 dark:text-zinc-100">
                <Checkbox
                  checked={service.registryAuth === "public"}
                  onCheckedChange={(checked) => checked && set("registryAuth", "public")}
                />
                Public
              </Label>
              <Label className="flex items-center gap-2 font-normal text-zinc-900 dark:text-zinc-100">
                <Checkbox
                  checked={service.registryAuth === "private"}
                  onCheckedChange={(checked) => checked && set("registryAuth", "private")}
                />
                Private
              </Label>
            </div>
            <Select
              value={service.registryCredential}
              onValueChange={(v) => set("registryCredential", v)}
              disabled={service.registryAuth === "public"}
            >
              <SelectTrigger className="mt-2 h-8 w-full disabled:opacity-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="Docker Hub">Docker Hub</SelectItem>
                <SelectItem value="Private Registry">Private Registry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Entrypoint</p>
            <Input
              value={service.entrypoint}
              onChange={(e) => set("entrypoint", e.target.value)}
              placeholder="Container Port"
              className="mt-2 h-9"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Depend On</p>
            <Select value={service.dependOn} onValueChange={(v) => set("dependOn", v)}>
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                {otherServiceNames.length > 0 ? (
                  otherServiceNames.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No other services yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="environment" className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Environment Variables
            </p>
            <button
              type="button"
              onClick={() => set("env", [...service.env, { key: "", value: "" }])}
              className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
            >
              Add
            </button>
          </div>
          <div className="mt-2">
            <EnvRowInputs rows={service.env} onChange={(rows) => set("env", rows)} />
          </div>
        </TabsContent>

        <TabsContent value="policy" className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Resource</p>
              <Select value={service.resourcePreset} onValueChange={(v) => set("resourcePreset", v)}>
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
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Replica</p>
              <Input
                value={service.replica}
                onChange={(e) => set("replica", e.target.value)}
                className="mt-2 h-9"
              />
            </div>
          </div>
          <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400">
            {preset.cpu} / {preset.memory} per replica.
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export function CreateRunAppPage({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: (stack: (typeof STACK_ROWS)[number]) => void;
}) {
  const [stackName, setStackName] = useState("");
  const [sharedEnv, setSharedEnv] = useState<EnvRow[]>([]);
  const [services, setServices] = useState<ServiceDraft[]>([makeServiceDraft()]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const trimmedName = stackName.trim();
  const valid = Boolean(trimmedName) && services.every((s) => s.name.trim());

  function updateService(id: string, next: ServiceDraft) {
    setServices((prev) => prev.map((s) => (s.id === id ? next : s)));
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function submit() {
    if (!valid) return;
    onCreate({
      id: `stk-${Date.now()}`,
      name: trimmedName,
      status: { label: "Deploying", tone: "blue" },
      serviceCount: services.length,
    });
  }

  // Round-trips the current form as JSON, so opening the editor starts
  // from what's already filled in rather than a blank template.
  const configJson = JSON.stringify(
    {
      stackName,
      sharedEnv,
      services: services.map((s) => ({ name: s.name, hostName: s.hostName, containerPort: s.containerPort })),
    },
    null,
    2
  );

  function applyEditorJson(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.stackName === "string") setStackName(parsed.stackName);
      if (Array.isArray(parsed.sharedEnv)) setSharedEnv(parsed.sharedEnv);
      if (Array.isArray(parsed.services) && parsed.services.length > 0) {
        setServices(
          parsed.services.map((s: any) => ({
            ...makeServiceDraft(),
            name: s.name ?? "",
            hostName: s.hostName ?? "",
            containerPort: s.containerPort ?? "",
          }))
        );
      }
    } catch {
      // RunAppEditorDialog already blocks Apply while the JSON is invalid.
    }
  }

  function applyUpload(file: File) {
    // No parser for compose/config files yet — at least seed the stack
    // name from the filename so the upload visibly did something.
    if (!stackName.trim()) {
      setStackName(file.name.replace(/\.(ya?ml|json)$/i, ""));
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to RunApp List
      </button>

      <h1 className="mt-5 text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Create Run App
      </h1>

      <div className="mt-5 max-w-[640px] space-y-5">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Stack Name</p>
          <Input
            value={stackName}
            onChange={(e) => setStackName(e.target.value)}
            placeholder="my-stack"
            className="mt-2 h-9"
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Shared Environment
            </p>
            <button
              type="button"
              onClick={() => setSharedEnv((prev) => [...prev, { key: "", value: "" }])}
              className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
            >
              Add
            </button>
          </div>
          <div className="mt-2">
            <EnvRowInputs rows={sharedEnv} onChange={setSharedEnv} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-8 gap-1.5 text-sm">
              Upload Env
              <Upload className="h-4 w-4" />
            </Button>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Download sample upload file here.{" "}
              <button type="button" className="text-[#1C75BC] underline dark:text-[#6FA8D8]">
                Download
              </button>
            </p>
          </div>
        </div>

        {services.map((service) => (
          <ServiceBlock
            key={service.id}
            service={service}
            otherServiceNames={services
              .filter((s) => s.id !== service.id && s.name.trim())
              .map((s) => s.name.trim())}
            onChange={(next) => updateService(service.id, next)}
            onRemove={() => removeService(service.id)}
            removable={services.length > 1}
          />
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setServices((prev) => [...prev, makeServiceDraft()])}
            className="h-8 gap-1.5 text-sm"
          >
            Add Service
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditorOpen(true)}
            className="h-8 gap-1.5 text-sm"
          >
            Editor
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="h-8 gap-1.5 text-sm"
          >
            Upload
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack} className="h-9 text-sm">
            Cancel
          </Button>
          <Button variant="brand" disabled={!valid} onClick={submit} className="h-9 text-sm">
            Create
          </Button>
        </div>
      </div>

      <RunAppEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        value={configJson}
        onSave={applyEditorJson}
      />
      <RunAppUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUpload={applyUpload} />
    </div>
  );
}
