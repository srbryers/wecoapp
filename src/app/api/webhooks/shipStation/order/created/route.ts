import { shipStation } from "@/app/actions/shipStation"
import { shopify } from "@/app/actions/shopify"
import { calculateShipByDate } from "@/app/utils/helpers"
import { Order } from "@/app/utils/types"

const SHIPSTATION_STORE_ID = 322511

export async function POST(request: Request) {

  /**
   * ShipStation Order Updated Webhook
   * - Fired by ShipStation when an order is updated
   * Actions taken:
   * 1. Update the deliver by date
   * 2. Update the ship by date (different for Edison, NJ vs. Salem, NH)
   * 3. Assign batches for each location with batch allocation assigned to ship by date
   * 4. Tag the orders
   */

  const json = await request.json()

  console.log("ShipStation Order Updated Webhook", JSON.stringify(json))

  if (!json.resource_url) {
    console.error("Missing resource_url in request", json)
    return Response.json({ error: "Missing resource_url in request" }, { status: 500 })
  }

  // console.log("ShipStation Order Updated Webhook", json)

  const resourceParams = `?${json.resource_url.split("?").pop()}`
  const res = await shipStation.orders.get(resourceParams)

  if (!res?.orders?.[0]) {
    console.error("Error getting order from ShipStation", json)
    return Response.json({ error: "Error getting order from ShipStation" }, { status: 500 })
  }

  // 1. Update the deliver by date
  // Get the order from shopify by the orderKey
  const shipStationOrder = res.orders[0]
  const shopifyOrder = await shopify.orders.get(shipStationOrder.orderKey) as Order

  if (!shopifyOrder) {
    console.error("Error getting order from Shopify", json)
    return Response.json({ error: "Error getting order from Shopify" }, { status: 500 })
  }
  // Filter out orders that are not subscriptions
  if (shopifyOrder.tags?.toLowerCase().includes("subscription") === false) {
    console.log("Order is not a subscription", shopifyOrder)
    return Response.json({ message: "Order is not a subscription, no actions taken." }, { status: 200 })
  }

  // Get the delivery date
  const deliveryDateString = shopifyOrder.note_attributes?.find((attr) => attr.name === "Delivery Date")?.value
  if (!deliveryDateString) {
    console.error("Error getting delivery date from Shopify order", shopifyOrder)
    return Response.json({ error: "Error getting delivery date from Shopify order" }, { status: 500 })
  }

  // Get the ship by date
  const deliveryDate = new Date(deliveryDateString)
  const shipByDate = await calculateShipByDate(deliveryDate, shopifyOrder)

  if (!shipByDate) {
    console.error("Error calculating ship by date", deliveryDate, shopifyOrder)
    return Response.json({ error: "Error calculating ship by date" }, { status: 500 })
  }

  console.log("Delivery Date", deliveryDate)
  console.log("Ship By Date", shipByDate)

  // Update the ShipStation order with the dates
  const updatedOrder = await shipStation.orders.update({
    ...shipStationOrder,
    shipByDate: shipByDate.toISOString(),
    advancedOptions: {
      customField1: deliveryDateString,
      storeId: SHIPSTATION_STORE_ID
    }
  })

  // @TODO: Add tagging logic here
  // Tagging Logic
  // 1. Get the tags list
  // const tags = await shipStation.tags.get()
  // console.log("tags", tags)
  // @TODO: Add batch allocation logic here

  return Response.json({ message: updatedOrder }, { status: 200 })
}