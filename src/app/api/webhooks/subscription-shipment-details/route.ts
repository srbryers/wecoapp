import { shipStation } from "@/app/actions/shipStation"
import { shopify } from "@/app/actions/shopify"
import { getShipmentZone } from "@/app/utils/carrierServices"
import { calculateAvailableDeliveryDates } from "@/app/utils/helpers"

export async function POST(request: Request) {

  const requestJson = await request.json()
  console.log("requestJson", requestJson)

  if (!requestJson.order_id) {
    return Response.json({ message: 'Error: please provide a Shopify Order ID' }, { status: 400 })
  }

  // Get the order from Shopify
  const order = await shopify.orders.get(requestJson.order_id)

  if (!order) {
    return Response.json({ message: 'Error: Could not find Shopify order ID' }, { status: 400 })
  }

  console.log("order number", order.name)

  // Get the order from ShipStation (so that we can update it)
  const shipStationOrders = (await shipStation.orders.get(`?orderNumber=${order.name}`)).orders

  if (shipStationOrders.length === 0) {
    return Response.json({ message: 'Error: Could not find order in ShipStation' }, { status: 400 })
  }

  // console.log("shipStationOrder", shipStationOrders)

  // Get the delivery date and the shipment zone
  const deliveryDate = order.note_attributes.find((x: { name: string, value: string }) => x.name === 'Delivery Date').value
  const menuZoneRequest = await getShipmentZone({
    destinationZip: order.shipping_address.zip,
    lineItems: order.line_items
  })

  if (!menuZoneRequest.isValidShipment) {
    return Response.json({ message: 'Error: Shipment is not valid for our menu zones' }, { status: 400 })
  }

  console.log("deliveryDate", deliveryDate)
  const menuZone = menuZoneRequest.menuZone
  
  if (menuZone.menu_type && menuZone.menu_type !== 'Subscription') {
    return Response.json({ message: 'Success: Shipment is not a subscription, so ShipStation was not updated.' }, { status: 200 })
  }

  // Calculate the shipByDate
  const orderDate = new Date(order.created_at.split("T")[0])
  const availableDeliveryDates = calculateAvailableDeliveryDates(menuZone, orderDate)

  console.log("availableDeliveryDates", availableDeliveryDates)

  // Update the shipStationOrder
  const shipStationOrder = shipStationOrders[0]
  const updateOrderRequest = {
    orderId: shipStationOrder.orderId,
    advancedOptions: {
      customField1: deliveryDate
    }
  }


  return Response.json({ message: updateOrderRequest }, { status: 200 })
}