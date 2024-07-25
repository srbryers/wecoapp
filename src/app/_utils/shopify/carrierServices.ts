import { useEffect, useState } from "react"
import { CarrierService, LineItem, Order, shopify } from "./api"
import { useSetAtom } from "jotai"
import { modalAtom } from "../atoms"
import { CarrierServiceRequest, CarrierServiceResponse } from "../types"

/**
 * Shopify: Carrier Services
 */
const useShopifyCarrierServices = () => {
  
  /* Global State */
  const setModal = useSetAtom(modalAtom)

  /* Local State */
  const [carrierServices, setCarrierServices] = useState<CarrierService[]>([])
  const [loadingCarrierServices, setLoadingCarrierServices] = useState<boolean>(true)

  useEffect(() => {
    const fetchCarrierServices = async () => {
      const services = await shopify.carrierServices.get()
      console.log("fetchcarrierservices", services)
      setCarrierServices(services.carrier_services.filter((service: CarrierService) => service.carrier_service_type === "api"))
      setLoadingCarrierServices(false)
      console.log("Finished fetching carrier services.")
    }
    if (loadingCarrierServices) {
      fetchCarrierServices()
    }
  }, [
    loadingCarrierServices,
    carrierServices
  ])

  /**
   * Create a Carrier Service
   * @param data CarrierService
   */
  const createCarrierService = async (data: CarrierService) => {
    console.log('Creating carrier service:', data)
    const service = await shopify.carrierServices.post(data)
    console.log('Created carrier service:', service)
    setCarrierServices([...carrierServices, service.carrier_service])
    setModal(null)
  }

  /**
   * Update a Carrier Service
   * @param data CarrierService
   */
  const updateCarrierService = async (data: CarrierService) => {
    console.log('Updating carrier service:', data)
    const service = (await shopify.carrierServices.put(data)).carrier_service
    console.log('Updated carrier service:', service)
    const updatedServices = carrierServices.map((service) => {
      return service.id === data.id ? data : service
    })
    setCarrierServices(updatedServices)
    setModal(null)
  }

  /**
   * Delete a Carrier Service
   * @param data CarrierService
   */
  const deleteCarrierService = async (data: CarrierService) => {
    console.log('Deleting carrier service:', data)
    const service = await shopify.carrierServices.delete(`${data.id}`)
    console.log('Deleted carrier service:', service)
    const updatedServices = carrierServices.filter((service) => {
      return service.id !== data.id
    })
    setCarrierServices(updatedServices)
  }

  /**
   * Test a Carrier Service
   * @param rateRequest CarrierServiceRequest | { shopify_order_id: string } | { shopify_draft_order_id: string }
   * @returns CarrierServiceResponse
   */
  const testCarrierService = async (rateRequest: CarrierServiceRequest | { shopify_order_id: string } | { shopify_draft_order_id: string }) => {

    let result: CarrierServiceResponse[] = []

    // Handle the case where we are testing a shipping profile with an order ID
    if ('shopify_order_id' in rateRequest || 'shopify_draft_order_id' in rateRequest) {
      let order: Order | undefined = undefined
      // Get the shopify order or draft_order from the API
      if ('shopify_order_id' in rateRequest) {
        const res = (await shopify.orders.get(rateRequest.shopify_order_id)) as { order: Order }
        order = res.order
      } else if ('shopify_draft_order_id' in rateRequest) {
        const res = (await shopify.draftOrders.get(rateRequest.shopify_draft_order_id)) as { draft_order: Order }
        order = res.draft_order
      }
      // If we have an order, test the shipping profile
      if (!order) {
        throw new Error('Order not found')
      } else {
        console.log("[testShippingProfile] got Order:", order)
        const carrierServiceRequest = {
          id: order.id,
          rate: {
            origin: {
              country: "US",
              postal_code: "01720",
              province: "MA",
              city: "Acton"
            },
            destination: {
              country: order.shipping_address?.country_code,
              postal_code: order.shipping_address?.zip,
              province: order.shipping_address?.province,
              city: order.shipping_address?.city
            },
            items: order.line_items?.map((item: LineItem) => {
              let res = item
              // Map the properties from an array to an object
              if (item.properties) {
                res.properties = item.properties.reduce((acc: any, property: any) => {
                  acc[property.name] = property.value
                  return acc
                }, {})
              }
              const shipment_date = item?.sku?.split("-")
              if (!shipment_date) {
                return item
              }
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
              } else {
                return item
              }
            }).filter((value: any) => value !== undefined),
            currency: order.currency,
            locale: order.locale
          }
        }
        console.log('CarrierServiceRequests:', carrierServiceRequest)
        const res = await fetch('/api/shopify/carrierService', {
          method: 'POST',
          body: JSON.stringify(carrierServiceRequest)
        })
        const json = await res.json()
        console.log('Tested shipping profile:', json)
        result = json.rates as CarrierServiceResponse[]
      }
    } else {
      const res = await fetch('/api/shopify/carrierService', {
        method: 'POST',
        body: JSON.stringify(rateRequest)
      })
      const json = await res.json()
      console.log('Tested shipping profile:', json)
      result = json.rates as CarrierServiceResponse[]
    }

    return result as CarrierServiceResponse[]
  }

  return {
    carrierServices,
    loadingCarrierServices,
    createCarrierService,
    updateCarrierService,
    deleteCarrierService,
    testCarrierService
  }

}

export default useShopifyCarrierServices

