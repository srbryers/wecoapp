const rates = [
  {
    "service_name": "Local Delivery",
    "service_code": "local_delivery_NE",
    "total_price": "600",
    "description": "Local Delivery within New England",
    "currency": "USD",
  },
  {
    "service_name": "Local Delivery (DC)",
    "service_code": "local_delivery_DC",
    "total_price": "600",
    "description": "Local Delivery within DC",
    "currency": "USD",
  },
]

const testGetCarrierRequest = async (request: Request) => {
  const requestOrigin = request.headers.get('origin')
  const orders = await fetch(`${requestOrigin}/api/shopify`, {
    method: 'POST',
    body: JSON.stringify({
      method: 'GET',
      path: '/orders.json'
    })
  })
  const json = await orders.json()

  // Transform the orders into CarrierServiceRequest type examples
  const carrierServiceRequests = json.orders.filter((order: any) => order.shipping_address !== null).map((order: any) => {
    return {
      id: order.id,
      rate: {
        origin: {
          country: "US",
          postal_code: "01720",
          province: "MA",
          city: "Acton"
        },
        destination: {
          country: order.shipping_address.country_code,
          postal_code: order.shipping_address.zip,
          province: order.shipping_address.province,
          city: order.shipping_address.city
        },
        items: order.line_items.map((item: any) => {
          const shipment_date = item.sku.split("-")
          shipment_date.shift()
          if (shipment_date.length > 0) {
            return {
              name: item.name,
              quantity: item.quantity,
              price: Number(item.price) * 100,
              grams: item.grams,
              product_id: item.product_id,
              variant_id: item.variant_id,
              requires_shipping: item.requires_shipping,
              sku: item.sku,
              // shipment_date: shipment_date.join("-")
            }
          }
        }).filter((value: any) => value !== undefined),
        currency: order.currency,
        locale: order.locale
      }
    }
  })

  console.log('CarrierServiceRequests:', JSON.stringify(carrierServiceRequests[0], null, 2))
  return carrierServiceRequests[0]
}

export async function GET(request: Request) {
  return Response.json({ message: 'Hello' })
}

export async function POST(request: Request) {

  // const carrierServiceRequest = await testGetCarrierRequest(request);
  const carrierServiceRequest = await request.json() // carrierRequest
  console.log("carrierServiceRequest", carrierServiceRequest)
  const carrierServiceResponse: any = []
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
    }
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
  carrierServiceResponse.push({
    id: carrierServiceRequest.id,
    rates: rates
  })

  return Response.json(carrierServiceResponse)
}