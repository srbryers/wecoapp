'use client'
import Button from "@/app/components/Button"
import Divider from "@/app/components/Divider"
import { useRouter } from "next/navigation"

export default function Page() {

  const router = useRouter()

  return (
    <div className="flex flex-col w-full">
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-xl">Actions</h2>
        <div className="flex flex-row gap-4">
          <Button label="Update Delivery Dates" onClick={() => router.push('loop/actions/update-delivery-dates')}/>
        </div>
      </section>
      <Divider className="my-6"/>
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-xl">Data</h2>
        <div className="flex flex-row gap-4">
          {/* Customers */}
          <Button label="View Customers" onClick={() => router.push('loop/customers') }></Button>
          {/* Subscriptions */}
          <Button label="View Subscriptions" onClick={() => router.push('loop/subscriptions?page=1') }></Button>
        </div>
      </section>
    </div>
  )
}