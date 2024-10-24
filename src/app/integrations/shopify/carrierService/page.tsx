// List of carrierServices
import CarrierServices from "@/app/components/carrierService/CarrierServices"
import { shopify } from "../../../actions/shopify"

export default async function Page () {

  let carrierServices = null 
  try {
    carrierServices = await shopify.carrierServices.get()
  } catch (error) {
    console.error("Failed to fetch carrier services", error)
  }

  return carrierServices ? (
    <CarrierServices carrierServices={carrierServices} />
  ) : (
    <>
      <p>Error fetching Carrier Services from Shopify API.</p>
    </>
  )
}