import { ChangeEvent, useEffect, useState } from "react"
import Modal from "../Modal"
import toast from "react-hot-toast"
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js"
import useAccounts from "@/hooks/useAccounts"
import { AnchorProvider, Idl, Program, web3, BN } from "@project-serum/anchor"
import idl from "@/program/idl.json"
import Loading from "@/assets/Loading.svg"
import Image from "next/image"
import { Spl, TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk"
import useToken from "@/hooks/useToken"

interface PositionMultiDepositModalProps {
  open: boolean
  setOpen: (t: boolean) => void
}
export default function PositionMultiDepositModal({
  open,
  setOpen,
}: PositionMultiDepositModalProps) {
  const [amounts, setAmounts] = useState<number[]>([])
  const { connection } = useConnection()
  const { accounts } = useAccounts()
  const wallet = useAnchorWallet()
  const { sendTransaction } = useWallet()
  const [loading, setLoading] = useState(false)
  const { token } = useToken()

  const onDeposit = async () => {
    try {
      if (!wallet) {
        toast.error("Connect your wallet first")
        return
      }
      if (!token) {
        toast.error("Invalid token")
        return
      }
      const provider = new AnchorProvider(connection, wallet, {})
      const program = new Program(
        idl as Idl,
        process.env.NEXT_PUBLIC_MULTI_WITHDRAW_PROGRAM ?? "",
        provider
      )
      const inputs = amounts
        .map((item, i) => ({
          amount: item,
          account: accounts[i].key.publicKey,
          ata: Spl.getAssociatedTokenAccount({
            mint: token.mint,
            owner: accounts[i].key.publicKey,
            programId: TOKEN_PROGRAM_ID,
          }),
        }))
        .filter((item) => !isNaN(item.amount) && item.amount > 0)
      if (inputs.length === 0) {
        toast.error("Input the amount")
        return
      }
      setLoading(true)

      const sourceATA = Spl.getAssociatedTokenAccount({
        mint: token.mint,
        owner: wallet.publicKey,
        programId: TOKEN_PROGRAM_ID,
      })

      const txIns: any = []

      for (let index = 0; index < inputs.length; index++) {
        const ataInfo = await connection.getAccountInfo(inputs[index].ata)

        if (!ataInfo) {
          txIns.push(
            Spl.makeCreateAssociatedTokenAccountInstruction({
              associatedAccount: inputs[index].ata,
              instructionsType: [],
              mint: token.mint,
              owner: inputs[index].account,
              payer: wallet.publicKey,
              programId: TOKEN_PROGRAM_ID,
            })
          )
        }
      }

      const tx = await program.methods
        .withdrawToken(
          inputs.map(
            (item) => new BN(item.amount * Math.pow(10, token.decimals))
          )
        )
        .accounts({
          signer: wallet.publicKey,
          senderToken: sourceATA,
          systemProgram: web3.SystemProgram.programId,
        })
        .remainingAccounts(
          inputs.map((item) => ({
            pubkey: item.ata,
            isSigner: false,
            isWritable: true,
          }))
        )
        .instruction()

      txIns.push(tx)
      const transaction = new Transaction().add(...txIns)
      const res = await sendTransaction(transaction, connection)
      console.log(res)
      setOpen(false)
      toast.success("Deposited successfully")
    } catch (err: any) {
      console.log(err)
      toast.error(err?.message ?? err)
    }
    setLoading(false)
  }

  const onEdit = (i: number) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setAmounts([
        ...amounts.slice(0, i),
        e.target.valueAsNumber,
        ...amounts.slice(i + 1),
      ])
    }
  }

  useEffect(() => {
    setAmounts(accounts.map(() => 0))
  }, [open])

  return (
    <Modal title="Deposit" open={open} setOpen={setOpen}>
      {accounts.map((item, i) => (
        <div key={i} className="flex flex-col mt-3">
          <span>{item.name}: </span>
          <input
            type="number"
            value={amounts[i]}
            onChange={onEdit(i)}
            placeholder="Amount"
            className="border mt-2 px-3 py-1.5"
          />
        </div>
      ))}
      <div className="flex space-x-4 mt-6">
        <button
          className="border border-[#512da8] text-[#512da8] py-1.5 w-full hover:brightness-90 active:brightness-95 transition-all"
          onClick={() => setOpen(false)}
        >
          CANCEL
        </button>
        <button
          className="flex items-center justify-center border border-[#512da8] bg-[#512da8] text-white py-1.5 w-full hover:brightness-90 active:brightness-95 transition-all disabled:bg-transparent"
          onClick={onDeposit}
          disabled={loading}
        >
          {loading ? (
            <Image src={Loading.src} width={20} height={20} alt="loading" />
          ) : (
            "DEPOSIT"
          )}
        </button>
      </div>
    </Modal>
  )
}
