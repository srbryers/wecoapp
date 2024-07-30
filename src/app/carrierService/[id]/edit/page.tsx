import { shopify } from "@/app/actions/shopify";
import TableForm from "@/app/components/TableForm";

export default async function EditCarrierService({ params}: {
  params: {
    id: string
  }
}) {
  const carrierService = (await shopify.carrierServices.get(params.id))?.[0]

  return (
    <>
      <TableForm 
        id={params.id}
        columns={2} 
        data={carrierService} 
        action="update"
        resource="shopify"
        path="carrierServices"
        />
    </> 
  )
}