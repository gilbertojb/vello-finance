import { describe, expect, it } from 'vitest'
import {
  ALLOWED_MIME,
  ALLOWED_EXT_MAP,
  MAX_FILE_SIZE_BYTES,
  validateUploadedFile,
} from '@/app/(store)/meus-documentos/_lib/file-validation'

describe('constants', () => {
  it('allowed MIMEs include pdf and core image formats', () => {
    expect(ALLOWED_MIME).toContain('application/pdf')
    expect(ALLOWED_MIME).toContain('image/jpeg')
    expect(ALLOWED_MIME).toContain('image/png')
    expect(ALLOWED_MIME).toContain('image/webp')
    expect(ALLOWED_MIME).toContain('image/heic')
  })

  it('does NOT allow SVG, HTML, ZIP, DOC', () => {
    expect(ALLOWED_MIME).not.toContain('image/svg+xml')
    expect(ALLOWED_MIME).not.toContain('text/html')
    expect(ALLOWED_MIME).not.toContain('application/zip')
    expect(ALLOWED_MIME).not.toContain('application/msword')
  })

  it('extension map covers every allowed mime', () => {
    for (const mime of ALLOWED_MIME) expect(ALLOWED_EXT_MAP[mime]).toBeTruthy()
  })

  it('max file size is 10MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024)
  })
})

const PNG_MAGIC = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from([0x00, 0x00, 0x00, 0x0d]),
  Buffer.from('IHDR', 'ascii'),
  Buffer.alloc(13),
])
const PDF_MAGIC = Buffer.from('%PDF-1.4\n', 'ascii')

describe('validateUploadedFile', () => {
  it('accepts a valid PNG with matching MIME', async () => {
    const file = new File([PNG_MAGIC], 'doc.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.detectedMime).toBe('image/png')
      expect(result.ext).toBe('png')
    }
  })

  it('accepts a valid PDF', async () => {
    const file = new File([PDF_MAGIC], 'doc.pdf', { type: 'application/pdf' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(true)
  })

  it('rejects an empty file', async () => {
    const file = new File([], 'empty.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects when claimed MIME is not in allow-list (svg)', async () => {
    const file = new File([Buffer.from('<svg></svg>')], 'doc.svg', { type: 'image/svg+xml' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects when magic bytes do not match claimed MIME (html disguised as png)', async () => {
    const html = Buffer.from('<html><body>x</body></html>')
    const file = new File([html], 'doc.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects files larger than max size', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1)
    PNG_MAGIC.copy(big)
    const file = new File([big], 'doc.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })
})
