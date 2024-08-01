import { shopify } from "@/app/actions/shopify";
import TestCarrierService from "@/app/components/carrierService/TestCarrierService";

export default async function Page({ params}: {
  params: {
    id: string
  }
}) {

  const carrierService = (await shopify.carrierServices.get(params.id))?.[0]

  console.log('carrierService', carrierService)

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="header flex flex-col gap-2">
          <h1 className="text-xl font-bold">Test Carrier Service</h1>
          <h3>{carrierService.name}</h3>
        </div>
        <TestCarrierService carrierService={carrierService} />
      </div>
    </> 
  )
}