// List of carrierServices
import CarrierServices from "../_components/shopify/carrierServices"
import { shopify } from "../actions/shopify"

export default async function Page () {
  const carrierServices = await shopify.carrierServices.get()
  return (
    <CarrierServices carrierServices={carrierServices} />
  )
}