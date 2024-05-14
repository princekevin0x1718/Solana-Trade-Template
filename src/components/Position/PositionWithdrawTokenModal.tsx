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

interface PositionWithdrawTokenModalProps {
  publicKey?: PublicKey
  wallet?: Keypair
  open: boolean
  setOpen: (t: boolean) => void
}
export default function PositionWithdrawTokenModal({
  publicKey,
  wallet,
  open,
  setOpen,
}: PositionWithdrawTokenModalProps) {
  const [amount, setAmount] = useState(0)
  const [to, setTo] = useState("")
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()
  const { token } = useToken()

  const { data: balance } = useQuery({
    queryKey: ["fetchTokenBalanceWithdrawModal", publicKey, token],
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

  const onWithdraw = async () => {
    try {
      if (!publicKey) {
        toast.error("Invalid account")
        return
      }
      if (!token) {
        toast.error("Invalid token")
        return
      }

      const sourceATA = Spl.getAssociatedTokenAccount({
        mint: token.mint,
        owner: publicKey,
        programId: TOKEN_PROGRAM_ID,
      })
      const destATA = Spl.getAssociatedTokenAccount({
        mint: token.mint,
        owner: new PublicKey(to),
        programId: TOKEN_PROGRAM_ID,
      })
      const destATAInfo = await connection.getAccountInfo(destATA)
      console.log(sourceATA.toBase58(), destATA.toBase58())

      const txIns = []
      if (!destATAInfo) {
        txIns.push(
          Spl.makeCreateAssociatedTokenAccountInstruction({
            associatedAccount: destATA,
            instructionsType: [],
            mint: token.mint,
            owner: new PublicKey(to),
            payer: publicKey,
            programId: TOKEN_PROGRAM_ID,
          })
        )
      }
      txIns.push(
        Spl.makeTransferInstruction({
          source: sourceATA,
          destination: destATA,
          amount: BigInt(amount * Math.pow(10, token.decimals)),
          owner: publicKey,
          programId: TOKEN_PROGRAM_ID,
          instructionsType: [],
        })
      )

      const transaction = new Transaction().add(...txIns)

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
    <Modal title="Withdraw Token" open={open} setOpen={setOpen}>
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
