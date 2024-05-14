import useAccounts from "@/hooks/useAccounts"
import { Keypair } from "@solana/web3.js"
import { useEffect, useState } from "react"
import Modal from "../Modal"
import toast from "react-hot-toast"
import bs58 from "bs58"

interface AccountImportModalProps {
  open: boolean
  setOpen: (t: boolean) => void
}
export default function AccountImportModal({
  open,
  setOpen,
}: AccountImportModalProps) {
  const [name, setName] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const { accounts, setAccounts } = useAccounts()

  useEffect(() => {
    if (open) setName(`AC-${accounts.length + 1}`)
  }, [open])

  const onCreate = async () => {
    const key = privateKey
      ? Keypair.fromSecretKey(bs58.decode(privateKey))
      : Keypair.generate()

    console.log(key.secretKey)

    setAccounts((prev) => [...prev, { name, key }])
    setOpen(false)
    toast.success(
      privateKey
        ? "Sub accout imported successfully"
        : "Sub account created successfully"
    )
  }

  return (
    <Modal title="Create Sub Account" open={open} setOpen={setOpen}>
      <div className="flex flex-col mt-4">
        <span>Name: </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border mt-2 px-3 py-1.5"
        />
      </div>
      <div className="flex flex-col mt-4">
        <span>Private Key: </span>
        <input
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Leave it blank for new account"
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
          onClick={onCreate}
        >
          CREATE
        </button>
      </div>
    </Modal>
  )
}
