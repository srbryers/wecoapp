// List of carrierServices
import CarrierServices from "@/app/components/carrierService/CarrierServices"
import { shopify } from "../../../actions/shopify"

export default async function Page () {
  const carrierServices = await shopify.carrierServices.get()
  return (
    <CarrierServices carrierServices={carrierServices} />
  )
}