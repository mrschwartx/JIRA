export const dynamic = 'force-static'

export function GET() {
  return new Response('OK', { headers: { 'content-type': 'text/plain' } })
}
