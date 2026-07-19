import AdminShell from "../AdminShell";
import AdminEmployees from "@/views/admin/Employees";

export default function EmployeesPage() {
  return (
    <AdminShell>
      <AdminEmployees />
    </AdminShell>
  );
}
