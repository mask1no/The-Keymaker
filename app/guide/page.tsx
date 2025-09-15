import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import fs from 'fs/promises'; import path from 'path'; import { micromark } from 'micromark'

export default async function GuidePage() {
  const guidePath = path.join(process.cwd(), 'docs', 'guide.md')
  const guideContent = await fs.readFile(guidePath, 'utf-8').catch(()=> '# Guide\n\nNo guide.md found.')
  const guideHtml = micromark(guideContent)
  return (
    <div className="p-6">
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader><CardTitle>Guide</CardTitle></CardHeader>
        <CardContent><div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: guideHtml }} /></CardContent>
      </Card>
    </div>
  )
}
