import { AuditView, type AuditRow } from "./AuditView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";
import { addDays, todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    action?: string;
    actor?: string;
  }>;
};

export default async function AuditPage({ searchParams }: Props) {
  await requireTech();
  const params = await searchParams;

  const today = todayIST();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from ?? "")
    ? (params.from as string)
    : addDays(today, -13);
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to ?? "")
    ? (params.to as string)
    : today;

  const supabase = await createServerSupabase();

  const { data: actors } = await supabase
    .from("staff_profiles")
    .select("id, full_name")
    .order("full_name");

  let query = supabase
    .from("audit_log")
    .select(
      "id, action, entity, entity_id, meta, created_at, actor_role, staff_profiles(full_name)",
    )
    .gte("created_at", `${from}T00:00:00+05:30`)
    .lte("created_at", `${to}T23:59:59+05:30`)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (params.action) query = query.ilike("action", `%${params.action}%`);
  if (params.actor) query = query.eq("actor_id", params.actor);

  const { data } = await query;

  const rows: AuditRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    meta: row.meta ?? null,
    createdAt: row.created_at,
    actorRole: row.actor_role,
    actorName: row.staff_profiles?.full_name ?? null,
  }));

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Audit log</h1>
      <p className="mt-3 max-w-prose text-15 text-muted">
        Append-only. Every staff write records one row, and the log cannot be edited or
        deleted by anyone, including technical support.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="from" className="text-13 font-medium">
            From
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="to" className="text-13 font-medium">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={to} className="w-44" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="action" className="text-13 font-medium">
            Action contains
          </label>
          <Input
            id="action"
            name="action"
            type="search"
            defaultValue={params.action ?? ""}
            placeholder="cancel, override, staff"
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="actor" className="text-13 font-medium">
            Who
          </label>
          <Select
            id="actor"
            name="actor"
            defaultValue={params.actor ?? ""}
            className="w-56"
          >
            <option value="">Anyone</option>
            {(actors ?? []).map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.full_name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit">Filter</Button>
      </form>

      <div className="mt-8">
        <AuditView rows={rows} from={from} to={to} />
      </div>
    </div>
  );
}
