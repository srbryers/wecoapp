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
