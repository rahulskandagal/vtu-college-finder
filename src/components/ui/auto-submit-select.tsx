"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "./index";
import type { ComponentProps } from "react";

/** A <select> that rewrites one URL search param and navigates on change. */
export function AutoSubmitSelect({ param, ...props }: ComponentProps<typeof Select> & { param: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <Select
      {...props}
      onChange={(e) => {
        const next = new URLSearchParams(sp.toString());
        if (e.target.value) next.set(param, e.target.value);
        else next.delete(param);
        next.delete("page");
        router.push(`?${next.toString()}`);
      }}
    />
  );
}
