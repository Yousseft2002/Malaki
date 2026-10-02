import type { ComponentProps } from "react";

type WithId = { id: string; label: string; name: string };

/** Compact labelled input for admin forms. `id` must be unique on the page. */
export function AdminInput({ label, className = "", ...props }: ComponentProps<"input"> & WithId) {
  return (
    <div className={className}>
      <label htmlFor={props.id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <input className="field-input min-h-11 py-2 text-sm" {...props} />
    </div>
  );
}

export function AdminTextarea({ label, ...props }: ComponentProps<"textarea"> & WithId) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <textarea rows={3} className="field-input text-sm" {...props} />
    </div>
  );
}

export function AdminCheckbox({ label, name, defaultChecked, value }: { label: string; name: string; defaultChecked?: boolean; value?: string }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="h-5 w-5 accent-emerald" />
      {label}
    </label>
  );
}
