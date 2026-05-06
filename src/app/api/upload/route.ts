import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Supported file types
const TIPOS_PERMITIDOS: Record<string, string[]> = {
  imagem: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'],
  documento: ['application/pdf', 'text/plain', 'text/csv', 'application/json', 'text/markdown'],
  codigo: ['text/javascript', 'text/typescript', 'text/html', 'text/css', 'application/xml', 'text/x-python', 'text/x-java'],
}

const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10MB

function obterTipoArquivo(mimeType: string): string {
  if (TIPOS_PERMITIDOS.imagem.includes(mimeType)) return 'imagem'
  if (TIPOS_PERMITIDOS.documento.includes(mimeType)) return 'documento'
  if (TIPOS_PERMITIDOS.codigo.includes(mimeType)) return 'codigo'
  return 'outro'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('arquivo') as File | null

    if (!file) {
      return NextResponse.json({ erro: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Check file size
    if (file.size > TAMANHO_MAXIMO) {
      return NextResponse.json({ erro: `Arquivo muito grande. Máximo: ${TAMANHO_MAXIMO / 1024 / 1024}MB` }, { status: 400 })
    }

    // Check file type
    const tipoArquivo = obterTipoArquivo(file.type)
    if (tipoArquivo === 'outro') {
      return NextResponse.json({ erro: 'Tipo de arquivo não suportado' }, { status: 400 })
    }

    // Generate unique filename
    const extensao = file.name.split('.').pop() || 'bin'
    const nomeUnico = `${uuidv4()}.${extensao}`

    // Save file to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, nomeUnico)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // For images, also create a base64 version for VLM analysis
    let base64Data: string | null = null
    if (tipoArquivo === 'imagem') {
      base64Data = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`
    }

    // For text-based files, read content
    let textoConteudo: string | null = null
    if (tipoArquivo === 'documento' || tipoArquivo === 'codigo') {
      textoConteudo = await file.text()
    }

    const resultado = {
      nome: file.name,
      tipo: file.type,
      tipoArquivo,
      tamanho: file.size,
      url: `/uploads/${nomeUnico}`,
      base64: base64Data,
      textoConteudo,
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ erro: 'Erro ao processar upload' }, { status: 500 })
  }
}
