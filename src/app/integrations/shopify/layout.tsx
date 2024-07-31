import PageHeader from "@/app/components/PageHeader"

export default function Layout({ 
  children,
  carrierService 
}: {
  children: React.ReactNode,
  carrierService: React.ReactNode
}) {
  return (
    <div className={`flex flex-col h-full p-8`}>
      <PageHeader
        title={"Shopify"}
        description={""}
      />
      <div className="flex flex-col h-full items-start">{children}</div>
      <div>{carrierService}</div>
    </div>
  )
}