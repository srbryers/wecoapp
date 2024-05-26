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
  callback_url?: string
  name?: string
  service_discovery?: boolean
}

export type LineItem = {
  id?: number
  product_id?: number
  variant_id?: number
  quantity?: number
}

export type Order = {
  id?: number
  email?: string
  phone?: string
  name?: string
  address?: string
  city?: string
  province?: string
  country?: string
  zip?: string
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
      console.log('Carrier Services:', data)
      return data as { carrier_services: FulfillmentService[] }
    },
    post: async (service: CarrierService) => {
      console.log("createCarrierService")
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
        console.log('Carrier Service:', data)
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
        console.log('Carrier Service:', data)
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
      console.log('Carrier Service:', data)
      return data as { carrier_service: CarrierService }
    }
  }
}