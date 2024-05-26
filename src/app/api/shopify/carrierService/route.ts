import { CarrierServiceResponse } from "@/app/_utils/types";

export async function GET(request: Request) {
  return Response.json({ message: 'Hello' })
}

export async function POST(request: Request) {

  // const carrierServiceRequest = await testGetCarrierRequest(request);
  const carrierServiceRequest = await request.json() // carrierRequest
  console.log("carrierServiceRequest", carrierServiceRequest)
  const carrierServiceResponse: { rates: any[]} = { rates: [] }
  const shipment_dates: { shipment_date: string, quantity: number }[] = [];

  // Get the shipment dates from the line_items
  carrierServiceRequest.rate.items.forEach((item: any) => {
    const item_sku = item.sku.split("-")
    item_sku.shift()
    const shipment_date = item_sku.join("-")
    const existingShipment = shipment_dates.find((t: any) => (t.shipment_date === shipment_date))
    if (existingShipment) {
      existingShipment.quantity += item.quantity
    } else {
      shipment_dates.push({
        quantity: item.quantity,
        shipment_date: shipment_date
      })
    }
  })

  // Calculate the rates for each shipment date and add them together
  const rates = shipment_dates.map(({ shipment_date, quantity }) => {
    /**
     * SET SHIPPING RATES HERE
     */
    // Set shipping price based on thresholds
    const shipping_price = quantity < 5 ? 600 : 0

    // Return the rate
    return {
      service_name: "Local Delivery",
      description: "Local Delivery within New England",
      service_code: "local_delivery_NE",
      currency: "USD",
      total_price: shipping_price,
      phone_required: false,
      min_delivery_date: shipment_date,
      max_delivery_date: shipment_date
    } as CarrierServiceResponse
  }).reduce((acc: any, rate: any) => {
    acc.total_price += rate.total_price
    // Check the min and max delivery dates
    if (rate.min_delivery_date < acc.min_delivery_date) {
      acc.min_delivery_date = rate.min_delivery_date
    }
    if (rate.max_delivery_date > acc.max_delivery_date) {
      acc.max_delivery_date = rate.max_delivery_date
    }
    return acc
  })

  // Return the rates
  carrierServiceResponse.rates.push(rates)

  return Response.json(carrierServiceResponse)
}