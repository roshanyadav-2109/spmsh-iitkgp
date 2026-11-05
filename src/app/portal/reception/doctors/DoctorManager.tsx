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
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { saveDoctor, setDoctorActive, type ActionResult } from "./actions";

type Doctor = {
  id: string;
  full_name: string;
  slug: string;
  designation: string | null;
  qualifications: string | null;
  registration_no: string | null;
  room_no: string | null;
  about: string | null;
  photo_path: string | null;
  display_order: number;
  is_active: boolean;
  department_id: string | null;
  sessions: number;
};

type Department = { id: string; name: string };

export function DoctorManager({
  doctors,
  departments,
}: {
  doctors: Doctor[];
  departments: Department[];
}) {
  const [busy, startTransition] = useTransition();
  const [editing, setEditing] = useState<Doctor | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : (result.message ?? "That did not work."));
      if (result.ok) setEditing(null);
    });

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const supabase = createBrowserSupabase();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("doctor-photos")
      .upload(path, file, { upsert: false, contentType: file.type });
    setUploading(false);
    if (error) {
      setMessage(
        "The photograph could not be uploaded. Use a JPEG, PNG or WebP under 2 MB.",
      );
      return;
    }
    setPhotoPath(path);
    setMessage(null);
  };

  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Name",
      stackedTitle: true,
      cell: (row) => (
        <span>
          <Link href={`/doctors/${row.slug}`} className="no-underline hover:underline">
            {row.full_name}
          </Link>
          {row.designation ? (
            <span className="block text-13 text-muted">{row.designation}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (row) => departments.find((d) => d.id === row.department_id)?.name ?? "",
    },
    { key: "room", header: "Room", cell: (row) => row.room_no ?? "" },
    {
      key: "sessions",
      header: "Weekly sessions",
      align: "right",
      cell: (row) => <span className="tnum">{row.sessions}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Chip variant={row.is_active ? "filled" : "outline"}>
          {row.is_active ? "Listed" : "Not listed"}
        </Chip>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="quiet"
            onClick={() => {
              setPhotoPath(row.photo_path ?? "");
              setEditing(row);
            }}
          >
            Edit
          </Button>
          <Link
            href={`/portal/reception/availability?doctor=${row.id}`}
            className="ui-transition inline-flex h-7 items-center rounded-sm px-3 text-13 no-underline"
          >
            Schedule
          </Link>
          <Button
            size="sm"
            variant="quiet"
            disabled={busy}
            onClick={() => {
              const data = new FormData();
              data.set("id", row.id);
              data.set("active", row.is_active ? "false" : "true");
              run(() => setDoctorActive(data));
            }}
          >
            {row.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        </span>
      ),
    },
  ];

  const current = editing === "new" ? null : editing;

  return (
    <div>
      {message ? (
        <p role="alert" className="mb-4 rounded-sm border border-navy p-3 text-14">
          {message}
        </p>
      ) : null}

      <div className="mb-4">
        <Button
          variant="primary"
          onClick={() => {
            setPhotoPath("");
            setEditing("new");
          }}
        >
          Add a doctor
        </Button>
      </div>

      <Table
        caption="Doctor records"
        columns={columns}
        rows={doctors}
        rowKey={(row) => row.id}
        rowClassName={(row) => (row.is_active ? undefined : undefined)}
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a doctor" : "Edit the doctor record"}
        className="max-w-2xl"
      >
        <form
          action={(data) => {
            if (current) data.set("id", current.id);
            data.set("photo_path", photoPath);
            run(() => saveDoctor(data));
          }}
          className="grid gap-4"
        >
          <Field id="full_name" label="Full name">
            {(control) => (
              <Input
                {...control}
                name="full_name"
                required
                defaultValue={current?.full_name ?? ""}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="department_id" label="Department" optional>
              {(control) => (
                <Select
                  {...control}
                  name="department_id"
                  defaultValue={current?.department_id ?? ""}
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id="designation" label="Designation" optional>
              {(control) => (
                <Input
                  {...control}
                  name="designation"
                  defaultValue={current?.designation ?? ""}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="qualifications" label="Qualifications" optional>
              {(control) => (
                <Input
                  {...control}
                  name="qualifications"
                  defaultValue={current?.qualifications ?? ""}
                />
              )}
            </Field>
            <Field id="registration_no" label="Council registration" optional>
              {(control) => (
                <Input
                  {...control}
                  name="registration_no"
                  defaultValue={current?.registration_no ?? ""}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="room_no" label="Room" optional>
              {(control) => (
                <Input
                  {...control}
                  name="room_no"
                  defaultValue={current?.room_no ?? ""}
                />
              )}
            </Field>
            <Field id="display_order" label="Order in listings" optional>
              {(control) => (
                <Input
                  {...control}
                  name="display_order"
                  inputMode="numeric"
                  defaultValue={current?.display_order ?? 0}
                />
              )}
            </Field>
          </div>

          <Field
            id="about"
            label="About"
            optional
            hint="Factual. Shown on the public profile."
          >
            {(control) => (
              <Textarea
                {...control}
                name="about"
                rows={4}
                defaultValue={current?.about ?? ""}
              />
            )}
          </Field>

          <Field
            id="photo"
            label="Photograph"
            optional
            hint="JPEG, PNG or WebP, under 2 MB. An actual photograph of the doctor, or none."
          >
            {(control) => (
              <input
                {...control}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="text-14"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
            )}
          </Field>
          {uploading ? <p className="text-13">Uploading…</p> : null}
          {photoPath ? (
            <p className="text-13 text-muted">Photograph: {photoPath}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setEditing(null)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" disabled={busy || uploading}>
              Save doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
