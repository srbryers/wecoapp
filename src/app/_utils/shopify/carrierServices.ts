import { useEffect, useState } from "react"
import { CarrierService, shopify } from "./api"
import { useSetAtom } from "jotai"
import { modalAtom } from "../atoms"

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
      setCarrierServices(services.carrier_services)
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
    const service = await shopify.carrierServices.put(data)
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

  return {
    carrierServices,
    loadingCarrierServices,
    createCarrierService,
    updateCarrierService,
    deleteCarrierService
  }

}

export default useShopifyCarrierServices

