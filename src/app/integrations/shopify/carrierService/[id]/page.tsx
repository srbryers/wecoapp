import { shopify } from "@/app/actions/shopify"
import CustomLink from "@/app/components/CustomLink"
import Table from "@/app/components/Table"

export default async function CarrierService({ params }: {
  params: {
    id: string
  }
}) {
  let carrierService = null
  try {
    carrierService = (await shopify.carrierServices.get(params.id))?.[0]
  } catch (error) {
    console.error("Failed to fetch carrier service", error)
  }
  return carrierService ? (
    <div className="flex flex-col gap-4">
      <Table columns={2} data={[carrierService]} />
      <div className="actions flex flex-row gap-4">
        <CustomLink href={`${params.id}/edit`}>Edit</CustomLink>
        <CustomLink href={`${params.id}/delete`}>Delete</CustomLink>
        <CustomLink href={`${params.id}/test`}>Test</CustomLink>
      </div>
    </div>
  ) : (
    <div>Carrier Service not found</div>
  )
}