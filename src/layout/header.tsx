import useAccounts from "@/hooks/useAccounts"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

import "@solana/wallet-adapter-react-ui/styles.css"
import { Keypair } from "@solana/web3.js"
import { useEffect } from "react"

const Header = () => {
  const { publicKey } = useWallet()
  const { setAccounts } = useAccounts()

  useEffect(() => {
    if (!publicKey) setAccounts([])
    else {
      const accounts = localStorage.getItem(
        `solana-account-${publicKey.toString()}`
      )
      setAccounts([
        ...(accounts
          ? JSON.parse(accounts)?.map((item: any) => ({
              name: item.name,
              key: Keypair.fromSecretKey(
                new Uint8Array(item.key.split(",").map(parseFloat))
              ),
            })) ?? []
          : []),
      ])
    }
  }, [publicKey])

  return (
    <div className="flex justify-center bg-white py-3 shadow-sm">
      <div className="container flex justify-between items-center">
        <h4 className="text-xl text-[#512da8] font-extrabold">SOLANA SWAP</h4>
        <WalletMultiButton />
      </div>
    </div>
  )
}

export default Header
