import Link from "next/link";
import { ArrowDisc } from "@/components/ui/Go";
import Image from "next/image";
import { markFor } from "@/components/ui/departmentMark";
import { departmentIcon } from "@/lib/lineIcons";
import { getT } from "@/lib/i18n/server";

export type PanelDepartment = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Clinical departments as separate blocks: the department's icon and its
 * name. A last block leads to the full list, and keeps the grid from ending
 * on an empty cell.
 */
export async function SpecialityPanel({
  departments,
}: {
  departments: PanelDepartment[];
}) {
  const t = await getT();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {departments.map((department) => {
        const mark = markFor(department.name, 40);
        const drawn = departmentIcon(department.name);
        return (
          <li key={department.id}>
            <Link
              href={`/departments/${department.slug}`}
              className="group ui-transition flex h-full flex-col gap-4 rounded-lg border-2 border-tint bg-tint px-4 py-5 no-underline hover:border-ink hover:bg-white sm:p-6"
            >
              <span
                aria-hidden="true"
                className="flex h-14 items-center text-ink"
              >
                {drawn ? (
                  <Image
                    src={drawn}
                    alt=""
                    width={192}
                    height={192}
                    sizes="56px"
                    className="h-14 w-14"
                  />
                ) : (
                  mark.icon
                )}
              </span>
              <span className="block text-16 font-medium leading-dense text-ink group-hover:underline">
                {department.name}
              </span>
            </Link>
          </li>
        );
      })}
      <li
        className={
          departments.length % 2 === 0 ? "col-span-2 lg:col-span-1" : undefined
        }
      >
        <Link href="/departments" className="group relative block h-full no-underline">
          <span className="notch-tr ui-transition flex h-full min-h-28 items-end rounded-lg bg-accent px-4 py-5 group-hover:bg-accent-deep sm:p-6">
            <span className="text-16 font-medium text-white">
              {t.home.allDepartments}
            </span>
          </span>
          <ArrowDisc className="absolute right-0 top-0" />
        </Link>
      </li>
    </ul>
  );
}
