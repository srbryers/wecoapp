export async function POST(req: Request) {
  const json = await req.json()
  console.log("request json", JSON.stringify(json))
  return Response.json({ success: true })
}