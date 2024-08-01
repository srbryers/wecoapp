'use client'
import Button from "@/app/components/Button"
import { useRouter } from "next/navigation"

export default function Page() {

  const router = useRouter()

  return (
    <div className="flex flex-col w-full">
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-xl">Automations</h2>
        <div className="flex flex-row gap-4">
          <Button label="Delivery Details Sync" onClick={() => router.push('shipStation/automations/delivery-details-sync')}/>
        </div>
      </section>
    </div>
  )
}