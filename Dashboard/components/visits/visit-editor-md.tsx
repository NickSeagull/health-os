"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

interface VisitEditorMdProps {
  filename: string;
  initialContent: string;
  onClose: () => void;
}

export function VisitEditorMd({
  filename,
  initialContent,
  onClose,
}: VisitEditorMdProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(filename)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Visit saved");
      mutate("/api/visits");
      onClose();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Edit (Markdown)</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div data-color-mode="auto">
        <MDEditor
          value={content}
          onChange={(v) => setContent(v ?? "")}
          height={400}
          preview="live"
        />
      </div>
    </div>
  );
}
