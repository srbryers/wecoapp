export async function POST(req: Request) {
  const { order } = await req.json()
  console.log("[SHIPSTATION] order", order)
  return new Response("OK", { status: 200 })
}