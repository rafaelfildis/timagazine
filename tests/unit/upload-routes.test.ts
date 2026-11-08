// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { solidPng } from "../e2e/png";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(async () => ({ user: { id: "u1", role: "editor" } })),
  put: vi.fn(async (path: string) => ({ url: `https://abc.public.blob.vercel-storage.com/${path}` })),
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
  readFile: vi.fn(async () => Buffer.from([1, 2, 3])),
}));
vi.mock("@/lib/auth", () => ({ requireRole: mocks.requireRole }));
vi.mock("@vercel/blob", () => ({ put: mocks.put }));
vi.mock("node:fs/promises", () => {
  const fs = { mkdir: mocks.mkdir, writeFile: mocks.writeFile, readFile: mocks.readFile };
  return { ...fs, default: fs };
});

import { POST } from "@/app/api/upload/route";
import { GET } from "@/app/uploads/[name]/route";

function uploadRequest() {
  const body = new FormData();
  body.set("file", new File([new Uint8Array(solidPng())], "capa.png", { type: "image/png" }));
  return new Request("http://localhost:3100/api/upload", {
    method: "POST",
    headers: { host: "localhost:3100", origin: "http://localhost:3100", "sec-fetch-site": "same-origin", "content-length": "2048" },
    body,
  });
}

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockClear();
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", undefined);
  vi.stubEnv("ALLOW_LOCAL_UPLOADS", undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/upload: onde a imagem é gravada", () => {
  it("sem Blob e sem ALLOW_LOCAL_UPLOADS responde 503 e não toca o disco (ex.: produção na Vercel)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await POST(uploadRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Armazenamento de imagens não configurado." });
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("ALLOW_LOCAL_UPLOADS=1 grava em public/uploads (dev e e2e, mesmo com NODE_ENV=production)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_UPLOADS", "1");
    const res = await POST(uploadRequest());
    expect(res.status).toBe(200);
    const { url } = await res.json();
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("com BLOB_READ_WRITE_TOKEN envia ao Vercel Blob", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "token-de-teste");
    const res = await POST(uploadRequest());
    expect(res.status).toBe(200);
    expect((await res.json()).url).toMatch(/^https:\/\/abc\.public\.blob\.vercel-storage\.com\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(mocks.put).toHaveBeenCalledTimes(1);
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});

describe("GET /uploads/[name]", () => {
  const NAME = "0b9a5c0e-3f1e-4c8a-9d2b-7a6e5f4d3c2b.png";
  const get = (name: string) => GET(new Request(`http://localhost/uploads/${name}`), { params: Promise.resolve({ name }) });

  it("sem ALLOW_LOCAL_UPLOADS responde 404 sem ler o disco", async () => {
    const res = await get(NAME);
    expect(res.status).toBe(404);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("com ALLOW_LOCAL_UPLOADS=1 serve o arquivo (e só nomes gerados pelo envio)", async () => {
    vi.stubEnv("ALLOW_LOCAL_UPLOADS", "1");
    const res = await get(NAME);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect((await get("..%2F..%2F.env")).status).toBe(404);
    expect(mocks.readFile).toHaveBeenCalledTimes(1);
  });
});
