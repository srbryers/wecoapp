import PageHeader from "@/app/components/PageHeader"
import { Suspense } from "react"

export default function Layout({ 
  children
}: {
  children: React.ReactNode,
}) {
  return (
    <div className={`flex flex-col h-full`}>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col h-full items-start w-full">{children}</div>
        </div>
      </Suspense>
    </div>
  )
}