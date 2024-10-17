import { shipStation } from "@/app/actions/shipStation"
import { shopify } from "@/app/actions/shopify"
import { getShipmentZone } from "@/app/utils/carrierServices"
import { calculateShipByDate } from "@/app/utils/helpers"
import { MenuZone, Order, ShipStationTags } from "@/app/utils/types"

const SHIPSTATION_STORE_ID = 322511
// const SHIPSTATION_PRODUCTION_TAGS = {
//   3226: 0, // Sunday Production (Salem, NH)
//   2685: 0, // Sunday Production (Edison, NJ)
//   2686: 1, // Monday Production
//   2905: 2, // Tuesday Production
// }

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

  console.log("[ShipStation] Order Updated Webhook", JSON.stringify(json))

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
  console.log("[ShipStation] shipStationOrder.orderNumber", shipStationOrder.orderNumber)
  const shopifyOrder = (await shopify.orders.list(`query:"name:${shipStationOrder.orderNumber}"`))?.orders?.nodes?.[0] as Order

  if (!shopifyOrder) {
    console.error(`[ShipStation][${shipStationOrder.orderNumber}] Error getting order from Shopify`, json)
    return Response.json({ error: "Error getting order from Shopify" }, { status: 500 })
  }
  // Filter out orders that are not subscriptions
  if (Array.isArray(shopifyOrder.tags) && shopifyOrder.tags?.some((tag) => tag.toLowerCase().includes("subscription")) === false) {
    console.log(`[ShipStation][${shipStationOrder.orderNumber}] Order is not a subscription`, shopifyOrder)
    return Response.json({ message: "Order is not a subscription, no actions taken." }, { status: 200 })
  }

  // Get the delivery date
  const deliveryDateString = shopifyOrder.customAttributes?.find((attr: any) => attr.key === "Delivery Date")?.value
  if (!deliveryDateString) {
    console.error(`[ShipStation][${shipStationOrder.orderNumber}] Error getting delivery date from Shopify order`, shopifyOrder)
    return Response.json({ error: "Error getting delivery date from Shopify order" }, { status: 500 })
  }

  // Get the ship by date
  const menuZone = (await getShipmentZone({
    destinationZip: shopifyOrder?.shippingAddress?.zip || "",
    lineItems: shopifyOrder?.lineItems?.nodes || []
  }))?.menuZone
  const deliveryDate = new Date(deliveryDateString)
  const shipByDate = await calculateShipByDate(deliveryDate, shopifyOrder, menuZone)

  if (!shipByDate) {
    console.error(`[ShipStation][${shipStationOrder.orderNumber}] Error calculating ship by date`, deliveryDate, shopifyOrder)
    return Response.json({ error: "Error calculating ship by date" }, { status: 500 })
  }

  // Tagging Logic
  // 1. Get the tags list
  const tags = await shipStation.tags.get()
  console.log(`[ShipStation][${shipStationOrder.orderNumber}] Tags`, JSON.stringify(tags))
  const productionTags = shipStation.helpers.getProductionTag(shipByDate, menuZone) || []

  console.log(`[ShipStation][${shipStationOrder.orderNumber}] productionTags`, JSON.stringify(productionTags))

  // Update the ShipStation order with the dates and tags
  const updatedOrder = await shipStation.orders.update({
    ...shipStationOrder,
    shipByDate: shipByDate.toISOString(),
    tagIds: productionTags?.length > 0 ? productionTags : shipStationOrder.tagIds || null,
    advancedOptions: {
      customField1: deliveryDateString,
      storeId: SHIPSTATION_STORE_ID
    }
  })

  return Response.json({ message: updatedOrder }, { status: 200 })
}