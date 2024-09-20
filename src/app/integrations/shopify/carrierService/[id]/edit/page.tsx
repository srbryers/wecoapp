import { shopify } from "@/app/actions/shopify"
import EditCarrierService from "@/app/components/carrierService/EditCarrierService"
import { CarrierService } from "@/app/utils/types"

export default async function EditCarrierServicePage({ params }: { params: { id: string } }) {

  const carrierService = (await shopify.carrierServices.get(params.id))?.[0] as CarrierService

  return <EditCarrierService carrierService={carrierService} />
}