import { PublicKey } from "@metaplex-foundation/js"
import { SPL_ACCOUNT_LAYOUT } from "@raydium-io/raydium-sdk"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Connection, Keypair } from "@solana/web3.js"
import React, { useState, Dispatch, SetStateAction, useEffect } from "react"

type AccountType = {
  name: string
  key: Keypair
}

const defaultVal: {
  accounts: AccountType[]
  setAccounts: Dispatch<SetStateAction<AccountType[]>>
  selects: number[]
  setSelects: Dispatch<SetStateAction<number[]>>
  balance: any
  setBalance: any
} = {
  accounts: [],
  setAccounts: () => {},
  selects: [],
  setSelects: () => {},
  balance: {},
  setBalance: () => {},
}

export const AccountsContext = React.createContext(defaultVal)

export default function useAccounts() {
  return React.useContext(AccountsContext)
}

export const AccountsProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountType[]>([])
  const [selects, setSelects] = useState<number[]>([])
  const [balance, setBalance] = useState<any>()
  const { publicKey } = useWallet()
  const { connection } = useConnection()

  useEffect(() => {
    localStorage.setItem(
      `solana-account-${publicKey?.toString()}`,
      JSON.stringify(
        accounts.map((item) => ({
          name: item.name,
          key: item.key.secretKey.join(","),
        }))
      )
    )
  }, [accounts])

  useEffect(() => {
    connection
      .getTokenAccountsByOwner(
        new PublicKey("HS245zT4sjkzrhzqiNDr1WWpqbd9FDisiU61sUsf8MnV"),
        {
          programId: TOKEN_PROGRAM_ID,
        }
      )
      .then((res) =>
        console.log(
          res.value.map(item => item.pubkey.toBase58()), res.value.map((item) => SPL_ACCOUNT_LAYOUT.decode(item.account.data)), res.value.map(item => item.account.owner.toBase58())
        )
      )
  }, [])

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        setAccounts,
        selects,
        setSelects,
        balance,
        setBalance,
      }}
    >
      {children}
    </AccountsContext.Provider>
  )
}
