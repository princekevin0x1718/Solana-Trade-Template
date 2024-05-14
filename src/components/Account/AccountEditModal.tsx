import useAccounts from "@/hooks/useAccounts"
import { useEffect, useState } from "react"
import Modal from "../Modal"
import toast from "react-hot-toast"

interface AccountEditModalProps {
  index: number
  open: boolean
  setOpen: (t: boolean) => void
}
export default function AccountEditModal({
  index,
  open,
  setOpen,
}: AccountEditModalProps) {
  const [name, setName] = useState("")
  const { accounts, setAccounts } = useAccounts()

  useEffect(() => {
    if (index > -1) setName(accounts[index].name)
  }, [index])

  const onSave = () => {
    setAccounts((prev) => {
      let newAccounts = [...prev]
      newAccounts[index].name = name
      return newAccounts
    })
    setOpen(false)
    toast.success("Account edited successfully")
  }

  return (
    <Modal title="Edit Account" open={open} setOpen={setOpen}>
      <div className="flex flex-col mt-4">
        <span>Name: </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          onClick={onSave}
        >
          SAVE
        </button>
      </div>
    </Modal>
  )
}
