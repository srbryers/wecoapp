import { shopify } from "@/app/_utils/shopify/api"

export async function GET(request: Request) {

  const orders = await shopify.orders.get()

  return Response.json({ message: orders })
}