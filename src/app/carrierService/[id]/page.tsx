import { shopify } from "@/app/actions/shopify"
import CustomLink from "@/app/components/CustomLink"
import Table from "@/app/components/Table"

export default async function CarrierService({ params }: {
  params: {
    id: string
  }
}) {
  const carrierService = (await shopify.carrierServices.get(params.id))?.[0]
  return carrierService ? (
    <div className="flex flex-col gap-4">
      <Table columns={2} data={[carrierService]} />
      <div className="actions flex flex-row gap-4">
        <CustomLink href={`/carrierService/${params.id}/edit`}>Edit</CustomLink>
        <CustomLink href={`/carrierService/${params.id}/delete`}>Delete</CustomLink>
        <CustomLink href={`/carrierService/test`}>Test</CustomLink>
      </div>
    </div>
  ) : (
    <div>Carrier Service not found</div>
  )
}