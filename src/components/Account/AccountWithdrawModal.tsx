import { useState } from "react"
import Modal from "../Modal"
import toast from "react-hot-toast"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"

interface AccountWithdrawModalProps {
  publicKey?: PublicKey
  wallet?: Keypair
  open: boolean
  setOpen: (t: boolean) => void
}
export default function AccountWithdrawModal({
  publicKey,
  wallet,
  open,
  setOpen,
}: AccountWithdrawModalProps) {
  const [amount, setAmount] = useState(0)
  const [to, setTo] = useState("")
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()

  const { data: balance } = useQuery({
    queryKey: ["fetchBalanceModal", publicKey],
    queryFn: async () => {
      if (!publicKey) return 0
      const result = await connection.getBalance(publicKey)
      return result
    },
    refetchInterval: 10000,
    enabled: Boolean(publicKey) && open,
  })

  const onWithdraw = async () => {
    try {
      if (!publicKey) {
        toast.error("Invalid account")
        return
      }
      if (amount * LAMPORTS_PER_SOL > (balance ?? 0)) {
        toast.error("Invalid amount")
        return
      }
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: BigInt(amount * LAMPORTS_PER_SOL),
        })
      )

      if (wallet) {
        const tx = await connection.sendTransaction(transaction, [wallet])
        console.log(tx)
      } else {
        const tx = await sendTransaction(transaction, connection)
        console.log(tx)
      }
      setOpen(false)
      toast.success("Withdrawn successfully")
    } catch (err: any) {
      console.log(err)
      toast.error(err?.message ?? err)
    }
  }

  return (
    <Modal title="Withdraw SOL" open={open} setOpen={setOpen}>
      <div className="mt-4">
        Your Current Balance:{" "}
        <b>
          {((balance ?? 0) >= 5000 ? (balance ?? 0) - 5000 : 0) /
            Math.pow(10, 9)}
        </b>
      </div>
      <div className="flex flex-col mt-3">
        <span>Amount: </span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.valueAsNumber)}
          placeholder="Amount"
          className="border mt-2 px-3 py-1.5"
        />
      </div>
      <div className="flex flex-col mt-4">
        <span>To: </span>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          className="border mt-2 px-3 py-1.5"
        />
      </div>
      <div className="flex space-x-4 mt-6">
        <button
          className="border border-[#512da8] text-[#512da8] py-1.5 w-full hover:brightness-90 active:brightness-95 transition-all"
          onClick={() => setOpen(false)}
        >
          CANCEL
        </button>
        <button
          className="bg-[#512da8] text-white py-1.5 w-full hover:brightness-90 active:brightness-95 transition-all"
          onClick={onWithdraw}
        >
          WITHDRAW
        </button>
      </div>
    </Modal>
  )
}
