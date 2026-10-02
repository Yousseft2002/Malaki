"use client";

import { useEffect, useRef } from "react";
import { HONEYPOT_FIELD, STARTED_AT_FIELD } from "@/lib/spam";

/** Hidden honeypot + render timestamp. Include inside any public <form>. */
export function SpamFields() {
  const startedAt = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Set after hydration so server and client markup match.
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={startedAt} type="hidden" name={STARTED_AT_FIELD} defaultValue="" />
    </>
  );
}
