import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import ReactPDF from "@react-pdf/renderer"
import BagTags from "@/app/documents/BagTags"
import React from "react"
import { Document } from '@react-pdf/renderer';

export async function POST(req: Request) {
  const body = await req.json()

  console.log("[Create Bag Tags] body", body)

  if (!body.orderName && !body.orderId) {
    return Response.json({ success: false, error: "One of orderName or orderId is required" }, { status: 400 })
  }

  // Get the order from Shopify
  const ordersList = await shopify.orders.list(`query: "name:${body.orderName}"`)
  const order = ordersList?.orders?.nodes?.[0]
  if (!order) {
    return Response.json({ success: false, error: "Order not found" }, { status: 404 })
  }

  // Get the delivery dates from CIGO
  const deliveryDates = await cigo.helpers.getDeliveryDates(order)
  const deliveryDate = deliveryDates?.[0]
  console.log("[Create Bag Tags] deliveryDates", deliveryDates)

  // Render the bag tag function component
  const stream = await ReactPDF.renderToStream(
    React.createElement(Document, {},
      React.createElement(BagTags, { order, deliveryDate })
    )
  )

  console.log("[Create Bag Tags] renderedBagTagStream", stream)

  // const stream = await renderBagTags({ order, deliveryDate: body.deliveryDate })

  // console.log("[Create Bag Tags] stream", stream)
  // const pdfBuffer = await new Promise(function(resolve, reject) {
  //   const buffers: Buffer[] = []
  //   stream.on('data', (data) => {
  //     console.log("[Create Bag Tags] data", data)
  //     buffers.push(data)
  //   })
  //   stream.on('end', () => {
  //     resolve(Buffer.concat(buffers))
  //   })
  //   stream.on('error', reject)
  // })

  // console.log("[Create Bag Tags] pdfBuffer", buffer)
  // Create bag tag pdfs
  return Response.json({ success: true })
}