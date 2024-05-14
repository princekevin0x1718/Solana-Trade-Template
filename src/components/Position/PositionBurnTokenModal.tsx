import { useState } from "react"
import Modal from "../Modal"
import toast from "react-hot-toast"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, PublicKey, Transaction } from "@solana/web3.js"
import useToken from "@/hooks/useToken"
import { useQuery } from "@tanstack/react-query"
import {
  SPL_ACCOUNT_LAYOUT,
  Spl,
  TOKEN_PROGRAM_ID,
  TokenAmount,
} from "@raydium-io/raydium-sdk"
import { BN } from "bn.js"
import { createBurnCheckedInstruction } from "@solana/spl-token"

interface PositionBurnTokenModalProps {
  publicKey?: PublicKey
  wallet?: Keypair
  open: boolean
  setOpen: (t: boolean) => void
}
export default function PositionBurnTokenModal({
  publicKey,
  wallet,
  open,
  setOpen,
}: PositionBurnTokenModalProps) {
  const [amount, setAmount] = useState(0)
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()
  const { token } = useToken()

  const { data: balance } = useQuery({
    queryKey: ["fetchTokenBalanceBurnModal", publicKey, token],
    queryFn: async () => {
      if (!token || !publicKey) return undefined
      const accountInfo = await connection.getTokenAccountsByOwner(publicKey, {
        mint: token.mint,
      })

      return parseFloat(
        new TokenAmount(
          token,
          accountInfo.value.length
            ? SPL_ACCOUNT_LAYOUT.decode(accountInfo.value[0].account.data)
                .amount
            : new BN(0)
        ).toExact()
      )
    },
    enabled: Boolean(token) && Boolean(publicKey) && open,
    refetchInterval: 10000,
  })

  const onBurn = async () => {
    try {
      if (!publicKey) {
        toast.error("Invalid account")
        return
      }
      if (!token) {
        toast.error("Invalid token")
        return
      }

      const ata = Spl.getAssociatedTokenAccount({
        mint: token.mint,
        owner: publicKey,
        programId: TOKEN_PROGRAM_ID,
      })

      const transaction = new Transaction().add(
        createBurnCheckedInstruction(
          ata,
          token.mint,
          publicKey,
          BigInt(amount * Math.pow(10, token.decimals)),
          token.decimals
        )
      )

      if (wallet) {
        const tx = await connection.sendTransaction(transaction, [wallet])
        console.log(tx)
      } else {
        const tx = await sendTransaction(transaction, connection)
        console.log(tx)
      }
      setOpen(false)
      toast.success("Burnt successfully")
    } catch (err: any) {
      console.log(err)
      toast.error(err?.message ?? err)
    }
  }

  return (
    <Modal title="Burn Token" open={open} setOpen={setOpen}>
      <div className="mt-4">
        Your Current Balance: <b>{balance ?? 0}</b>
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
      <div className="flex space-x-4 mt-6">
        <button
          className="border border-[#512da8] text-[#512da8] py-1.5 w-full hover:brightness-90 active:brightness-95 transition-all"
          onClick={() => setOpen(false)}
        >
          CANCEL
        </button>
        <button
          className="bg-[#512da8] text-white py-1.5 w-full hover:brightness-90 active:brightness-95 transition-all"
          onClick={onBurn}
        >
          BURN
        </button>
      </div>
    </Modal>
  )
}
