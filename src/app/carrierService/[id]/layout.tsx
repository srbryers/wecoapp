import PageHeader from "@/app/_components/global/pageHeader"
import { Suspense } from "react"

export default function Layout({ 
  children
}: {
  children: React.ReactNode,
}) {
  return (
    <div className={`flex flex-col h-full p-8`}>
      <PageHeader
        title={"Shopify"}
        description={""}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Carrier Service</h2>
          <div className="flex flex-col h-full items-start w-full">{children}</div>
        </div>
      </Suspense>
    </div>
  )
}