export async function POST(req: Request) {
  const { order } = await req.json()
  console.log("order", order)
  return Response.json({ success: true, order: order })
}
