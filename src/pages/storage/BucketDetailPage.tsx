import { useState } from "react";
import { ArrowUpRight } from "@/components/animate-ui/icons/arrow-up-right";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Info } from "@/components/animate-ui/icons/info";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PILL_TABS_LIST_CLASS, PILL_TAB_TRIGGER_CLASS } from "../../components/atoms";
import { ALLOWED_METHODS, EditPolicyDialog, MultiValueField } from "./BucketDialogs";

export interface BucketFileRow {
  name: string;
  type: string;
  size: string;
  modified: string;
}

export const BUCKET_FILE_ROWS: BucketFileRow[] = [
  {
    name: "streamingbucket",
    type: "Image/jpeg",
    size: "777.65 kb",
    modified: "15 Jul 2026 14:52:20",
  },
];

const DEFAULT_BUCKET_POLICY = `{
  "Version": "2012-10-17",
  "Statement": []
}`;

function BucketSettingTab() {
  const [isPublic, setIsPublic] = useState(false);
  const [policy, setPolicy] = useState(DEFAULT_BUCKET_POLICY);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [origins, setOrigins] = useState<string[]>(["https://example.com"]);
  const [maxAge, setMaxAge] = useState("3600");
  const [methods, setMethods] = useState<string[]>(["GET"]);
  const [headers, setHeaders] = useState<string[]>(["*"]);

  let policyError: string | null = null;
  try {
    JSON.parse(policy);
  } catch {
    policyError = "Not valid JSON.";
  }

  function toggleMethod(method: string) {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  }

  return (
    <div className="mt-6 max-w-[720px] space-y-6">
      {/* Bucket privacy */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Bucket Privacy</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              {isPublic
                ? "Anyone with the URL can read objects in this bucket."
                : "Only requests signed with your keys can read objects."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <span
              className={
                "text-sm " +
                (isPublic
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "font-medium text-zinc-900 dark:text-zinc-100")
              }
            >
              Private
            </span>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              aria-label="Bucket privacy"
            />
            <span
              className={
                "text-sm " +
                (isPublic
                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400")
              }
            >
              Public
            </span>
          </div>
        </div>
      </Card>

      {/* Bucket policy */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Bucket Policy</CardTitle>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              A JSON document describing who can access this bucket.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setPolicyOpen(true)}
            className="h-9 shrink-0 gap-1.5 text-sm"
          >
            <Pencil className="h-3.5 w-3.5" animateOnHover animateOnTap />
            Edit
          </Button>
        </div>

        <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-[13px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
          {policy}
        </pre>
        {policyError && <p className="mt-2 text-[13px] text-red-500">{policyError}</p>}
      </Card>

      <EditPolicyDialog
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        value={policy}
        onSave={setPolicy}
      />

      {/* CORS */}
      <Card>
        <CardTitle>CORS Configuration</CardTitle>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          Control which sites may call this bucket from the browser.
        </p>

        <div className="mt-5 space-y-5">
          <MultiValueField
            label="Origin"
            placeholder="https://example.com"
            values={origins}
            onChange={setOrigins}
            required
          />

          <div>
            <Label htmlFor="cors-max-age" className="text-zinc-900 dark:text-zinc-100">
              Access Control Max Age
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="cors-max-age"
                type="number"
                min="0"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="w-[180px]"
              />
              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">seconds</span>
            </div>
          </div>

          <div>
            <Label className="text-zinc-900 dark:text-zinc-100">Allowed Method</Label>
            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2.5">
              {ALLOWED_METHODS.map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <Checkbox
                    checked={methods.includes(method)}
                    onCheckedChange={() => toggleMethod(method)}
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>

          <MultiValueField
            label="Allowed Header"
            placeholder="Content-Type"
            values={headers}
            onChange={setHeaders}
            required
          />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-9 text-sm">
          Cancel
        </Button>
        <Button
          variant="brand"
          disabled={Boolean(policyError) || origins.length === 0 || headers.length === 0}
          className="h-9 text-sm"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function BucketFileTab({ bucketName }: { bucketName: string }) {
  function openStorageConsole() {
    // Mock storage console — a real backend would issue a short-lived
    // session URL for this bucket; uploading isn't supported from this
    // dashboard yet, so this is the only way in to add files.
    window.open(
      `https://console.cloudplus.test/storage/${encodeURIComponent(bucketName)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="mt-5">
      <div className="flex items-start gap-3 rounded-lg border border-[#1C75BC]/20 bg-[#EFF6FF] p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Uploading isn't available from this dashboard yet
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Use the Storage Console to upload files directly to this bucket.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={openStorageConsole}
          className="h-9 shrink-0 gap-1.5 text-sm"
        >
          Open Storage Console
          <ArrowUpRight className="h-3.5 w-3.5" animateOnHover animateOnTap />
        </Button>
      </div>

      {/* Search and the file list/pagination are hidden for now — there's
          nothing real to search or page through until upload (via the
          Storage Console above) is wired up to an actual file list. */}
    </div>
  );
}

export function BucketDetailPage({
  bucketName,
  onBack,
}: {
  bucketName: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState("file");

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to Storage List
      </button>

      <h1 className="mt-5 text-[30px] font-bold leading-normal tracking-[-0.6px] text-[#1b1b1d] dark:text-zinc-50">
        {bucketName}
      </h1>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className={PILL_TABS_LIST_CLASS}>
          <TabsTrigger value="file" className={PILL_TAB_TRIGGER_CLASS}>
            File
          </TabsTrigger>
          <TabsTrigger value="setting" className={PILL_TAB_TRIGGER_CLASS}>
            Setting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <BucketFileTab bucketName={bucketName} />
        </TabsContent>

        <TabsContent value="setting">
          <BucketSettingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
