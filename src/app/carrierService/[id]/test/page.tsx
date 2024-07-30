import { shopify } from "@/app/actions/shopify";
import TableForm from "@/app/components/TableForm";

export default async function TestCarrierService({ params}: {
  params: {
    id: string
  }
}) {

  const carrierService = (await shopify.carrierServices.get(params.id))?.[0]
  const formData = {
    id: carrierService.id,
    name: carrierService.name,
    shopify_order_id: ''
  }

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="header flex flex-col gap-2">
          <h1 className="text-xl font-bold">Test Carrier Service</h1>
          <h3>{carrierService.name}</h3>
        </div>
        <TableForm
          id={params.id}
          columns={2}
          data={formData}
          action="test"
          resource="shopify"
          path="carrierServices"
        />
      </div>
    </> 
  )
}