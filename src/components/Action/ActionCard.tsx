import { useEffect, useState } from "react"
import { FcSupport } from "react-icons/fc"
import { toast } from "react-hot-toast"
import BN from "bn.js"
import useAccounts from "@/hooks/useAccounts"
import TokenEditModal from "./TokenEditModal"
import useToken from "@/hooks/useToken"
import {
  CurrencyAmount,
  Percent,
  SPL_ACCOUNT_LAYOUT,
  SPL_MINT_LAYOUT,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
} from "@raydium-io/raydium-sdk"
import { routeSwap } from "@/utils/swapRoute"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { getWalletTokenAccount, sendTx, sendWalletTx } from "@/utils/util"
import { SOL } from "@/constants"
import Loading from "@/assets/Loading.svg"
import Image from "next/image"
import { Metaplex, PublicKey } from "@metaplex-foundation/js"
import { useRouter } from "next/navigation"
import usePoolsInfo from "@/hooks/usePoolsInfo"

const AccountCard = () => {
  const router = useRouter()
  const { accounts, selects } = useAccounts()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [buyAmount, setBuyAmount] = useState(0)
  const [sellAmount, setSellAmount] = useState(100)
  const [slippage, setSlippage] = useState(1)
  const [tokenInput, setTokenInput] = useState("")
  const { token, setToken } = useToken()
  const { connection } = useConnection()
  const { sendTransaction, publicKey } = useWallet()
  const [buyLoading, setBuyLoading] = useState(false)
  const [sellLoading, setSellLoading] = useState(false)
  const { clmmPools, sPool, isLoading } = usePoolsInfo()

  useEffect(() => {
    setTokenInput(token?.mint?.toBase58() ?? "")
  }, [])

  const onTokenInput = async () => {
    if (tokenInput) {
      try {
        const token = await connection.getAccountInfo(new PublicKey(tokenInput))
        const mx = Metaplex.make(connection)
        const tokenInfo = await mx
          .nfts()
          .findByMint({ mintAddress: new PublicKey(tokenInput) })
        if (token) {
          const decoded = SPL_MINT_LAYOUT.decode(token.data)

          setToken(
            new Token(
              TOKEN_PROGRAM_ID,
              new PublicKey(tokenInput),
              decoded.decimals,
              tokenInfo.symbol,
              tokenInfo.name
            )
          )
          toast.success("Token loaded succesfully")
          router.push(`/token/${tokenInput}`)
        } else {
          toast.error("Invalid token address")
        }
      } catch (err: any) {
        console.log(err)
        toast.error(err?.message ?? err)
      }
    }
  }

  const onTrade = async (mode: "buy" | "sell") => {
    try {
      if (!token) {
        toast.error("Invalid token")
        return
      }

      const owner =
        selects.length > 0 ? accounts[selects[0]].key.publicKey : publicKey

      if (!owner) {
        toast.error("Invalid account")
        return
      }

      const inputToken = mode === "buy" ? SOL : token
      const outputToken = mode === "buy" ? token : SOL

      let tokenAmount
      if (mode === "buy") {
        tokenAmount = new BN(buyAmount * Math.pow(10, inputToken.decimals))
      } else {
        const accountInfo = await connection.getTokenAccountsByOwner(owner, {
          mint: token.mint,
        })
        tokenAmount = accountInfo.value.length
          ? SPL_ACCOUNT_LAYOUT.decode(accountInfo.value[0].account.data)
              .amount.mul(new BN(sellAmount * 100))
              .div(new BN(10000))
          : new BN(0)
      }

      if (tokenAmount.lte(new BN(0))) {
        toast.error("Invalid amount")
        return
      }

      mode === "buy" ? setBuyLoading(true) : setSellLoading(true)

      console.log(tokenAmount.toString())

      const walletTokenAccounts = await getWalletTokenAccount(connection, owner)
      const inputTokenAmount = new (
        inputToken instanceof Token ? TokenAmount : CurrencyAmount
      )(inputToken, tokenAmount)

      const tx = await routeSwap(connection, {
        inputToken,
        outputToken,
        slippage: new Percent(Math.floor(slippage), 100),
        wallet: owner,
        walletTokenAccounts,
        inputTokenAmount,
      })

      if (selects.length > 0) {
        const txids = await sendTx(connection, accounts[selects[0]].key, tx)
        console.log(txids)
        toast.success(
          mode === "buy"
            ? "Bought token successfully"
            : "Sold token successfully"
        )
      } else {
        const txids = await sendWalletTx(connection, sendTransaction, tx)
        console.log(txids)
        toast.success(
          mode === "buy"
            ? "Bought token successfully"
            : "Sold token successfully"
        )
      }
    } catch (err: any) {
      console.log(err)
      toast.error(err?.message ?? err)
    }
    mode === "buy" ? setBuyLoading(false) : setSellLoading(false)
  }

  return (
    <>
      <div className="bg-white shadow-sm mt-4 py-4 px-6">
        <div className="flex justify-between items-center pb-2 border-b">
          <h4 className="text-lg font-bold">Actions</h4>
        </div>
        <div>
          <div className="flex items-center mt-3">
            <span>Token:</span>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Token address"
              className="border px-3 py-1 ml-4"
            />

            <button
              className="ml-2 hover:brightness-90 active:brightness-95 transition-all"
              onClick={onTokenInput}
            >
              <FcSupport size={20} />
            </button>
          </div>
          <div className="flex items-center mt-3">
            <span>Slippage (%):</span>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.valueAsNumber)}
              placeholder=""
              className="border px-3 py-1 ml-4"
            />
          </div>
          <div className="flex items-center mt-3">
            <span>Buy (SOL):</span>
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.valueAsNumber)}
              placeholder=""
              className="border px-3 py-1 ml-4"
            />
            {buyLoading ? (
              <Image
                src={Loading.src}
                width={Loading.width}
                height={Loading.height}
                alt="loading"
              />
            ) : (
              <button
                className="bg-[#512da8] text-white py-1 px-6 hover:brightness-90 active:brightness-95 transition-all"
                onClick={() => onTrade("buy")}
              >
                Buy
              </button>
            )}
          </div>
          <div className="flex items-center mt-3">
            <span>Sell (%):</span>
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.valueAsNumber)}
              placeholder=""
              className="border px-3 py-1 ml-4"
            />
            {sellLoading ? (
              <Image
                src={Loading.src}
                width={Loading.width}
                height={Loading.height}
                alt="loading"
              />
            ) : (
              <button
                className="bg-[#512da8] text-white py-1 px-6 hover:brightness-90 active:brightness-95 transition-all"
                onClick={() => onTrade("sell")}
              >
                Sell
              </button>
            )}
          </div>
        </div>
      </div>
      <TokenEditModal open={editModalOpen} setOpen={setEditModalOpen} />
    </>
  )
}

export default AccountCard
