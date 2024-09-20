import { shopify } from "@/app/actions/shopify"
import { Order } from "@/app/utils/types"

const check = ( itemToCheck: any, message: string, status: number) => {
  if (!itemToCheck) {
    return Response.json({ message }, { status })
  }
}

/**
 * Create a bundle order in our chosen platform
 * - Fired by the creation of a new Shopify order with a "_bundleVariantId" and "_productVariantIds" customAttribute/note_attributes
 */
export async function POST(request: Request) {
  const json = await request.json()
  
  // 1. Get the shopify order_id from the request and 
  const orderId = json?.order_id as string
  const allowDuplicates = json?.allow_duplicates as boolean || false

  // 2. Get the shopify order from the shopify REST api
  const order = await shopify.orders.get(orderId.split("/").pop() as string) as Order

  check(order, "No order found", 400)

  // 3. Get the attributes from the shopify order
  const bundleVariantId = order.note_attributes?.find((attribute) => attribute.name === "_bundleVariantId")?.value
  const productVariantLines = order.note_attributes?.find((attribute) => attribute.name === "_productVariantIds")?.value.split(",").map((item) => {
    return {
      id: item.split("|")[0],
      quantity: parseInt(item.split("|")[1])
    }
  })

  check(bundleVariantId, "No bundle variant id found", 400)
  check(productVariantLines, "No product variant ids found", 400)

  // 5. Edit the order in Shopify and add the variants
  const updatedOrder = await shopify.orders.editAddVariants({
    order_id: orderId,
    variantLines: productVariantLines,
    allowDuplicates: allowDuplicates
  })

  check(updatedOrder, "Failed to update order", 400)
  if (updatedOrder.success === false) {
    return Response.json({ message: "Failed to update order", errors: updatedOrder.lineItemErrors }, { status: 400 })
  }

  return Response.json({ message: "Order updated", updatedOrder }, { status: 200 })

}