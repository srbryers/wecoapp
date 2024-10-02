export async function POST(req: Request) {
  const json = await req.json()
  console.log("request json", json)
  return Response.json({ success: true })
}