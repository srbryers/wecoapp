import { useEffect, useState } from "react"
import { FulfillmentService, shopify } from "./api"
import { useSetAtom } from "jotai"
import { modalAtom } from "../atoms"

/**
 * Shopify: Fulfillment Services
 * @returns 
 */
const useShopifyFulfillmentServices = () => {

  /* Global State */
  const setModal = useSetAtom(modalAtom)

  /* Local State */
  const [fulfillmentServices, setFulfillmentServices] = useState<FulfillmentService[]>([])
  const [loadingServices, setLoadingServices] = useState<boolean>(true)

  useEffect(() => {
    const fetchFulfillmentServices = async () => {
      const services = await shopify.fulfillmentServices.get()
      setFulfillmentServices(services.fulfillment_services)
      setLoadingServices(false)
      console.log("Finished fetching fulfillment services.")
    }
    if (loadingServices) {
      fetchFulfillmentServices()
    }
  }, [
    loadingServices,
    fulfillmentServices
  ])

  /**
   * Create a Fulfillment Service
   * @param data FulfillmentService
   */
  const createFulfillmentService = async (data: FulfillmentService) => {
    console.log('Creating fulfillment service:', data)
    const service = await shopify.fulfillmentServices.post(data)
    console.log('Created fulfillment service:', service)
    setFulfillmentServices([...fulfillmentServices, service.fulfillment_service])
    setModal(null)
  }

  /**
   * Update a Fulfillment Service
   * @param data FulfillmentService
   */
  const updateFulfillmentService = async (data: FulfillmentService) => {
    console.log('Updating fulfillment service:', data)
    const service = await shopify.fulfillmentServices.put(data)
    console.log('Updated fulfillment service:', service)
    const updatedServices = fulfillmentServices.map((service) => {
      return service.id === data.id ? data : service
    })
    setFulfillmentServices(updatedServices)
    setModal(null)
  }

  /**
   * Delete a Fulfillment Service
   * @param data FulfillmentService
   */
  const deleteFulfillmentService = async (data: FulfillmentService) => {
    console.log('Deleting fulfillment service:', data)
    const service = await shopify.fulfillmentServices.delete(`${data.id}`)
    console.log('Deleted fulfillment service:', service)
    const updatedServices = fulfillmentServices.filter((service) => {
      return service.id !== data.id
    })
    setFulfillmentServices(updatedServices)
  }

  return {
    fulfillmentServices,
    loadingServices,
    createFulfillmentService,
    updateFulfillmentService,
    deleteFulfillmentService
  }
}

export default useShopifyFulfillmentServices