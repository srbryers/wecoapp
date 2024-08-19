import { subscriptions } from "@/app/actions/subscriptions"
import LoopSubscriptions from "@/app/components/loop/subscriptions"

export default async function Page({ searchParams }: { searchParams: { page: string} }) {

  const page = searchParams ? parseInt(searchParams.page) : 1
  const res = await subscriptions.getAll({
    page: page,
    query: `status=ACTIVE&limit=200`
  })

  // console.log("Loop Subscriptions", res)

  // @TODO: Get the Klaviyo segment for upcoming subscription customers (people who have the event) and add 
  // that data to the table so we know the last time we sent an email
  // https://developers.klaviyo.com/en/reference/get_segments
  // https://www.klaviyo.com/flow/message/U8daeb/reports/recipients

  return (
    <LoopSubscriptions subscriptions={res.data} pageInfo={res.pageInfo} />
  )

}