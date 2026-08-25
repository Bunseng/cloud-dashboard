import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { Plus, Upload, X } from "lucide-react";

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

/* ------------------------------------------------------------------ *
 * Storage → bucket detail. "File" lists the bucket's objects; "Setting"
 * holds privacy, bucket policy and CORS. All values are local state —
 * wire them to the API (and real validation) once it exists.
 * ------------------------------------------------------------------ */

export const ALLOWED_METHODS = ["GET", "PUT", "POST", "DELETE", "HEAD"];

/* Creating a bucket asks for nothing but its name — everything else is
   configured afterwards from the bucket's Setting tab. */
export function CreateBucketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed) return;
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create Bucket</DialogTitle>
          <DialogDescription>
            Give your bucket a name. You can set privacy, policy and CORS after
            it's created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="new-bucket-name" className="text-zinc-900 dark:text-zinc-100">
              Bucket Name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="new-bucket-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-bucket"
              className="mt-2"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9 text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={!trimmed} className="h-9 text-sm">
              Create Bucket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UploadFileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFiles([]);
          setDragging(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Add one or more files to this bucket.
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
            addFiles(e.dataTransfer.files);
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
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Upload className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Drag & drop files here
          </p>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            or <span className="text-[#1C75BC] dark:text-[#6FA8D8]">browse</span> from your computer
          </p>
        </label>

        {files.length > 0 && (
          <ul className="max-h-[168px] space-y-2 overflow-y-auto">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-900 dark:text-zinc-100">
                  {file.name}
                </span>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {(file.size / 1024).toFixed(2)} kb
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-zinc-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="brand" disabled={files.length === 0} className="h-9 text-sm">
            Upload{files.length > 0 ? ` ${files.length} file${files.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* A list-of-strings field — used for CORS origins and allowed headers,
   both of which accept several values and are required. */
export function MultiValueField({
  label,
  placeholder,
  values,
  onChange,
  required,
}: {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const isEmpty = values.length === 0;

  function commit() {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div>
      <Label className="text-zinc-900 dark:text-zinc-100">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>

      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={commit}
          disabled={!draft.trim()}
          className="h-9 shrink-0 gap-1 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {values.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-3 pr-1.5 text-[13px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="rounded-full p-0.5 text-zinc-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {required && isEmpty && (
        <p className="mt-2 text-[13px] text-red-500">
          At least one value is required.
        </p>
      )}
    </div>
  );
}

/* The policy is read-only on the page; editing happens here so a stray
   keystroke can't silently change access rules. Saving is blocked while
   the draft isn't valid JSON. */
export function EditPolicyDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Re-seed the draft each time the dialog is opened, so it always starts
  // from the saved policy rather than a stale edit.
  useEffect(() => {
    if (open) setDraft(value);
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
          <DialogTitle>Edit Bucket Policy</DialogTitle>
          <DialogDescription>
            A JSON document describing who can access this bucket.
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
            Save Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
