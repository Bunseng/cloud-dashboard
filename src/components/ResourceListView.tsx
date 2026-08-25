import { useState } from "react";
import type { ReactNode } from "react";
import { Files, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PAGINATION_CONTROLS, RefreshIconButton, SearchField } from "./atoms";

type ResourceRow = { id: string | number; name: string; [key: string]: any };

type ResourceColumn = {
  key: string;
  header: ReactNode;
  className?: string;
  render?: (row: ResourceRow) => ReactNode;
};

/* Generic resource table — shared by the Stack and Database lists so a
   new list is a column config plus rows, not another table component.
   Create opens the caller's own dialog (`onCreate`); delete asks for
   confirmation right here since "are you sure?" copy is the same for
   every resource type — the caller only needs to remove the row. */
export function ResourceListView({
  columns,
  rows,
  createLabel,
  emptyTitle,
  emptyDescription,
  totalCount,
  pageCount = 1,
  onViewDetail,
  onCreate,
  onDelete,
}: {
  columns: ResourceColumn[];
  rows: ResourceRow[];
  createLabel?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  totalCount?: number;
  pageCount?: number;
  onViewDetail?: (name: string) => void;
  onCreate?: () => void;
  onDelete?: (row: ResourceRow) => void;
}) {
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ResourceRow | null>(null);

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const total = totalCount ?? rows.length;

  function toggleRow(id: string | number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <SearchField />
        <RefreshIconButton />
        <Button
          variant="brand"
          onClick={onCreate}
          className="h-9 shrink-0 px-4 text-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
          {createLabel}
        </Button>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() =>
                    setSelected(allSelected ? [] : rows.map((r) => r.id))
                  }
                  aria-label="Select all rows"
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={"text-zinc-500 dark:text-zinc-400 " + (col.className || "")}
                >
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap text-right text-zinc-500 dark:text-zinc-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onCheckedChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={
                        "text-zinc-600 dark:text-zinc-400 " + (col.className || "")
                      }
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onViewDetail?.(row.name)}
                        className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                      >
                        View Detail
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => setDeleteTarget(row)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + 2} className="p-0">
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Files
                      className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {emptyTitle}
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {emptyDescription}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-zinc-500 dark:text-zinc-400">
        <p>
          {selected.length} of {total} row(s) selected.
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

          <span>Page 1 of {pageCount}</span>

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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.name ?? ""}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) onDelete?.(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
