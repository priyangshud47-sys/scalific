import AdminShell from "../AdminShell";
import AdminContactInfo from "@/views/admin/ContactInfo";

export const metadata = {
  title: "Contact Info | Scalific Admin",
};

export default function ContactInfoPage() {
  return (
    <AdminShell>
      <AdminContactInfo />
    </AdminShell>
  );
}
