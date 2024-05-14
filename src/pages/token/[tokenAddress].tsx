import TokenCard from "@/components/Token/TokenCard"
import ActionCard from "@/components/Action/ActionCard"
import AccountCard from "@/components/Account/AccountCard"
import { useRouter } from "next/router"
import useToken from "@/hooks/useToken"
import PositionCard from "@/components/Position/PositionCard"

const Page = () => {
  const { tokenAddress } = useRouter().query
  const { token } = useToken()

  return (
    <>
      <TokenCard address={tokenAddress?.toString() ?? ""} />
      <ActionCard />
      <div className="flex space-x-4 w-full justify-between">
        {token ? <PositionCard /> : null}
        <AccountCard />
      </div>
    </>
  )
}

export default Page
