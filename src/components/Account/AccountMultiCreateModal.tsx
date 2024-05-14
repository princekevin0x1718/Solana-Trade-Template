import useAccounts from "@/hooks/useAccounts"
import { Keypair } from "@solana/web3.js"
import { useState } from "react"
import Modal from "../Modal"
import toast from "react-hot-toast"

interface AccountMultiCreateProps {
  open: boolean
  setOpen: (t: boolean) => void
}
export default function AccountMultiCreate({
  open,
  setOpen,
}: AccountMultiCreateProps) {
  const [count, setCount] = useState(0)
  const { accounts, setAccounts } = useAccounts()

  const onCreate = () => {
    setAccounts((prev) => [
      ...prev,
      ...Array(count)
        .fill(0)
        .map((_, i) => ({
          name: `AC-${accounts.length + i + 1}`,
          key: Keypair.generate(),
        })),
    ])
    setOpen(false)
    toast.success("Multi sub accounts created successfully")
  }

  return (
    <Modal title="Create Sub Account" open={open} setOpen={setOpen}>
      <div className="flex flex-col mt-4">
        <span>Name: </span>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.valueAsNumber)}
          placeholder="Name"
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
