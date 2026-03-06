/** Admin platform settings management — list and edit key/value settings. */

"use client";

import { useState } from "react";
import { useAdminSettings, useUpsertSetting } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBST } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { PlatformSettingRead } from "@/types/database";

export function SettingsManagement() {
  /** Renders platform settings list with edit/create dialog. */
  const { data: settings, isLoading } = useAdminSettings();
  const upsertSetting = useUpsertSetting();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSetting, setEditSetting] = useState<PlatformSettingRead | null>(null);
  const [key, setKey] = useState("");
  const [valueJson, setValueJson] = useState("");
  const [description, setDescription] = useState("");
  const [jsonError, setJsonError] = useState("");

  function openCreate() {
    setEditSetting(null);
    setKey("");
    setValueJson("{}");
    setDescription("");
    setJsonError("");
    setDialogOpen(true);
  }

  function openEdit(setting: PlatformSettingRead) {
    setEditSetting(setting);
    setKey(setting.key);
    setValueJson(JSON.stringify(setting.value, null, 2));
    setDescription(setting.description ?? "");
    setJsonError("");
    setDialogOpen(true);
  }

  function handleSave() {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(valueJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setJsonError("Value must be a JSON object");
        return;
      }
    } catch {
      setJsonError("Invalid JSON");
      return;
    }

    const settingKey = editSetting ? editSetting.key : key;
    if (!settingKey.trim()) {
      setJsonError("Key is required");
      return;
    }

    upsertSetting.mutate(
      {
        key: settingKey,
        data: {
          value: parsed,
          description: description || undefined,
        },
      },
      { onSuccess: () => setDialogOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Setting
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !settings?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No platform settings configured.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.key}>
                    <TableCell className="font-mono text-sm font-medium">
                      {setting.key}
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-sm text-muted-foreground">
                      {JSON.stringify(setting.value)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.description ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateBST(setting.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(setting)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editSetting ? `Edit: ${editSetting.key}` : "Add Setting"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!editSetting && (
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. platform_commission_rate"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Value (JSON)</Label>
              <Textarea
                value={valueJson}
                onChange={(e) => {
                  setValueJson(e.target.value);
                  setJsonError("");
                }}
                rows={6}
                className="font-mono text-sm"
                placeholder='{"key": "value"}'
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this setting controls"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsertSetting.isPending}
            >
              {upsertSetting.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
