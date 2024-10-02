/**
 * Bag Tags
 * 1. Create bag tags from the order
 * 2. Turn the bag tags into a PDF
 * 3. Refer to this component to render the bag tags
 */
"use client"

import { Order } from "../utils/types"

export default function BagTags({
  order,
  deliveryDate
}: {
  order: Order
  deliveryDate: string
}) {

  const lineItems = order.line_items || order.lineItems?.nodes || []
  const phone = order?.customer?.phone || order?.billingAddress?.phone || order?.shippingAddress?.phone || ""
  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="flex ">
        
      </div>

    </div>
  )
}

// export async function renderBagTags({
//   order,
//   deliveryDate
// }: {
//   order: Order
//   deliveryDate: string
// }) {
//   console.log("[renderBagTags] order", order)
//   return await ReactPDF.renderToStream(<BagTags order={order} deliveryDate={deliveryDate} />)
// }