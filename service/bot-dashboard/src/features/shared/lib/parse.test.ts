import { AppError } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "./parse";

describe("parseResult", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it("returns Ok with parsed data for valid input", () => {
    const result = parseResult(schema, { name: "Alice", age: 30 });
    expect(result.err).toBeUndefined();
    expect(result.val).toEqual({ name: "Alice", age: 30 });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["number", 42],
    ["string", "invalid"],
    ["missing required field", { name: "Alice" }],
    ["wrong field type", { name: "Alice", age: "thirty" }],
  ])("returns Err with BAD_REQUEST for invalid input: %s", (_label, raw) => {
    const result = parseResult(schema, raw);
    expect(result.err).toBeDefined();
    expect(result.err).toBeInstanceOf(AppError);
    expect(result.err?.code).toBe("BAD_REQUEST");
  });

  it("strips extra fields (Zod default strip behavior)", () => {
    const result = parseResult(schema, {
      name: "Bob",
      age: 25,
      extra: "field",
    });
    expect(result.err).toBeUndefined();
    expect(result.val).toEqual({ name: "Bob", age: 25 });
  });

  it("works with simple scalar schema", () => {
    const strSchema = z.string();
    const ok = parseResult(strSchema, "hello");
    expect(ok.err).toBeUndefined();
    expect(ok.val).toBe("hello");

    const fail = parseResult(strSchema, 123);
    expect(fail.err).toBeDefined();
  });
});
