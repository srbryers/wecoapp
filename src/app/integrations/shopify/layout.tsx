import PageHeader from "@/app/components/PageHeader"

export default function Layout({ 
  children
}: {
  children: React.ReactNode,
}) {
  return (
    <>
      <PageHeader
        title={"Shopify"}
        description={""}
      />
      <div className="flex flex-col h-full items-start w-full">{children}</div>
    </>
  )
}