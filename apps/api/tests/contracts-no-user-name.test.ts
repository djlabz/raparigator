import { describe, expect, it } from "vitest";
import { MessageMediaSchema, contract } from "@sigillus/contracts";

const FORBIDDEN_KEYS = new Set(["name", "fullName", "displayName", "authorName"]);
const ALLOWED = new Set<unknown>([MessageMediaSchema]);

type ZodLike = { _zod: { def: Record<string, unknown> & { type: string } } };
type ProcedureLike = { "~orpc": { outputSchema?: unknown } };

function isZod(value: unknown): value is ZodLike {
  return typeof value === "object" && value !== null && "_zod" in value;
}

function isProcedure(value: unknown): value is ProcedureLike {
  return typeof value === "object" && value !== null && "~orpc" in value;
}

function unwrapEventIterator(schema: unknown): unknown[] {
  const standard = (schema as { "~standard"?: Record<symbol, unknown> })["~standard"];
  if (!standard) {
    return [];
  }
  return Object.getOwnPropertySymbols(standard).flatMap((symbol) => {
    const details = standard[symbol] as { yields?: unknown; returns?: unknown } | undefined;
    return details ? [details.yields, details.returns] : [];
  });
}

function findUserNameFields(schema: unknown, path: string, seen = new Set<unknown>()): string[] {
  if (!schema || seen.has(schema)) {
    return [];
  }
  seen.add(schema);
  if (!isZod(schema)) {
    return unwrapEventIterator(schema).flatMap((inner) => findUserNameFields(inner, path, seen));
  }
  const def = schema._zod.def;
  const children: Array<[unknown, string]> = [];
  switch (def.type) {
    case "object": {
      const shape = def.shape as Record<string, unknown>;
      const hits: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        if (FORBIDDEN_KEYS.has(key) && !ALLOWED.has(schema)) {
          hits.push(`${path}.${key}`);
        }
        children.push([value, `${path}.${key}`]);
      }
      return [
        ...hits,
        ...children.flatMap(([child, childPath]) => findUserNameFields(child, childPath, seen)),
      ];
    }
    case "array":
      children.push([def.element, `${path}[]`]);
      break;
    case "union":
      for (const option of def.options as unknown[]) {
        children.push([option, path]);
      }
      break;
    case "intersection":
      children.push([def.left, path], [def.right, path]);
      break;
    case "pipe":
      children.push([def.in, path], [def.out, path]);
      break;
    case "record":
      children.push([def.valueType, `${path}{}`]);
      break;
    case "tuple":
      for (const item of def.items as unknown[]) {
        children.push([item, `${path}()`]);
      }
      break;
    case "lazy":
      children.push([(def.getter as () => unknown)(), path]);
      break;
    default:
      if ("innerType" in def) {
        children.push([def.innerType, path]);
      }
  }
  return children.flatMap(([child, childPath]) => findUserNameFields(child, childPath, seen));
}

describe("contratos voltados à contraparte não expõem nome de usuário", () => {
  const routers = {
    chat: contract.chat,
    reviews: contract.reviews,
    feed: contract.feed,
    ads: contract.ads,
  };

  for (const [routerName, router] of Object.entries(routers)) {
    it(`saídas de ${routerName} não têm name/fullName/displayName/authorName`, () => {
      const procedures = Object.entries(router as Record<string, unknown>).filter(([, value]) =>
        isProcedure(value),
      );
      expect(procedures.length).toBeGreaterThan(0);
      const hits = procedures.flatMap(([procedureName, procedure]) =>
        findUserNameFields(
          (procedure as ProcedureLike)["~orpc"].outputSchema,
          `${routerName}.${procedureName}`,
        ),
      );
      expect(hits).toEqual([]);
    });
  }

  it("o percorrido enxerga o campo name de mídia do chat (allowlist) e o stream de eventos", () => {
    const media = findUserNameFields(MessageMediaSchema, "media");
    expect(media).toEqual([]);
    const withoutAllowlist = (MessageMediaSchema as unknown as ZodLike)._zod.def.shape as Record<
      string,
      unknown
    >;
    expect(Object.keys(withoutAllowlist)).toContain("name");
    const events = unwrapEventIterator(contract.chat.subscribe["~orpc"].outputSchema);
    expect(events.some((schema) => isZod(schema))).toBe(true);
  });
});
