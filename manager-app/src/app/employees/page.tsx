import { listEmployees } from "@/lib/data";
import { EmployeeListClient } from "@/components/employees/EmployeeListClient";

export default async function EmployeesPage() {
  const employees = await listEmployees();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>People</div>
        <h1 style={{ fontSize: 22 }}>Employees</h1>
      </div>
      <EmployeeListClient employees={employees} />
    </div>
  );
}
