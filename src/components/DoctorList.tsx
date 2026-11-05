import { DoctorCard, type CardDoctor, type CardSession } from "@/components/DoctorCard";

type Schedule = CardSession & { doctor_id: string };

export function DoctorList({
  doctors,
  schedules,
  showDepartment = false,
  headingLevel = "h3",
}: {
  doctors: CardDoctor[];
  schedules: Schedule[];
  showDepartment?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const byDoctor = new Map<string, Schedule[]>();
  for (const schedule of schedules) {
    const list = byDoctor.get(schedule.doctor_id) ?? [];
    list.push(schedule);
    byDoctor.set(schedule.doctor_id, list);
  }

  return (
    <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {doctors.map((doctor) => (
        <li key={doctor.id}>
          <DoctorCard
            doctor={showDepartment ? doctor : { ...doctor, department_name: null }}
            sessions={byDoctor.get(doctor.id) ?? []}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  );
}
