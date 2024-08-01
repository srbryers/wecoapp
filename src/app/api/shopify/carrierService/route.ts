import { firestore } from "@/app/utils/firestore/firestore";
import { LineItem, CarrierServiceResponse, ShippingProfile } from "@/app/utils/types";
import { shopify } from "@/app/actions/shopify";
import { getShipmentZone } from "@/app/utils/carrierServices";

export async function GET(request: Request) {
  return Response.json({ message: 'Hello' })
}

export async function POST(request: Request) {

  const db = firestore().db

  // Setup the carrier service request
  const carrierServiceRequest = await request.json() // carrierRequest
  const destinationZip = carrierServiceRequest.rate.destination.postal_code?.indexOf("-") ? carrierServiceRequest.rate.destination.postal_code?.split("-")[0] : carrierServiceRequest.rate.destination.postal_code;
  const subscriptionItems = carrierServiceRequest.rate.items.filter((item: any) => item.properties && item.properties._bundleId)
  
  // Get the menuZone
  const menuZoneRequest = await getShipmentZone({
    destinationZip: destinationZip,
    lineItems: carrierServiceRequest.rate.items
  })

  const shipment_dates: { shipment_date: string, price: number, quantity: number }[] = [];

  if (!destinationZip) { 
    console.error("No destination zip found on the request.")
    return Response.json({
      rates: [] as CarrierServiceResponse[]
    }, { status: 200 })
  }

  if (!menuZoneRequest.isValidShipment) { 
    console.error("Shipping not available for this menu zone.")
    return Response.json({
      rates: [] as CarrierServiceResponse[]
    }, { status: 200 })
  }

  // Get the rate price
  const rateField = menuZoneRequest.menuZone.fields.find((x: any) => x.key === 'shipping_rate')?.value
  const zoneRate = rateField && Number(JSON.parse(rateField).amount)

  console.log("zoneRate", zoneRate)

  // Filter out the delivery skus if applicable
  const lineItems = carrierServiceRequest.rate.items.filter((item: LineItem) => {
    return !item?.name?.includes("Delivery")
  })
  // Get the shipment dates from the line_items
  lineItems.forEach((item: any) => {
    // Get the shipment date from the SKU, if it exists
    let shipment_date = new Date().toISOString().split("T")[0]
    if (item.sku && item.sku.includes("-")) {
      const item_sku = item.sku.split("-")
      item_sku.shift()
      shipment_date = item_sku.join("-")
    }
    const existingShipment = shipment_dates.find((t: any) => (t.shipment_date === shipment_date))
    if (existingShipment) {
      existingShipment.quantity += item.quantity
    } else {
      shipment_dates.push({
        quantity: item.quantity,
        price: item.price,
        shipment_date: shipment_date
      })
    }
  })

  // Get Shipping Profiles
  const shippingProfiles = await db.collection('shipping').get().then((response) => {
    return response.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data()
      }
    })
  }) as ShippingProfile[]

  console.log("shippingProfiles", shippingProfiles)

  // Calculate the rates for each shipment date and add them together
  const rates = shipment_dates.map(({ shipment_date, price, quantity }) => {

    console.log("shipment_date", shipment_date)
    /**
     * SET SHIPPING RATES HERE
     */
    const rateResponse = [] as CarrierServiceResponse[]

    shippingProfiles.forEach((profile: ShippingProfile) => {

      profile?.rates?.forEach((rate) => {
        const ratePrice = Number(rate.price) > 0 ? zoneRate : 0

        if (rate.type === 'price'
          && Number(price) >= Number(rate.min) // If the price is greater than the min
          && (
            Number(price) <= Number(rate.max) // If the price is less than the max
            || Number(rate.max) === 0 // OR If the max is 0
          )) {
          const serviceResponse = {
            service_name: `${profile.service_name}`,
            description: profile.description,
            service_code: profile.service_code,
            currency: "USD",
            total_price: ratePrice*100,
            phone_required: profile.phone_required,
            // min_delivery_date: shipment_date,
            // max_delivery_date: shipment_date
          } as CarrierServiceResponse
          rateResponse.push(serviceResponse)
        }
      })
    })

    return rateResponse

  }).flat()

  // Reduce the rates to unique service names
  const uniqueRates = rates.reduce((acc: CarrierServiceResponse[], rate: CarrierServiceResponse) => {
    const existingRate = acc.find((r) => r.service_name === rate.service_name)

    if (!existingRate) {
      acc.push(rate)
    } else {
      existingRate.total_price = (Number(existingRate.total_price)+ Number(rate.total_price))
    }
    // Handle the min and max delivery dates
    if (existingRate?.min_delivery_date && existingRate?.max_delivery_date
      && rate?.min_delivery_date && rate?.max_delivery_date
    ) {
      if (existingRate.min_delivery_date > rate.min_delivery_date) {
        existingRate.min_delivery_date = rate.min_delivery_date
      }
      if (existingRate.max_delivery_date < rate.max_delivery_date) {
        existingRate.max_delivery_date = rate.max_delivery_date
      }
    }
    return acc
  }, [])

  // Set the rate service name based on the zone + if it is subscription
  rates.forEach((rate) => {
    const shipping_service_name = menuZoneRequest.menuZone.fields.find((x: any) => x.key === 'shipping_service_name')?.value
    const free_shipping_minimum = menuZoneRequest.menuZone.fields.find((x: any) => x.key === 'free_shipping_minimum')?.value
    const shipping_cost = menuZoneRequest.menuZone.fields.find((x: any) => x.key === 'shipping_cost')?.value

    console.log("shipping_service_name", shipping_service_name, free_shipping_minimum, shipping_cost)

    if (subscriptionItems.length > 0 && shipping_service_name) {
      rate.service_name = shipping_service_name
      rate.description = shipping_service_name

      // handle free shipping
      if (free_shipping_minimum && shipping_cost) {
        const freeShippingMinimum = JSON.parse(free_shipping_minimum).amount
        const shippingCost = JSON.parse(shipping_cost).amount

        const lineItemsTotal = carrierServiceRequest.rate.items.reduce((acc: number, item: any) => { 
          if (item.properties.Type === 'Freebie') return acc
          return acc + (Number(item.price/100) * item.quantity) 
        }, 0)
        console.log("lineItemsTotal", lineItemsTotal)
        console.log("free_shipping_minimum", freeShippingMinimum)
        if (lineItemsTotal >= Number(freeShippingMinimum)) {
          rate.total_price = 0
        } else {
          rate.total_price = Number(shippingCost)*100
        }
      }
    }
  })
  
  console.log("uniqueRates", JSON.stringify(uniqueRates))

  // Return the rates
  return Response.json({
    rates: uniqueRates as CarrierServiceResponse[]
  }, { status: 200 })
}