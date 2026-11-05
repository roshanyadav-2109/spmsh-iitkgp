"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { formatDate } from "@/lib/dates";

type StaffRow = {
  id: string;
  full_name: string;
  role: string;
  doctor_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  email: string;
};

type Doctor = { id: string; full_name: string };

const ROLE_LABEL: Record<string, string> = {
  tech: "Technical support",
  reception: "Reception",
  doctor: "Doctor",
};

export function StaffManager({
  rows,
  doctors,
  currentUserId,
  activeTechCount,
}: {
  rows: StaffRow[];
  doctors: Doctor[];
  currentUserId: string;
  activeTechCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<StaffRow | null>(null);
  const [newRole, setNewRole] = useState("reception");
  const [newPassword, setNewPassword] = useState("");
  const [techWarning, setTechWarning] = useState(false);

  const call = async (method: "POST" | "PATCH", body: unknown) => {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/staff", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message ?? "That did not work.");
      return false;
    }
    router.refresh();
    return true;
  };

  const columns: Column<StaffRow>[] = [
    {
      key: "name",
      header: "Name",
      stackedTitle: true,
      cell: (row) => (
        <span>
          {row.full_name}
          <span className="block text-13 text-muted">{row.email}</span>
        </span>
      ),
    },
    { key: "role", header: "Role", cell: (row) => ROLE_LABEL[row.role] ?? row.role },
    {
      key: "doctor",
      header: "Linked doctor",
      cell: (row) => doctors.find((d) => d.id === row.doctor_id)?.full_name ?? "",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Chip variant={row.is_active ? "filled" : "outline"}>
          {row.is_active ? "Active" : "Disabled"}
        </Chip>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => (
        <span className="tnum">{formatDate(row.created_at.slice(0, 10))}</span>
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
              setNewPassword("");
              setMessage(null);
              setResetting(row);
            }}
          >
            Reset password
          </Button>
          <Button
            size="sm"
            variant="quiet"
            disabled={busy || row.id === currentUserId}
            onClick={() =>
              void call("PATCH", {
                id: row.id,
                action: "set_active",
                isActive: !row.is_active,
              })
            }
          >
            {row.is_active ? "Disable" : "Enable"}
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
        <Button
          variant="primary"
          onClick={() => {
            setNewRole("reception");
            setTechWarning(false);
            setMessage(null);
            setCreating(true);
          }}
        >
          Create a staff account
        </Button>
      </div>

      <Table
        caption="Staff accounts"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        rowClassName={(row) => (row.is_active ? undefined : undefined)}
      />

      {/* Create ------------------------------------------------------------ */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create a staff account"
        description="The person can sign in immediately. Give them the password in person, not by message."
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const ok = await call("POST", {
              email: String(data.get("email") ?? ""),
              password: String(data.get("password") ?? ""),
              fullName: String(data.get("fullName") ?? ""),
              role: String(data.get("role") ?? "reception"),
              doctorId: String(data.get("doctorId") ?? ""),
              phone: String(data.get("phone") ?? ""),
            });
            if (ok) setCreating(false);
          }}
        >
          <Field id="fullName" label="Full name">
            {(control) => <Input {...control} name="fullName" required />}
          </Field>

          <Field
            id="email"
            label="User id"
            hint="An address. It does not have to receive mail."
          >
            {(control) => (
              <Input
                {...control}
                name="email"
                type="email"
                autoComplete="off"
                required
              />
            )}
          </Field>

          <Field
            id="password"
            label="Initial password"
            hint="At least 12 characters. The account holder should change it."
          >
            {(control) => (
              <Input {...control} name="password" type="text" minLength={12} required />
            )}
          </Field>

          <Field id="role" label="Role">
            {(control) => (
              <Select
                {...control}
                name="role"
                value={newRole}
                onChange={(event) => {
                  setNewRole(event.target.value);
                  setTechWarning(event.target.value === "tech");
                }}
              >
                <option value="reception">Reception</option>
                <option value="doctor">Doctor</option>
                <option value="tech">Technical support</option>
              </Select>
            )}
          </Field>

          {techWarning ? (
            <p className="border-l-2 border-navy pl-3 text-14">
              There {activeTechCount === 1 ? "is" : "are"} already {activeTechCount}{" "}
              active technical support {activeTechCount === 1 ? "account" : "accounts"}.
              A second one can create and disable any account, change every site setting
              and read the full audit log. Create it only if it is genuinely needed.
            </p>
          ) : null}

          {newRole === "doctor" ? (
            <Field
              id="doctorId"
              label="Linked doctor record"
              hint="The account will see only this doctor's appointments."
            >
              {(control) => (
                <Select {...control} name="doctorId" required>
                  <option value="">Choose the doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : null}

          <Field id="phone" label="Telephone" optional>
            {(control) => <Input {...control} name="phone" />}
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setCreating(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              Create account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset password ---------------------------------------------------- */}
      <Modal
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title="Reset the password"
        description={
          resetting ? `${resetting.full_name} — ${resetting.email}` : undefined
        }
        footer={
          <>
            <Button onClick={() => setResetting(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={busy || newPassword.length < 12}
              onClick={async () => {
                if (!resetting) return;
                const ok = await call("PATCH", {
                  id: resetting.id,
                  action: "reset_password",
                  password: newPassword,
                });
                if (ok) setResetting(null);
              }}
            >
              Set the password
            </Button>
          </>
        }
      >
        <Field
          id="newPassword"
          label="New password"
          hint="At least 12 characters. Hand it over in person."
        >
          {(control) => (
            <Input
              {...control}
              type="text"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          )}
        </Field>
      </Modal>
    </div>
  );
}
