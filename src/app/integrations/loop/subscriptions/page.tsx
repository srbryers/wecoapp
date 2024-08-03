import { loop } from "@/app/actions/loop"
import { shopify } from "@/app/actions/shopify"
import LoopSubscriptions from "@/app/components/loop/subscriptions"
import { delay } from "@/app/utils/helpers"

export default async function Page({ searchParams }: { searchParams: { page: string} }) {

  const page = searchParams ? parseInt(searchParams.page) : 1
  const res = await loop.subscriptions.getAll(`?status=ACTIVE&limit=200&pageNo=${page}`)

  const getSubscriptionOrders = async () => {
    return await Promise.all(res?.data?.map(async (sub) => {
      const orders = await shopify.customers.getOrders(`${sub.customer.shopifyId}`)
      const sortedOrders = orders.orders.sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }).filter((order: any) => {
        // Only return orders that have a Subscription tag
        return order.tags.includes("Subscription")
      })
      delay(200)
      return {
        ...sub,
        sortedOrders
      }
    }))
  }

  // @TODO: Get the Klaviyo segment for upcoming subscription customers (people who have the event) and add 
  // that data to the table so we know the last time we sent an email
  // https://developers.klaviyo.com/en/reference/get_segments
  // https://www.klaviyo.com/flow/message/U8daeb/reports/recipients

  const subscriptions = await getSubscriptionOrders()

  return (
    <LoopSubscriptions subscriptions={subscriptions} pageInfo={res.pageInfo} />
  )

}