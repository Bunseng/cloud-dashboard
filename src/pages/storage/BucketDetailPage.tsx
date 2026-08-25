import { useState } from "react";
import { ChevronLeft, Download, Pencil, Trash2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  PAGINATION_CONTROLS,
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  RefreshIconButton,
  SearchField,
} from "../../components/atoms";
import {
  ALLOWED_METHODS,
  EditPolicyDialog,
  MultiValueField,
  UploadFileDialog,
} from "./BucketDialogs";

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
            <Pencil className="h-3.5 w-3.5" />
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

function BucketFileTab() {
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const allSelected =
    BUCKET_FILE_ROWS.length > 0 && selected.length === BUCKET_FILE_ROWS.length;

  function toggleRow(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <SearchField />
        <RefreshIconButton />
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="brand" onClick={() => setUploadOpen(true)} className="h-9 px-4 text-sm">
          Upload File
        </Button>
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() =>
                    setSelected(allSelected ? [] : BUCKET_FILE_ROWS.map((r) => r.name))
                  }
                  aria-label="Select all files"
                />
              </TableHead>
              <TableHead className="w-[260px] text-[13px] text-zinc-500 dark:text-zinc-400">
                Name
              </TableHead>
              <TableHead className="w-[160px] text-[13px] text-zinc-500 dark:text-zinc-400">
                Type
              </TableHead>
              <TableHead className="w-[140px] text-[13px] text-zinc-500 dark:text-zinc-400">
                Size
              </TableHead>
              <TableHead className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Date modified
              </TableHead>
              <TableHead className="text-right text-[13px] text-zinc-500 dark:text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BUCKET_FILE_ROWS.map((row) => (
              <TableRow key={row.name}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(row.name)}
                    onCheckedChange={() => toggleRow(row.name)}
                    aria-label={`Select ${row.name}`}
                  />
                </TableCell>
                <TableCell className="text-zinc-800 dark:text-zinc-100">{row.name}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400">{row.type}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400">{row.size}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400">
                  {row.modified}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                    >
                      View Detail
                    </button>
                    <button
                      type="button"
                      aria-label={`Download ${row.name}`}
                      className="text-[#1C75BC] hover:text-[#17629F] dark:text-[#6FA8D8]"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${row.name}`}
                      className="text-red-500 hover:text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-zinc-500 dark:text-zinc-400">
        <p>
          {selected.length} of 68 row(s) selected.
        </p>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="h-8 w-[60px] border-zinc-200 dark:border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span>Page 1 of 7</span>

          <div className="flex items-center gap-1">
            {PAGINATION_CONTROLS.map(({ Icon, label }) => (
              <Button
                key={label}
                variant="outline"
                size="icon"
                disabled
                aria-label={label}
                className="h-8 w-8 border-zinc-200 dark:border-zinc-800"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <UploadFileDialog open={uploadOpen} onOpenChange={setUploadOpen} />
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
        <ChevronLeft className="h-4 w-4" />
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
          <BucketFileTab />
        </TabsContent>

        <TabsContent value="setting">
          <BucketSettingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
