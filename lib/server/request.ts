import { ZodSchema } from 'zod';
export interface ReadJsonOptions<T> {
  maxBytes?: number;
  schema?: ZodSchema<T>;
}
export async function readJsonSafe<T = unknown>(
  request: Request,
  options: ReadJsonOptions<T> = {},
): Promise<T> {
  const maxBytes = options.maxBytes ?? getEnvInt('PAYLOAD_LIMIT_DEFAULT_BYTES', 64 * 1024);
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Payload too large (>${maxBytes} bytes)`);
    }
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error(`Payload too large (>${maxBytes} bytes)`);
  }
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid JSON');
  }
  if (options.schema) {
    const res = options.schema.safeParse(json);
    if (!res.success) {
      const details = res.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ');
      throw new Error(`Invalid payload: ${details}`);
    }
    return res.data;
  }
  return json as T;
}
export function getEnvInt(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
