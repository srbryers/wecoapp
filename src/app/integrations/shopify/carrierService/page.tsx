// List of carrierServices
import CarrierServices from "@/app/components/carrierService/CarrierServices"
import { shopify } from "../../../actions/shopify"

export default async function Page () {
  const carrierServices = await shopify.carrierServices.get()

  return carrierServices ? (
    <CarrierServices carrierServices={carrierServices} />
  ) : (
    <>
      <p>Error fetching Carrier Services from Shopify API.</p>
    </>
  )
}