import { useEffect, useState } from "react";

import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { Eye } from "@/components/animate-ui/icons/eye";
import { EyeOff } from "@/components/animate-ui/icons/eye-off";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  REGISTRY_FIELDS,
  REGISTRY_PROVIDERS,
  SAVED_REGISTRIES,
  addSavedRegistry,
  type RegistryField,
  type SavedRegistry,
} from "../../data/registries";

/* ------------------------------------------------------------------ *
 * "Create Registry" — mirrors Figma (fileKey EvjrpwXJD9JlayN1Ij5I4J,
 * node 602:11514): pick a provider, fill that provider's field set,
 * then a short "Successfully" confirmation before it's usable as
 * Registry Authentication. Provider-specific fields come from
 * REGISTRY_FIELDS so this dialog itself has no per-provider branching.
 * ------------------------------------------------------------------ */

function ProviderBadge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {label.charAt(0)}
    </span>
  );
}

function RegistryFieldInput({
  field,
  value,
  onChange,
}: {
  field: RegistryField;
  value: string;
  onChange: (value: string) => void;
}) {
  const [reveal, setReveal] = useState(false);
  const id = `registry-field-${field.key}`;

  if (field.type === "select") {
    return (
      <div>
        <Label htmlFor={id} className="text-zinc-900 dark:text-zinc-100">
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Select value={value || field.options?.[0]} onValueChange={onChange}>
          <SelectTrigger id={id} className="mt-2 h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id} className="text-zinc-900 dark:text-zinc-100">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <div className="relative mt-2">
        <Input
          id={id}
          type={field.type === "password" && !reveal ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={field.type === "password" ? "pr-9 font-mono text-[13px]" : "font-mono text-[13px]"}
        />
        {field.type === "password" && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide value" : "Show value"}
            className="absolute inset-y-0 right-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {reveal ? (
              <EyeOff className="h-4 w-4" animateOnHover animateOnTap />
            ) : (
              <Eye className="h-4 w-4" animateOnHover animateOnTap />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function AddRegistryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (registry: SavedRegistry) => void;
}) {
  const [providerId, setProviderId] = useState(REGISTRY_PROVIDERS[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<SavedRegistry | null>(null);

  useEffect(() => {
    if (open) {
      setProviderId(REGISTRY_PROVIDERS[0].id);
      setValues({});
      setCreated(null);
    }
  }, [open]);

  const provider = REGISTRY_PROVIDERS.find((p) => p.id === providerId) ?? REGISTRY_PROVIDERS[0];
  const fields = REGISTRY_FIELDS[providerId] ?? [];
  const valid = fields.every((f) => {
    if (!f.required) return true;
    // A select always shows its first option as the default, so it's
    // "filled" even before the user explicitly opens it.
    if (f.type === "select") return Boolean((values[f.key] ?? f.options?.[0])?.trim());
    return Boolean(values[f.key]?.trim());
  });

  function submit() {
    const identity = fields.find((f) => f.key === "name" || f.key === "username" || f.key === "registryUrl");
    const registry: SavedRegistry = {
      id: `reg-${providerId}-${Date.now()}`,
      provider: provider.label,
      name: values.name?.trim() || values.username?.trim() || provider.label,
      summary: identity ? values[identity.key]?.trim() || provider.label : provider.label,
    };
    addSavedRegistry(registry);
    setCreated(registry);
  }

  if (created) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Successfully</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CircleCheck className="h-12 w-12 text-emerald-500" animate />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You successfully created a registry. You can now add{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Registry Authentication
              </span>{" "}
              to your Run App.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="brand"
              className="h-9 w-full text-sm"
              onClick={() => {
                onCreated(created);
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create Registry</DialogTitle>
          <DialogDescription>
            Connect a container registry so private images can be pulled into your services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Registry Provider</Label>
            <Select
              value={providerId}
              onValueChange={(next) => {
                setProviderId(next);
                setValues({});
              }}
            >
              <SelectTrigger className="mt-2 h-9 w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <ProviderBadge color={provider.color} label={provider.label} />
                    {provider.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REGISTRY_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <ProviderBadge color={p.color} label={p.label} />
                      {p.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fields.map((field) => (
            <RegistryFieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="brand"
            disabled={!valid}
            onClick={submit}
            className="h-9 w-full text-sm"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * Registry Authentication — Public/Private picker shared by Create Run
 * App, and a stack's Create/Edit Service. Selecting Private always
 * offers "+ Add Registry" so a first-time user isn't stuck with an
 * empty list.
 * ------------------------------------------------------------------ */

const ADD_REGISTRY_VALUE = "__add_registry__";

export function RegistryAuthField({
  isPrivate,
  onIsPrivateChange,
  registryId,
  onRegistryIdChange,
}: {
  isPrivate: boolean;
  onIsPrivateChange: (isPrivate: boolean) => void;
  registryId: string;
  onRegistryIdChange: (registryId: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  // SAVED_REGISTRIES is a shared mutable array (not React state), so
  // mirror it locally and refresh whenever a registry is added here.
  const [registries, setRegistries] = useState(SAVED_REGISTRIES);

  return (
    <div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Registry Authentication
      </p>
      <RadioGroup
        value={isPrivate ? "private" : "public"}
        onValueChange={(v) => onIsPrivateChange(v === "private")}
        className="mt-2 flex items-center gap-4"
      >
        <Label className="flex items-center gap-2 font-normal text-zinc-900 dark:text-zinc-100">
          <RadioGroupItem value="public" />
          Public
        </Label>
        <Label className="flex items-center gap-2 font-normal text-zinc-900 dark:text-zinc-100">
          <RadioGroupItem value="private" />
          Private
        </Label>
      </RadioGroup>

      <Select
        value={registryId}
        onValueChange={(v) => {
          if (v === ADD_REGISTRY_VALUE) {
            setAddOpen(true);
            return;
          }
          onRegistryIdChange(v);
        }}
        disabled={!isPrivate}
      >
        <SelectTrigger className="mt-2 h-9 w-full disabled:opacity-60">
          <SelectValue placeholder="Select a registry" />
        </SelectTrigger>
        <SelectContent>
          {registries.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name} · {r.provider}
            </SelectItem>
          ))}
          {registries.length > 0 && <SelectSeparator />}
          <SelectItem value={ADD_REGISTRY_VALUE} className="text-[#1C75BC] dark:text-[#6FA8D8]">
            <span className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" animateOnHover animateOnTap />
              Add Registry
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <AddRegistryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(registry) => {
          setRegistries([...SAVED_REGISTRIES]);
          onRegistryIdChange(registry.id);
        }}
      />
    </div>
  );
}
