"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { formatDate } from "@/lib/dates";
import { saveAnnouncement, setPublished, type ActionResult } from "./actions";

type Announcement = {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string | null;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
};

/**
 * The home page's notice board keys on the first three. The rest, and anything
 * left uncategorised, fall under Notice there — so nothing posted here can
 * fail to appear on the site.
 */
const CATEGORIES = ["News", "Tender", "Notice", "Camp", "Closure", "Recruitment"];

export function AnnouncementManager({ rows }: { rows: Announcement[] }) {
  const [busy, startTransition] = useTransition();
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : (result.message ?? "That did not work."));
      if (result.ok) setEditing(null);
    });

  const current = editing === "new" ? null : editing;

  const columns: Column<Announcement>[] = [
    {
      key: "title",
      header: "Title",
      stackedTitle: true,
      cell: (row) => (
        <span>
          {row.is_published ? (
            <Link
              href={`/announcements/${row.slug}`}
              className="no-underline hover:underline"
            >
              {row.title}
            </Link>
          ) : (
            row.title
          )}
        </span>
      ),
    },
    { key: "category", header: "Category", cell: (row) => row.category ?? "" },
    {
      key: "published",
      header: "Published",
      cell: (row) => (
        <span className="tnum">
          {row.published_at ? formatDate(row.published_at.slice(0, 10)) : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          <Chip variant={row.is_published ? "filled" : "outline"}>
            {row.is_published ? "Published" : "Draft"}
          </Chip>
          {row.is_pinned ? <Chip>Pinned</Chip> : null}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          <Button size="sm" variant="quiet" onClick={() => setEditing(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="quiet"
            disabled={busy}
            onClick={() => {
              const data = new FormData();
              data.set("id", row.id);
              data.set("publish", row.is_published ? "false" : "true");
              run(() => setPublished(data));
            }}
          >
            {row.is_published ? "Unpublish" : "Publish"}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      {message ? (
        <p role="alert" className="mb-4 rounded-sm border border-navy p-3 text-14">
          {message}
        </p>
      ) : null}

      <div className="mb-4">
        <Button variant="primary" onClick={() => setEditing("new")}>
          Write a notice
        </Button>
      </div>

      <Table
        caption="Announcements"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        rowClassName={(row) => (row.is_published ? undefined : undefined)}
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Write a notice" : "Edit the notice"}
        description="Saving does not publish. Publish it separately when it is ready."
        className="max-w-2xl"
      >
        <form
          action={(data) => {
            if (current) data.set("id", current.id);
            run(() => saveAnnouncement(data));
          }}
          className="grid gap-4"
        >
          <Field id="title" label="Title">
            {(control) => (
              <Input
                {...control}
                name="title"
                required
                defaultValue={current?.title ?? ""}
              />
            )}
          </Field>

          <Field id="category" label="Category" optional>
            {(control) => (
              <Select
                {...control}
                name="category"
                defaultValue={current?.category ?? ""}
              >
                <option value="">No category</option>
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="body"
            label="Notice"
            hint="Markdown. Blank line between paragraphs. Use - for a list."
          >
            {(control) => (
              <Textarea
                {...control}
                name="body"
                rows={12}
                required
                defaultValue={current?.body ?? ""}
              />
            )}
          </Field>

          <label htmlFor="is_pinned" className="flex items-center gap-3 text-14">
            <input
              id="is_pinned"
              name="is_pinned"
              type="checkbox"
              defaultChecked={current?.is_pinned ?? false}
              className="h-4 w-4"
            />
            Pin to the top of the announcements list
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setEditing(null)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              Save notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
