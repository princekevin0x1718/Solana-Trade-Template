import { useEffect, useState } from "react"
import {
  SPL_MINT_LAYOUT,
  TOKEN_PROGRAM_ID,
  Token,
} from "@raydium-io/raydium-sdk"
import Modal from "../Modal"
import toast from "react-hot-toast"
import useToken from "@/hooks/useToken"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Metaplex } from "@metaplex-foundation/js"

interface TokenEditModalProps {
  open: boolean
  setOpen: (t: boolean) => void
}
export default function TokenEditModal({ open, setOpen }: TokenEditModalProps) {
  const [address, setAddress] = useState("")
  const { token, setToken } = useToken()
  const { connection } = useConnection()

  useEffect(() => {
    if (open) {
      setAddress(token?.mint?.toBase58() ?? "")
    }
  }, [open])

  const onSave = async () => {
    if (address) {
      try {
        const token = await connection.getAccountInfo(new PublicKey(address))
        const mx = Metaplex.make(connection)
        const tokenInfo = await mx
          .nfts()
          .findByMint({ mintAddress: new PublicKey(address) })
        if (token) {
          const decoded = SPL_MINT_LAYOUT.decode(token.data)
          console.log(decoded)

          setToken(
            new Token(
              TOKEN_PROGRAM_ID,
              new PublicKey(address),
              decoded.decimals,
              tokenInfo.symbol,
              tokenInfo.name
            )
          )
          setOpen(false)
          toast.success("Token edited successfully")
        } else {
          toast.error("Invalid token address")
        }
      } catch (err: any) {
        console.log(err)
        toast.error(err?.message ?? err)
      }
    }
  }

  return (
    <Modal title="Edit Token" open={open} setOpen={setOpen}>
      <div className="flex flex-col mt-4">
        <span>Address: </span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
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
          onClick={onSave}
        >
          SAVE
        </button>
      </div>
    </Modal>
  )
}
