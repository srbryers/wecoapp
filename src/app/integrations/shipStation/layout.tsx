import PageHeader from "@/app/components/PageHeader"
import { Suspense } from "react"

export default function Layout({ 
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <>
      <PageHeader
        title={"ShipStation"}
        description={""}
      />
      <div className="flex flex-col h-full items-start">
        <Suspense>
          {children}
        </Suspense>
      </div>
    </>
  )
}