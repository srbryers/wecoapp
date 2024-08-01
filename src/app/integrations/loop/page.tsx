'use client'
import Button from "@/app/components/Button"
import { useRouter } from "next/navigation"

export default function Page() {

  const router = useRouter()

  return (
    <div className="overflow-scroll max-w-full">
      {/* Customers */}
      <Button label="View Customers" onClick={() => router.push('/integrations/loop/customers') }></Button>
    </div>
  )
}