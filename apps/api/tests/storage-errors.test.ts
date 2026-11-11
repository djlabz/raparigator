import { describe, expect, it } from "vitest";
import { isTransientStorageError } from "../src/lib/storage";

describe("isTransientStorageError", () => {
  it("rede, timeout e 5xx são transitórios", () => {
    expect(isTransientStorageError(Object.assign(new Error("x"), { code: "ECONNREFUSED" }))).toBe(
      true,
    );
    expect(isTransientStorageError(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe(
      true,
    );
    expect(
      isTransientStorageError(
        Object.assign(new Error("x"), { $metadata: { httpStatusCode: 503 } }),
      ),
    ).toBe(true);
  });

  it("formato não suportado, arquivo corrompido e 404 são permanentes", () => {
    expect(
      isTransientStorageError(new Error("formato de imagem sem limpeza de metadados: image/heic")),
    ).toBe(false);
    expect(
      isTransientStorageError(new Error("Input buffer contains unsupported image format")),
    ).toBe(false);
    expect(
      isTransientStorageError(
        Object.assign(new Error("x"), { name: "NotFound", $metadata: { httpStatusCode: 404 } }),
      ),
    ).toBe(false);
    expect(isTransientStorageError("texto")).toBe(false);
  });
});
