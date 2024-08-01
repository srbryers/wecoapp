import PageHeader from "@/app/components/PageHeader"

export default function Layout({ 
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <>
      <PageHeader
        title={"Klaviyo"}
        description={""}
      />
      <div className="flex flex-col h-full items-start">{children}</div>
    </>
  )
}