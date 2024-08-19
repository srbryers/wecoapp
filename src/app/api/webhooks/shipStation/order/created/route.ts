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

const getProductionTag = (shipByDate: Date, menuZone: MenuZone) => {
  const productionDate = new Date(shipByDate)
  const productionLeadHours = menuZone.production_lead_time || 0
  const timeZoneOffsetHours = 0

  if (productionLeadHours === 0) {
    console.error("Could not find production lead time for menu zone", menuZone)
    return
  }

  // Subtract the production lead time from the ship by date
  productionDate.setDate(productionDate.getDate() - ((Number(productionLeadHours) + timeZoneOffsetHours) / 24))
  const productionDay = productionDate.getDay()
  let tags: Number[] = []

  console.log("Production Date", productionDate.toLocaleString())
  console.log("shipByDate", shipByDate.toLocaleString())

  // Ship By Tags
  if (shipByDate.getDay() === 3) {
    tags.push(3371) // Wednesday
  }

  // Return the tag based on the menu zone and production date
  if (productionDay === 0) { // Sunday
    if (menuZone.handle === "edison-nj") {
      tags.push(2685, 3365) // Sunday Production (Edison, NJ)
    } else {
      tags.push(3226, 3369) // Sunday Production (Salem, NH)
    }
  } else if (productionDay === 1) { // Monday
    if (menuZone.handle === "edison-nj") {
      tags.push(2686, 3366) // Monday Production (Edison, NJ)
    } else {
      tags.push(2686, 3370) // Monday Production (Salem, NH)
    }
  } else if (productionDay === 2) { // Tuesday
    if (menuZone.handle === "edison-nj") {
      tags.push(2905, 3367) // Tuesday Production
    } else {
      tags.push(2905, 3371) // Tuesday Production
    }
  } else {
    console.log("Production Day not found", productionDay)
  }

  return tags
}

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
  const menuZone = (await getShipmentZone({
    destinationZip: shopifyOrder?.shipping_address?.zip || "",
    lineItems: shopifyOrder?.line_items || []
  }))?.menuZone
  const deliveryDate = new Date(deliveryDateString)
  const shipByDate = await calculateShipByDate(deliveryDate, shopifyOrder, menuZone)

  // console.log("menuZone", menuZone)

  if (!shipByDate) {
    console.error("Error calculating ship by date", deliveryDate, shopifyOrder)
    return Response.json({ error: "Error calculating ship by date" }, { status: 500 })
  }

  console.log("Delivery Date", deliveryDate)
  console.log("Ship By Date", shipByDate)

  // @TODO: Add tagging logic here
  // Tagging Logic
  // 1. Get the tags list
  const tags = await shipStation.tags.get()
  console.log("Tags", tags)
  const productionTags = getProductionTag(shipByDate, menuZone) || []

  console.log("productionTags", productionTags)

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