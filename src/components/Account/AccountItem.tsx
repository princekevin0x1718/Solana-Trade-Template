import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import bs58 from "bs58"
import toast from "react-hot-toast"
import { FcDonate, FcFullTrash, FcSettings, FcSurvey } from "react-icons/fc"
import Loading from "@/assets/Loading.svg"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import useAccounts from "@/hooks/useAccounts"

interface AccountItemProps {
  checked?: boolean
  onCheck?: any
  onEdit?: any
  onWithdraw: any
  onRemove?: any
  name: string
  pubKey: PublicKey
  privKey?: Uint8Array
}

const AccountItem: React.FC<AccountItemProps> = ({
  checked,
  name,
  pubKey,
  onWithdraw,
  onCheck,
  onEdit,
  onRemove,
  privKey,
}) => {
  const { connection } = useConnection()
  const { setBalance } = useAccounts()

  const onCopy = (text: string, type: "Pubkey" | "PrivKey") => {
    return async () => {
      await navigator.clipboard.writeText(text)
      toast.success(
        type === "Pubkey"
          ? "Address copied to clipboard"
          : "Account private key copied to clipboard"
      )
    }
  }

  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["fetchBalance", pubKey],
    queryFn: async () => {
      const result = await connection.getBalance(pubKey)
      setBalance((prev: any) => ({ ...prev, [pubKey.toBase58()]: result }))
      return result
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  })

  return (
    <tr className="text-center border-b text-sm hover:bg-black/5 cursor-pointer">
      <td className="text-left p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          disabled={checked === undefined}
        />
      </td>
      <td className="text-left">{name}</td>
      <td className="text-left" onClick={onCopy(pubKey.toBase58(), "Pubkey")}>
        {pubKey.toBase58()}
      </td>
      <td className="text-left">
        <span>
          {!isBalanceLoading ? (
            `${((balance ?? 0) / Math.pow(10, 9)).toLocaleString("en-US", {
              maximumFractionDigits: 3,
            })} SOL`
          ) : (
            <Image
              src={Loading.src}
              width={16}
              height={16}
              alt="loading"
              className="inline-block"
            />
          )}
        </span>
      </td>
      <td className="text-left">
        {onEdit && (
          <button
            className="rounded-full p-1 hover:shadow-md active:brightness-95 transition-all"
            onClick={onEdit}
          >
            <FcSettings size={20} />
          </button>
        )}
        {onWithdraw && (
          <button
            className="rounded-full p-1 hover:shadow-md active:brightness-95 transition-all"
            onClick={onWithdraw}
          >
            <FcDonate size={20} />
          </button>
        )}
        {onRemove && (balance ?? 0) <= 5000 && (
          <button
            className="rounded-full p-1 hover:shadow-md active:brightness-95 transition-all"
            onClick={onRemove}
          >
            <FcFullTrash size={20} />
          </button>
        )}
        {privKey && (
          <button
            className="rounded-full p-1 hover:shadow-md active:brightness-95 transition-all"
            onClick={onCopy(bs58.encode(privKey), "PrivKey")}
          >
            <FcSurvey size={20} />
          </button>
        )}
      </td>
    </tr>
  )
}

export default AccountItem
