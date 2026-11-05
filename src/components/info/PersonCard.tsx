import { initialsOf } from "@/components/DoctorPortrait";
import { telHref } from "@/components/info/PhoneRow";

export type Person = {
  id: string;
  full_name: string;
  designation: string;
  qualifications: string | null;
  email: string | null;
  phone: string | null;
};

export function PersonCard({ person }: { person: Person }) {
  const hasContact = Boolean(person.phone || person.email);

  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-panel">
          <span
            aria-hidden="true"
            className="font-display text-18 font-medium text-ink"
          >
            {initialsOf(person.full_name)}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-sans text-16 font-medium leading-dense tracking-normal">
            {person.full_name}
          </h2>
          <p className="mt-0.5 text-14 text-ink">{person.designation}</p>
          {person.qualifications ? (
            <p className="mt-1 text-13 text-muted">{person.qualifications}</p>
          ) : null}
        </div>
      </div>

      {hasContact ? (
        <ul className="mt-4 grid gap-1 border-t border-line pt-3 text-14">
          {person.phone ? (
            <li>
              <a href={telHref(person.phone)} className="tnum inline-block py-1">
                {person.phone}
              </a>
            </li>
          ) : null}
          {person.email ? (
            <li className="min-w-0">
              <a
                href={`mailto:${person.email}`}
                className="inline-block py-1 [overflow-wrap:anywhere]"
              >
                {person.email}
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}
