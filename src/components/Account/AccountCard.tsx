import { useState } from "react"
import { FcDataRecovery, FcDonate, FcPlus } from "react-icons/fc"
import { toast } from "react-hot-toast"
import AccountImportModal from "./AccountImportModal"
import useAccounts from "@/hooks/useAccounts"
import AccountEditModal from "./AccountEditModal"
import AccountMultiCreate from "./AccountMultiCreateModal"
import { useWallet } from "@solana/wallet-adapter-react"
import AccountWithdrawModal from "./AccountWithdrawModal"
import AccountItem from "./AccountItem"
import AccountMultiDepositModal from "./AccountMultiDepositModal"

const AccountCard = () => {
  const { accounts, setAccounts, selects, setSelects, balance } = useAccounts()
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [multiDepositModalOpen, setMultiDepositModalOpen] = useState(false)
  const [editModalIndex, setEditModalIndex] = useState(-1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [multiCreateModalOpen, setMultiCreateModalOpen] = useState(false)
  const { publicKey } = useWallet()
  const [withdrawModalIndex, setWithdrawModalIndex] = useState(-1)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)

  const onImport = () => {
    setImportModalOpen(true)
  }

  const onMultiCreate = () => {
    setMultiCreateModalOpen(true)
  }

  const onMultiDeposit = () => setMultiDepositModalOpen(true)

  const onEdit = (i: number) => {
    return () => {
      setEditModalIndex(i)
      setEditModalOpen(true)
    }
  }

  const onWithdraw = (i: number) => {
    return () => {
      setWithdrawModalIndex(i)
      setWithdrawModalOpen(true)
    }
  }

  const onRemove = (i: number) => {
    return () => {
      setSelects((prev) => [
        ...prev.filter((item) => item < accounts.length - 1),
      ])
      setAccounts((prev) => [...prev.slice(0, i), ...prev.slice(i + 1)])
      toast.success("Sub account removed successfully")
    }
  }

  const onCheck = (i: number) => {
    return () => {
      const id = selects.findIndex((item) => item === i)
      if (id > -1) {
        setSelects((prev) => [...prev.slice(0, id), ...prev.slice(id + 1)])
      } else {
        setSelects((prev) => [...prev, i])
      }
    }
  }

  const onCheckAll = () => {
    if (selects.length === accounts.length) setSelects([])
    else
      setSelects(
        Array(accounts.length)
          .fill(0)
          .map((_, i) => i)
      )
  }

  return (
    <>
      <div className="bg-white shadow-sm mt-4 py-4 px-6 w-full">
        <div className="flex justify-between items-center pb-2">
          <h4 className="text-lg font-bold">Accounts</h4>
          <div className="flex items-center">
            <span className="mr-2">
              Total Balances:{" "}
              {(
                accounts.reduce(
                  (prev, cur) =>
                    prev + (balance?.[cur.key.publicKey.toBase58()] ?? 0),
                  publicKey ? balance?.[publicKey.toBase58()] ?? 0 : 0
                ) / Math.pow(10, 9)
              ).toLocaleString("en-US", { maximumFractionDigits: 3 })}
            </span>
            <button
              className="rounded-full p-2 hover:shadow-lg active:brightness-95 transition-all"
              onClick={onMultiDeposit}
            >
              <FcDonate size={24} />
            </button>
            <button
              className="rounded-full p-2 hover:shadow-lg active:brightness-95 transition-all"
              onClick={onMultiCreate}
            >
              <FcDataRecovery size={24} />
            </button>
            <button
              className="rounded-full p-2 hover:shadow-lg active:brightness-95 transition-all"
              onClick={onImport}
            >
              <FcPlus size={24} />
            </button>
          </div>
        </div>
        <div className="table w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b cursor-pointer">
                <th className="text-left p-3">
                  <input
                    type="checkbox"
                    checked={selects.length === accounts.length}
                    onChange={onCheckAll}
                  />
                </th>
                <th className="text-sm text-left">Name</th>
                <th className="text-sm text-left">Address</th>
                <th className="text-sm text-left">Balance</th>
                <th className="text-sm text-left">Function</th>
              </tr>
            </thead>
            <tbody>
              {publicKey && (
                <AccountItem
                  name="Wallet"
                  pubKey={publicKey}
                  onWithdraw={onWithdraw(-1)}
                />
              )}
              {accounts.map((item, i) => (
                <AccountItem
                  key={i}
                  checked={selects.find((item) => item === i) !== undefined}
                  name={item.name}
                  pubKey={item.key.publicKey}
                  privKey={item.key.secretKey}
                  onWithdraw={onWithdraw(i)}
                  onCheck={onCheck(i)}
                  onEdit={onEdit(i)}
                  onRemove={onRemove(i)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AccountMultiDepositModal
        open={multiDepositModalOpen}
        setOpen={setMultiDepositModalOpen}
      />
      <AccountMultiCreate
        open={multiCreateModalOpen}
        setOpen={setMultiCreateModalOpen}
      />
      <AccountImportModal open={importModalOpen} setOpen={setImportModalOpen} />
      <AccountWithdrawModal
        open={withdrawModalOpen}
        setOpen={setWithdrawModalOpen}
        wallet={accounts?.[withdrawModalIndex]?.key}
        publicKey={
          withdrawModalIndex === -1
            ? publicKey ?? undefined
            : accounts[withdrawModalIndex].key.publicKey
        }
      />
      <AccountEditModal
        index={editModalIndex}
        open={editModalOpen}
        setOpen={setEditModalOpen}
      />
    </>
  )
}

export default AccountCard
