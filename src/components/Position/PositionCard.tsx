import { useState } from "react"
import useAccounts from "@/hooks/useAccounts"
import { useWallet } from "@solana/wallet-adapter-react"
import PositionItem from "./PositionItem"
import PositionWithdrawTokenModal from "./PositionWithdrawTokenModal"
import PositionBurnTokenModal from "./PositionBurnTokenModal"
import { FcDonate } from "react-icons/fc"
import PositionMultiDepositModal from "./PositionMultiDepositModal"

const PositionCard = () => {
  const { accounts } = useAccounts()
  const { publicKey } = useWallet()
  const [withdrawTokenModalIndex, setWithdrawTokenModalIndex] = useState(-1)
  const [withdrawTokenModalOpen, setWithdrawTokenModalOpen] = useState(false)
  const [burnTokenModalIndex, setBurnTokenModalIndex] = useState(-1)
  const [burnTokenModalOpen, setBurnTokenModalOpen] = useState(false)
  const [multiDepositModalOpen, setMultiDepositModalOpen] = useState(false)

  const onMultiDeposit = () => {
    setMultiDepositModalOpen(true)
  }

  const onWithdrawToken = (i: number) => {
    return () => {
      setWithdrawTokenModalIndex(i)
      setWithdrawTokenModalOpen(true)
    }
  }

  const onBurnToken = (i: number) => {
    return () => {
      setBurnTokenModalIndex(i)
      setBurnTokenModalOpen(true)
    }
  }

  return (
    <>
      <div className="bg-white shadow-sm mt-4 py-4 px-6 w-full max-w-[450px]">
        <div className="flex justify-between items-center pb-2">
          <h4 className="text-lg font-bold">Positions</h4>
          <button
            className="rounded-full p-2 hover:shadow-lg active:brightness-95 transition-all"
            onClick={onMultiDeposit}
          >
            <FcDonate size={24} />
          </button>
        </div>
        <div className="table w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b cursor-pointer">
                <th className="text-sm text-left py-3">Name</th>
                <th className="text-sm text-left">Balance</th>
                <th className="text-sm text-left">Function</th>
              </tr>
            </thead>
            <tbody>
              {publicKey && (
                <PositionItem
                  name="Wallet"
                  pubKey={publicKey}
                  onWithdrawToken={onWithdrawToken(-1)}
                  onBurnToken={onBurnToken(-1)}
                />
              )}
              {accounts.map((item, i) => (
                <PositionItem
                  key={i}
                  name={item.name}
                  pubKey={item.key.publicKey}
                  onWithdrawToken={onWithdrawToken(i)}
                  onBurnToken={onBurnToken(i)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <PositionWithdrawTokenModal
        open={withdrawTokenModalOpen}
        setOpen={setWithdrawTokenModalOpen}
        wallet={accounts?.[withdrawTokenModalIndex]?.key}
        publicKey={
          withdrawTokenModalIndex === -1
            ? publicKey ?? undefined
            : accounts[withdrawTokenModalIndex].key.publicKey
        }
      />
      <PositionBurnTokenModal
        open={burnTokenModalOpen}
        setOpen={setBurnTokenModalOpen}
        wallet={accounts?.[burnTokenModalIndex]?.key}
        publicKey={
          burnTokenModalIndex === -1
            ? publicKey ?? undefined
            : accounts[burnTokenModalIndex].key.publicKey
        }
      />
      <PositionMultiDepositModal
        open={multiDepositModalOpen}
        setOpen={setMultiDepositModalOpen}
      />
    </>
  )
}

export default PositionCard
