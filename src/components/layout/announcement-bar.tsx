export function AnnouncementBar({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-emerald-deep px-4 py-2 text-center text-ivory">
      <p className="eyebrow text-[0.7rem] leading-relaxed">{message}</p>
    </div>
  );
}
