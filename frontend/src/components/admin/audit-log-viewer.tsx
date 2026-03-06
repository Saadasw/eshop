/** Admin audit log viewer — paginated, filterable log table. */

"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/storefront/pagination";
import { formatDateBST } from "@/lib/utils/format";
import { Eye } from "lucide-react";
import type { AuditAction, AuditLogRead } from "@/types/database";

const ACTION_OPTIONS: { value: AuditAction | "all"; label: string }[] = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "status_change", label: "Status Change" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
];

const ACTION_COLORS: Record<AuditAction, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  status_change: "bg-orange-100 text-orange-800",
  login: "bg-gray-100 text-gray-800",
  logout: "bg-gray-100 text-gray-800",
  export: "bg-purple-100 text-purple-800",
  import: "bg-purple-100 text-purple-800",
};

const PAGE_SIZE = 50;

export function AuditLogViewer() {
  /** Renders filterable, paginated audit log table. */
  const [entityType, setEntityType] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [page, setPage] = useState(0);
  const [detailLog, setDetailLog] = useState<AuditLogRead | null>(null);

  const { data, isLoading } = useAuditLogs({
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    entity_type: entityType || undefined,
    action: actionFilter === "all" ? undefined : actionFilter,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Activity Log</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Entity type..."
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(0);
                }}
                className="w-36"
              />
              <Select
                value={actionFilter}
                onValueChange={(v) => {
                  setActionFilter(v as AuditAction | "all");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data?.items.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No audit logs found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateBST(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={ACTION_COLORS[log.action]}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.entity_type}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.entity_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.user_id ? `${log.user_id.slice(0, 8)}...` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ip_address ?? "-"}
                      </TableCell>
                      <TableCell>
                        {(log.old_values || log.new_values) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.total > PAGE_SIZE && (
                <div className="mt-4">
                  <Pagination
                    total={data.total}
                    skip={data.skip}
                    limit={data.limit}
                    onChange={(skip) => setPage(Math.floor(skip / PAGE_SIZE))}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog
        open={!!detailLog}
        onOpenChange={(open) => !open && setDetailLog(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Audit Log Detail —{" "}
              <Badge
                variant="secondary"
                className={ACTION_COLORS[detailLog?.action ?? "update"]}
              >
                {detailLog?.action}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Entity</p>
              <p className="font-mono text-sm text-muted-foreground">
                {detailLog?.entity_type} / {detailLog?.entity_id}
              </p>
            </div>

            {detailLog?.old_values && (
              <div>
                <p className="text-sm font-medium">Old Values</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-3 font-mono text-xs">
                  {JSON.stringify(detailLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {detailLog?.new_values && (
              <div>
                <p className="text-sm font-medium">New Values</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-3 font-mono text-xs">
                  {JSON.stringify(detailLog.new_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {detailLog?.created_at && formatDateBST(detailLog.created_at)}
              {detailLog?.ip_address && ` | ${detailLog.ip_address}`}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
