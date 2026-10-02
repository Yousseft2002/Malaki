import { updateEnquiryStatus } from "@/app/admin/actions/operations";
import { AdminForm } from "@/components/admin/admin-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { fromUtcDate } from "@/lib/domain/dates";

export const metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  const enquiries = await db.enquiry.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200 });

  return (
    <>
      <h1 className="mb-8 text-3xl text-emerald">Enquiries</h1>
      {enquiries.length === 0 && <p className="text-muted">No enquiries yet.</p>}
      <ul className="flex flex-col gap-4">
        {enquiries.map((e) => (
          <li key={e.id}>
            <article aria-labelledby={`enq-${e.id}`} className="border border-sand bg-ivory p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2 id={`enq-${e.id}`} className="font-display text-xl text-emerald">
                  {e.name}
                  {e.company && <span className="text-muted"> · {e.company}</span>}
                </h2>
                <StatusBadge status={e.status} />
                <span className="text-sm text-muted">
                  {e.type.toLowerCase()} · received {e.createdAt.toLocaleDateString("en-US")}
                </span>
              </div>
              <p className="text-sm">
                <a href={`mailto:${e.email}`} className="underline">
                  {e.email}
                </a>
                {e.phone && <> · {e.phone}</>}
                {e.eventDate && <> · event {fromUtcDate(e.eventDate)}</>}
                {e.quantity && <> · qty: {e.quantity}</>}
                {e.budget && <> · budget: {e.budget}</>}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{e.message}</p>
              <AdminForm action={updateEnquiryStatus} submitLabel="Update">
                <input type="hidden" name="id" value={e.id} />
                <label htmlFor={`status-${e.id}`} className="sr-only">
                  Status
                </label>
                <select id={`status-${e.id}`} name="status" defaultValue={e.status} className="field-input mt-3 min-h-11 w-48 py-2 text-sm">
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </AdminForm>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
