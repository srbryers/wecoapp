
'use client'
import { useRouter } from "next/navigation";
import PageLayout from "./components/layout/page";

export default function Home() {

  const router = useRouter()
  return (
    <PageLayout title="Home" description="Welcome to the WECO App.">
      {/* Homepage Content */}
      <div className="flex flex-col items-start">
        <button
          onClick={() => router.push("/shopify")}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-8 rounded transition-all duration-200 ease-in-out"
        >Shopify</button>
      </div>
    </PageLayout>
  );
}
