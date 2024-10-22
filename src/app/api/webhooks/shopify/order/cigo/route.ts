import { cigo } from "@/app/actions/cigo"
import { shipStation } from "@/app/actions/shipStation"
import { shopify } from "@/app/actions/shopify"
import { getShipmentZone } from "@/app/utils/carrierServices"
import { delay } from "@/app/utils/helpers"
import { LineItem, Order, ShipStationDimensions, ShipStationOrder, ShipStationOrderItem } from "@/app/utils/types"
import crypto from "node:crypto"

const BOX_DIMENSIONS: Record<string, ShipStationDimensions> = {
  "standard": {
    "units": "inches",
    "length": 18,
    "width": 16,
    "height": 14,
  },
  "large": {
    "units": "inches",
    "length": 10,
    "width": 10,
    "height": 10,
  }
}

const BOX_WEIGHTS: Record<string, number> = {
  "standard": 16,
  "large": 24,
}

const DEFAULT_CARRIER_MAP: Record<string, string> = {
  "Standard Delivery - East": "axlehire",
  "Standard Delivery - Northeast": "ups",
}

const DEFAULT_SERVICE_CODE_MAP: Record<string, string> = {
  "Standard Delivery - East": "axlehire_next",
  "Standard Delivery - Northeast": "ups_ground",
}

const SHIP_BY_DATE_MAP: Record<string, number> = {
  "Standard Delivery - East": 1,
  "Standard Delivery - Northeast": 2,
}

const getShipByDate = (order: Order, storedDeliveryDate: string) => {

  if (!storedDeliveryDate) {
    return null
  }

  const deliveryDate = new Date(storedDeliveryDate || "")
  console.log(`[${order.name}] deliveryDate`, deliveryDate)
  const orderShipMethod = order.shippingLine?.title
  console.log(`[${order.name}] orderShipMethod`, orderShipMethod)

  if (orderShipMethod && SHIP_BY_DATE_MAP[orderShipMethod]) {
    const shipByDate = new Date(deliveryDate.setDate(deliveryDate.getDate() - SHIP_BY_DATE_MAP[orderShipMethod]))
    console.log(`[${order.name}] shipByDate`, shipByDate)
    return shipByDate
  } else {
    const shipByDate = new Date(deliveryDate.setDate(deliveryDate.getDate() - 1))
    return shipByDate
  }
}

const handleOrder = async (order: Order, payload: any) => {

  let res: {
    success: boolean,
    message: string,
    data: any
  } = {
    success: true,
    message: "",
    data: null
  }

  const now = new Date()
  const orderLastUpdated = new Date(order.updatedAt || "")
  const orderCreated = new Date(order.createdAt || "")
  const orderFulfillmentStatus = order.displayFulfillmentStatus
  const orderStatus = order.displayFinancialStatus
  const isPickup = (order.tags?.includes("pickup") || !order.shippingAddress) ?? false
  const isSubscription = order?.lineItems?.nodes?.some((lineItem: any) => lineItem?.sellingPlan?.sellingPlanId) || order?.tags?.includes("Subscription")
  const isCancelled = Boolean(payload.cancelledAt || order.cancelledAt)
  // Get unique variant dates
  const variantDates = order?.lineItems?.nodes?.map((lineItem: any) => lineItem?.name?.split(" - ")[1])
  const uniqueVariantDates = Array.from(new Set(variantDates))
  console.log(`[${order.name}] variantDates`, variantDates)
  let missingJobs = false
  const existingJobs = []

  for (const date of uniqueVariantDates) {
    const existingJob = await cigo.jobs.search({
      start_date: date,
      end_date: date,
      invoice_number: `${order?.id?.toString().split("/").pop()}-${date}`
    })
    console.log(`[${order.name}] existingJob`, existingJob)
    if (!existingJob?.post_staging?.ids?.length) {
      missingJobs = true
    } else {
      existingJobs.push(...existingJob?.post_staging?.ids)
    }
  }

  // console.log("[CIGO] order", JSON.stringify(order))
  console.log(`[${order.name}] existingJobs`, existingJobs)
  console.log(`[${order.name}] Order is a subscription order: `, isSubscription)
  console.log(`[${order.name}] Order is cancelled: `, isCancelled)
  console.log(`[${order.name}] Order is pickup: `, isPickup)
  console.log(`[${order.name}] Order status: `, orderStatus)
  console.log(`[${order.name}] Order fulfillment status: `, orderFulfillmentStatus)

  if (isSubscription) {
    /**
     * Handle Subscription/ShipStation Orders
     */
    console.log(`[${order.name}] Order is a subscription order`)

    // Create the order request so that we can compare it to the existing order in ShipStation, OR create a new order if it doesn't exist
    const deliveryDate = payload.deliveryDate || order.customAttributes?.find((attr: any) => attr.key === "Delivery Date")?.value
    const defaultCarrier = DEFAULT_CARRIER_MAP[order.shippingLine?.title ?? ""] || "ups"
    const defaultServiceCode = DEFAULT_SERVICE_CODE_MAP[order.shippingLine?.title ?? ""] || "ups_ground"

    // Get the menu zone and ship by date
    const shipByDate = getShipByDate(order, deliveryDate)
    const menuZone = (await getShipmentZone({
      destinationZip: order?.shippingAddress?.zip || "",
      lineItems: order?.lineItems?.nodes || []
    }))?.menuZone
    console.log(`[${order.name}] menuZone:`, menuZone?.handle)
    console.log(`[${order.name}] shipByDate:`, shipByDate)

    // Get the production tags
    const productionTags = shipByDate && menuZone ? shipStation.helpers.getProductionTag(shipByDate, menuZone) || [] : []
    console.log(`[${order.name}] productionTags:`, JSON.stringify(productionTags))
    const requestedShippingService = menuZone?.handle === "edison-nj" ? "Standard Delivery - East" : "Standard Delivery - Northeast"
    console.log(`[${order.name}] requestedShippingService:`, requestedShippingService)

    let orderRequest = {
      orderDate: new Date(order.createdAt || "").toISOString().split("T")[0],
      shipByDate: shipByDate?.toISOString().split("T")[0],
      orderKey: order.id?.toString().split("/").pop() || "",
      orderNumber: order.name || "",
      orderStatus: "awaiting_shipment",
      requestedShippingService: requestedShippingService,
      carrierCode: defaultCarrier,
      serviceCode: defaultServiceCode,
      confirmation: "none",
      customerUsername: `${order?.customer?.id}`.split("/").pop(),
      customerEmail: order.email || "",
      billTo: {
        name: order.billingAddress?.firstName + " " + order.billingAddress?.lastName,
        street1: order.billingAddress?.address1 || "",
        street2: order.billingAddress?.address2 || "",
        city: order.billingAddress?.city || "",
        state: order.billingAddress?.provinceCode || "",
        country: order.billingAddress?.countryCode || "",
        postalCode: order.billingAddress?.zip || "",
        phone: order.billingAddress?.phone || "",
      },
      shipTo: {
        name: order.shippingAddress?.firstName + " " + order.shippingAddress?.lastName,
        street1: order.shippingAddress?.address1 || "",
        street2: order.shippingAddress?.address2 || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.provinceCode || "",
        country: order.shippingAddress?.countryCode || "",
        postalCode: order.shippingAddress?.zip || "",
        phone: order.shippingAddress?.phone || "",
      },
      items: order.lineItems?.nodes?.map((lineItem: LineItem) => {
        const item: ShipStationOrderItem = {
          sku: lineItem.sku || "",
          name: lineItem.name.split(" - ")[0] || "",
          lineItemKey: lineItem.id?.toString().split("/").pop() || "",
          imageUrl: lineItem.image?.url || "",
          quantity: lineItem.quantity || 0,
          unitPrice: lineItem.originalUnitPriceSet?.presentmentMoney?.amount ? parseFloat(lineItem.originalUnitPriceSet?.presentmentMoney?.amount) : 0,
        }
        return item
      }),
      amountPaid: order.totalPriceSet?.presentmentMoney?.amount ? parseFloat(order.totalPriceSet?.presentmentMoney?.amount) : 0,
      taxAmount: order.totalTaxSet?.presentmentMoney?.amount ? parseFloat(order.totalTaxSet?.presentmentMoney?.amount) : 0,
      shippingAmount: order.shippingLine?.originalPriceSet?.presentmentMoney?.amount ? parseFloat(order.shippingLine?.originalPriceSet?.presentmentMoney?.amount) : 0,
      customerNotes: order.note || "",
      advancedOptions: {
        customField1: deliveryDate,
        customField2: "",
        customField3: Array.isArray(order.tags) ? order.tags?.join(", ") || "" : order.tags || "",
        source: order.channelInformation?.app?.title || "",
        storeId: 322511,
      },
      dimensions: BOX_DIMENSIONS[order.lineItems?.nodes?.length && order.lineItems?.nodes?.length > 6 ? "large" : "standard"],
      weight: {
        value: order.lineItems?.nodes?.length && order.lineItems?.nodes?.length > 6 ? BOX_WEIGHTS["large"] : BOX_WEIGHTS["standard"],
        units: "pounds",
      },
      tagIds: productionTags?.length > 0 ? productionTags : [],
    } as ShipStationOrder

    // Now, check if the order is already in ShipStation
    const shipStationOrders = (await shipStation.orders.list(`?orderNumber=${order.name}`))?.orders?.filter((shipStationOrder: ShipStationOrder) => {
      return (shipStationOrder.orderStatus === "awaiting_shipment" || shipStationOrder.orderStatus === "shipped")
        && shipStationOrder.orderKey?.includes(order.id?.toString().split("/").pop() || "")
    }) || []

    console.log(`[${order.name}] shipStationOrders:`, JSON.stringify(shipStationOrders))

    if (shipStationOrders?.length > 0) {
      // If the order is cancelled, cancel the order in ShipStation
      if (isCancelled) {
        // Cancel the order in ShipStation
        const cancelOrderResponse = await shipStation.orders.delete(shipStationOrders[0].orderId)
        console.log(`[${order.name}] cancelOrderResponse`, cancelOrderResponse)
        return {
          success: true,
          message: "Order cancelled in ShipStation",
          orderNumber: order.name,
          data: shipStationOrders[0]
        }
      } else {
        // If the order is not cancelled, then compare the createRequeset to the existing order in ShipStation
        const orderRequestKeys = Object.keys(orderRequest)
        const existingOrder = Object.entries(shipStationOrders[0]).map(([key, value]) => {
          if (orderRequestKeys.includes(key)) {
            return {
              key: key,
              value: value,
            }
          }
        }).filter((item: any) => item !== undefined).reduce((acc: any, item: any) => {
          acc[item.key] = item.value
          return acc
        }, {})
        // console.log(`[${order.name}] orderRequest`, JSON.stringify(orderRequest))
        // console.log(`[${order.name}] existingOrder`, JSON.stringify(existingOrder))
        console.log(`[${order.name}] orders are the same?`, JSON.stringify(orderRequest) === JSON.stringify(existingOrder))
        if (JSON.stringify(orderRequest) === JSON.stringify(existingOrder)) {
          console.log(`[${order.name}] orders are the same, skipping`)
          return {
            success: true,
            message: "Order already in ShipStation",
            orderNumber: order.name,
            data: { orderRequest, existingOrder }
          }
        } else {
          console.log(`[${order.name}] orders are different, updating order in ShipStation`)
          const updateOrderResponse = await shipStation.orders.update(orderRequest)
          return {
            success: true,
            message: "Order updated in ShipStation",
            orderNumber: order.name,
            data: { orderRequest, existingOrder, updateOrderResponse }
          }
        }
      }
    } else {
      // If the order is cancelled, but not in ShipStation, return an error
      if (isCancelled) {
        console.log(`[${order.name}] order is cancelled, but not in ShipStation, skipping`)
        return {
          success: false,
          message: "Order is cancelled, but not in ShipStation",
          orderNumber: order.name,
          data: order
        }
      }

      // Check required fields
      if (!order.billingAddress || !order.shippingAddress || !order.lineItems?.nodes) {
        console.log(`[${order.name}] order is missing required fields, skipping`)
        return {
          success: false,
          message: "Order is missing required fields",
          orderNumber: order.name,
          data: { fields: ["billingAddress", "shippingAddress", "lineItems"] }
        }
      }

      // Create the order in ShipStation
      console.log(`[${order.name}] creating order in ShipStation`)
      // Remove the order key from the order request
      // delete orderRequest.orderKey
      console.log(`[${order.name}] orderRequest`, JSON.stringify(orderRequest))
      let createOrderResponse = await shipStation.orders.create(orderRequest)

      // if (!createOrderResponse?.data?.success) {
      //   // We need to add a `-1` to the end of the order key
      //   orderRequest.orderKey = (order.id?.toString().split("/").pop() || "") + "-1"
      //   createOrderResponse = await shipStation.orders.create(orderRequest)
      // }

      console.log(`[${order.name}] created order in ShipStation`)
      return {
        success: true,
        message: "Order created in ShipStation",
        orderNumber: order.name,
        data: createOrderResponse
      }
    }

  } else if (isPickup) {
    /**
     * Handle Pickup Orders
     */
    console.log(`[${order.name}] Order is a pickup order`)
    return {
      success: true,
      message: "Order is a pickup order",
      orderNumber: order.name,
      data: order
    }

  } else if (orderLastUpdated.getTime() > (now.getTime() - (168 * 60 * 60 * 1000)) 
    && missingJobs 
    && variantDates && variantDates?.length > 0 
    && orderStatus !== "REFUNDED") {
    /**
     * Handle Local Delivery/CIGO Orders
     */
    console.log(`[${order.name}] Creating jobs for order`)
    // Add/update the job in CIGO
    // Check if the order has been sent to CIGO
    let existingJobs = []
    const deliveryDates = await cigo.helpers.getDeliveryDates(order)
    console.log("[CIGO] delivery dates", deliveryDates)

    for (const date of deliveryDates ?? []) {
      // Check if delivery date is before today, if so, we don't want to create a new job
      const deliveryDate = new Date(date)
      if (deliveryDate < now) {
        console.log(`[CIGO][${order.name}] delivery date of `, date, " is before today, skipping")
        continue
      }
      const existingJob = await cigo.jobs.search({
        start_date: date,
        invoice_number: `${order.id?.toString().split("/").pop()}-${date}`
      })
      console.log(`[CIGO][${order.name}] existingJob`, existingJob)
      if (existingJob?.post_staging?.count > 0) {
        console.log(`[CIGO][${order.name}] job already exists for order name: `, order.name, " with date: ", date)
        existingJobs.push(existingJob?.post_staging?.ids)
      } else {
        if (!isCancelled) {
          console.log(`[CIGO][${order.name}] job does not exist for order name: `, order.name, " with date: ", date)
          const data = await cigo.helpers.convertOrderToJob({ order, date, skip_staging: true })
          console.log(`[CIGO][${order.name}] creating job for order name: `, order.name, " with date: ", date)

          try {
            const job = await cigo.jobs.create(data)
            return {
              success: true,
              message: "Job created",
              orderNumber: order.name,
              data: job
            }
          } catch (error) {
            console.error(`[CIGO][${order.name}] error creating job`)
            return {
              success: false,
              message: "Error creating job",
              orderNumber: order.name,
              data: error
            }
          }
        } else {
          console.log(`[CIGO][${order.name}] job is cancelled, skipping creation`)
        }
      }
    }


    existingJobs = existingJobs.flat()
    console.log(`[CIGO][${order.name}] existing jobs`, existingJobs)
    console.log(`[CIGO][${order.name}] is job cancelled?`, isCancelled)
    // Now update existing jobs with any new job details
    for (const jobId of existingJobs) {
      // Get the job from CIGO
      const jobData = (await cigo.jobs.get(jobId))?.job
      if (jobData) {
        const date = jobData.date
        const jobOrderData = await cigo.helpers.convertOrderToJob({ order, date, skip_staging: true })
        const existingJobData = {
          quick_desc: jobData.quick_desc || "",
          first_name: jobData.first_name || "",
          last_name: jobData.last_name || "",
          phone_number: jobData.phone_number || "",
          mobile_number: jobData.mobile_number || "",
          email: jobData.email || "",
          apartment: jobData.apartment || "",
        }
        // Only get the phone number without the area code
        const phoneNumber = jobOrderData.phone_number.replace(/^(\+\d{1})(\d+)/, "$2")
        const mobileNumber = jobOrderData.mobile_number.replace(/^(\+\d{1})(\d+)/, "$2")
        const updateJobRequest = {
          quick_desc: jobOrderData.quick_desc,
          first_name: jobOrderData.first_name,
          last_name: jobOrderData.last_name,
          phone_number: phoneNumber,
          mobile_number: mobileNumber,
          email: jobOrderData.email,
          apartment: jobOrderData.apartment,
        }

        if (isCancelled) {
          // Make sure the job is removed from the itinerary
          const itineraries = (await cigo.itineraries.retrieveByDate(date))?.itineraries
          console.log(`[CIGO][${order.name}] itineraries`, itineraries)
          if (itineraries?.length > 0) {
            for (const itinerary of itineraries) {
              await cigo.itineraries.removeJob(itinerary.id, jobId)
            }
          }

          // Then delete the job
          await cigo.jobs.delete(jobId)
          console.log(`[CIGO][${order.name}] job deleted for order name: `, order.name, " with date: ", date)
          return {
            success: true,
            message: "Job deleted",
            orderNumber: order.name,
            data: jobId
          }

        } else if (JSON.stringify(existingJobData) !== JSON.stringify(updateJobRequest)) {
          console.log(`[CIGO][${order.name}] job data has changed, updating job`)
          const updatedJob = await cigo.jobs.update(jobId, updateJobRequest)
          console.log(`[CIGO][${order.name}] updated job for order name: `, order.name, " with date: ", date)
          return {
            success: true,
            message: "Job updated",
            orderNumber: order.name,
            data: updatedJob
          }
        } else {
          console.log(`[CIGO][${order.name}] job data has not changed, skipping update`)
        }

      }
    }
    return {
      success: true,
      message: "Order has been updated in the last 24hrs and is not fulfilled and paid",
      orderNumber: order.name,
      data: order
    }
  } else {
    console.log(`[CIGO][${order.name}] Order has not been updated in the last 24hrs and has an existing job`)
    return {
      success: true,
      message: "Order has not been updated in the last 24hrs and has an existing job",
      existingJobs: existingJobs,
      orderNumber: order.name,
      data: order
    }
  }
}

export async function POST(req: Request) {
  
  const body = await req.text()
  const payload = JSON.parse(body)

  // Lookback days
  let res: {
    success: boolean,
    message: string,
    data: any[]
  } = {
    success: true,
    message: "",
    data: []
  }
  const daysAgo = payload.daysAgo || 7
  const payloadDate = payload.date
  const payloadOrderId = payload.id

  // console.log("[CIGO] order", JSON.stringify(order))

  if (payloadOrderId) {
    
    /**
     * If there is an order ID, then this is a single order webhook
     */
    console.log(`[${payload.name}] Order ID: ${payloadOrderId}`)

    // Validate shopify hmac
    const hmac = req.headers.get("X-Shopify-Hmac-Sha256")
    if (!hmac) {
      return Response.json({ success: false, error: "Shopify HMAC not set" }, { status: 401 })
    }
    const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET_ORDERS_UPDATED
    if (!shopifyWebhookSecret) {
      return Response.json({ success: false, error: "Shopify webhook secret not set" }, { status: 500 })
    }
    // Generate HMAC from secret and request body
    const generatedHmac = crypto.createHmac('sha256', shopifyWebhookSecret).update(body).digest('base64')

    // Compare hmacs
    const result = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(generatedHmac))
    
    console.log(`[${payload.name}] HMAC comparison result:`, result)

    // console.log("payload", JSON.stringify(payload))

    // Return if HMAC is invalid
    // if (!result) {
    //   return Response.json({ success: false, error: "Invalid HMAC" }, { status: 401 })
    // }
    await delay(2000) // Wait for 2 seconds to make sure the order is updated
    const order = (await shopify.orders.list(`query: "id:${payload.id}"`))?.[0] as Order
    console.log(`[${payload.name}] Order:`, JSON.stringify(order))

    try {
      const result = await handleOrder(order, payload)
      res = {
        success: true,
        message: "Order processed",
        data: [...res.data, result]
      }
    } catch (error) {
      console.error(`[${payload.name}] Error processing order:`, error)
      res = {
        success: false,
        message: "Error processing order",
        data: [...res.data, error]
      }
    }

  } else if (daysAgo || payloadDate) {

    /**
     * If there is no order ID, then this is a lookback webhook
     */
    if (payloadDate) {
      console.log(`[${payload.name}] Looking back at orders from ${payloadDate}`)
    } else {
      console.log(`[${payload.name}] Looking back at last ${daysAgo} days of orders`)
    }
    const query = payloadDate ? `created_at:${payloadDate}` : `created_at:>${new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString()}`
    const orders = await shopify.orders.list(`query: "${query}"`)
    // console.log(`[${payload.name}] Orders:`, JSON.stringify(orders))
    for (const order of orders) {
      try {
        const result = await handleOrder(order, payload)
        res = {
          success: true,
          message: "Orders processed",
          data: [...res.data, result]
        }
      } catch (error) {
        console.error(`[${payload.name}] Error processing order:`, error)
      }
    }

  }

  return Response.json(res)

}
