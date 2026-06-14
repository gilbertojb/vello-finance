import { fileTypeFromBuffer } from 'file-type'
import { z } from 'zod'

export const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

export const ALLOWED_EXT_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, 'Arquivo vazio')
  .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, 'Máximo 10MB')
  .refine(
    (f) => ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number]),
    'Tipo não permitido',
  )

export type FileValidationResult =
  | { ok: true; buffer: Buffer; detectedMime: string; ext: string }
  | { ok: false; error: string }

export async function validateUploadedFile(file: File): Promise<FileValidationResult> {
  const parsed = fileSchema.safeParse(file)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Arquivo inválido' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)
  if (!detected) return { ok: false, error: 'Arquivo inválido' }
  if (!ALLOWED_MIME.includes(detected.mime as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: 'Arquivo inválido' }
  }
  if (detected.mime !== file.type) return { ok: false, error: 'Arquivo inválido' }

  const ext = ALLOWED_EXT_MAP[detected.mime]
  if (!ext) return { ok: false, error: 'Arquivo inválido' }

  return { ok: true, buffer, detectedMime: detected.mime, ext }
}
