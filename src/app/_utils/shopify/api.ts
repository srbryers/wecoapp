export type FulfillmentService = {
  id?: number,
  name?: string,
  callback_url?: string,
  inventory_management?: boolean,
  tracking_support?: boolean,
  requires_shipping_method?: boolean,
  format?: string,
  permits_sku_sharing?: boolean,
  fulfillment_orders_opt_in?: boolean
}

export type CarrierService = {
  id?: number
  active?: boolean
  callbackUrl?: string
  name?: string
  serviceDiscovery?: boolean
  carrierServiceType?: "api" | "legacy"
  legacy_id?: number
}

export type LineItem = {
  id?: number
  product_id?: number
  variant_id?: number
  quantity?: number
  price?: number
  title?: string
  sku?: string
  [key: string]: any
}

export type Address = {
  first_name?: string
  last_name?: string
  company?: string
  address1?: string
  address2?: string
  country?: string
  country_code?: string
  province?: string
  province_code?: string
  zip?: string
  city?: string
}

export type Order = {
  id?: number
  email?: string
  phone?: string
  name?: string
  shipping_address?: Address
  billing_address?: Address
  city?: string
  province?: string
  country?: string
  zip?: string
  currency?: string
  locale?: string
  line_items?: LineItem[]
}

export const shopify = {
  /**
   * Fulfillment Services
   */
  fulfillmentServices: {
    get: async (fulfillment_service_id?: string) => {
      console.log("getFulfillmentServices")
      const path = fulfillment_service_id ? `/fulfillment_services/${fulfillment_service_id}.json` : '/fulfillment_services.json'
      const fulfillmentServices = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'GET',
          path: path
        })
      })
      const data = await fulfillmentServices.json()
      console.log('Fulfillment Services:', data)
      return data as { fulfillment_services: FulfillmentService[] }
    },
    post: async (service: FulfillmentService) => {
      console.log("createFulfillmentService: ", service)
      try {
        const fulfillmentService = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'POST',
            path: '/fulfillment_services.json',
            data: {
              fulfillment_service: service
            }
          })
        })
        const data = await fulfillmentService.json()
        console.log('Fulfillment Service:', data)
        return data as { fulfillment_service: FulfillmentService }
      } catch (error) {
        console.error('Error creating fulfillment service:', error)
        throw error
      }
    },
    put: async (service: FulfillmentService) => {
      console.log("updateFulfillmentService")
      try {
        const fulfillmentService = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'PUT',
            path: `/fulfillment_services/${service.id}.json`,
            data: {
              fulfillment_service: service
            }
          })
        })
        const data = await fulfillmentService.json()
        console.log('Fulfillment Service:', data)
        return data as { fulfillment_service: FulfillmentService }
      } catch (error) {
        console.error('Error updating fulfillment service:', error)
        throw error
      }
    },
    delete: async (fulfillment_service_id: string) => {
      console.log("deleteFulfillmentService")
      const fulfillmentService = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'DELETE',
          path: `/fulfillment_services/${fulfillment_service_id}.json`
        })
      })
      const data = await fulfillmentService.json()
      console.log('Fulfillment Service:', data)
      return data as { fulfillment_service: FulfillmentService }
    }
  },
  /**
   * Carrier Services
   */
  carrierServices: {
    get: async (carrier_service_id?: string) => {
      console.log("getCarrierServices")
      const path = carrier_service_id ? `/carrier_services/${carrier_service_id}.json` : '/carrier_services.json'
      const carrierServices = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'GET',
          path: path
        })
      })
      const data = await carrierServices.json()
      // console.log('Carrier Services:', data)
      return data as { carrier_services: FulfillmentService[] }
    },
    post: async (service: CarrierService) => {
      console.log("createCarrierService", service)
      try {
        const carrierService = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'POST',
            path: '/carrier_services.json',
            data: {
              carrier_service: service
            }
          })
        })
        const data = await carrierService.json()
        // console.log('Carrier Service:', data)
        return data as { carrier_service: CarrierService }
      } catch (error) {
        console.error('Error creating carrier service:', error)
        throw error
      }
    },
    put: async (service: CarrierService) => {
      console.log("updateCarrierService")
      try {
        const carrierService = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'PUT',
            path: `/carrier_services/${service.id}.json`,
            data: {
              carrier_service: service
            }
          })
        })
        const data = await carrierService.json()
        // console.log('Carrier Service:', data)
        return data as { carrier_service: CarrierService }
      } catch (error) {
        console.error('Error updating carrier service:', error)
        throw error
      }
    },
    delete: async (carrier_service_id: string) => {
      console.log("deleteCarrierService")
      const carrierService = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'DELETE',
          path: `/carrier_services/${carrier_service_id}.json`
        })
      })
      const data = await carrierService.json()
      // console.log('Carrier Service:', data)
      return data as { carrier_service: CarrierService }
    }
  },
  /**
   * Orders
   */
  orders: {
    get: async (order_id?: string) => {
      console.log("getOrders")
      const path = order_id ? `/orders/${order_id}.json` : '/orders.json'
      const orders = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'GET',
          path: path
        })
      })
      const data = await orders.json()
      console.log('Orders:', data)
      if (order_id) {
        return data as { order: Order }
      } else {
        return data as { orders: Order[] }
      }
    },
    post: async (order: Order) => {
      console.log("createOrder")
      try {
        const newOrder = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'POST',
            path: '/orders.json',
            data: {
              order: order
            }
          })
        })
        const data = await newOrder.json()
        console.log('Order:', data)
        return data as { order: Order }
      } catch (error) {
        console.error('Error creating order:', error)
        throw error
      }
    },
    put: async (order: Order) => {
      console.log("updateOrder")
      try {
        const updatedOrder = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'PUT',
            path: `/orders/${order.id}.json`,
            data: {
              order: order
            }
          })
        })
        const data = await updatedOrder.json()
        console.log('Order:', data)
        return data as { order: Order }
      } catch (error) {
        console.error('Error updating order:', error)
        throw error
      }
    },
    delete: async (order_id: string) => {
      console.log("deleteOrder")
      const order = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'DELETE',
          path: `/orders/${order_id}.json`
        })
      })
      const data = await order.json()
      console.log('Order:', data)
      return data as { order: Order }
    }
  },
  /**
   * Draft Orders
   */
  draftOrders: {
    get: async (draft_order_id?: string) => {
      console.log("getDraftOrders")
      const path = draft_order_id ? `/draft_orders/${draft_order_id}.json` : '/draft_orders.json'
      const draftOrders = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'GET',
          path: path
        })
      })
      const data = await draftOrders.json()
      console.log('Draft Orders:', data)
      if (draft_order_id) {
        return data as { draft_order: Order }
      } else {
        return data as { draft_orders: Order[] }
      }
    },
    post: async (draft_order: Order) => {
      console.log("createDraftOrder")
      try {
        const newDraftOrder = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'POST',
            path: '/draft_orders.json',
            data: {
              draft_order: draft_order
            }
          })
        })
        const data = await newDraftOrder.json()
        console.log('Draft Order:', data)
        return data as { draft_order: Order }
      } catch (error) {
        console.error('Error creating draft order:', error)
        throw error
      }
    },
    put: async (draft_order: Order) => {
      console.log("updateDraftOrder")
      try {
        const updatedDraftOrder = await fetch('/api/shopify', {
          method: 'POST',
          body: JSON.stringify({
            method: 'PUT',
            path: `/draft_orders/${draft_order.id}.json`,
            data: {
              draft_order: draft_order
            }
          })
        })
        const data = await updatedDraftOrder.json()
        console.log('Draft Order:', data)
        return data as { draft_order: Order }
      } catch (error) {
        console.error('Error updating draft order:', error)
        throw error
      }
    },
    delete: async (draft_order_id: string) => {
      console.log("deleteDraftOrder")
      const draftOrder = await fetch('/api/shopify', {
        method: 'POST',
        body: JSON.stringify({
          method: 'DELETE',
          path: `/draft_orders/${draft_order_id}.json`
        })
      })
      const data = await draftOrder.json()
      console.log('Draft Order')
      return data as { draft_order: Order }
    }
  }
}