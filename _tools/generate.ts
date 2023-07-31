import nodeDeps from "../node_deps.json" assert { type: "json" };
import { format } from "https://deno.land/x/format@1.0.1/mod.ts";
import { mapKeys } from "https://deno.land/std@0.196.0/collections/map_keys.ts";
import { mapValues } from "https://deno.land/std@0.196.0/collections/map_values.ts";

if (import.meta.main) {
  const formattedKey = mapKeys(nodeDeps.dependencies, (key) => {
    return format<"name">(nodeDeps.output.value, { name: key });
  });
  const formattedValue = mapValues(
    formattedKey,
    (values) => values.map(quoted).join(" | "),
  );

  const content = Object.entries(formattedValue).map(([key, value]) => {
    return `export type ${key} = ${value};`;
  }).join("\n\n");
  const fileUrl = import.meta.resolve("../generated.d.ts");

  Deno.writeTextFile(new URL(fileUrl), content);
}

function quoted(input: string): string {
  return `"${input}"`;
}
