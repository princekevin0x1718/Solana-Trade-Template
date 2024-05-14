import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { FcCurrencyExchange } from "react-icons/fc"
import { FaFire } from "react-icons/fa"
import Loading from "@/assets/Loading.svg"
import Image from "next/image"
import {
  Percent,
  SPL_ACCOUNT_LAYOUT,
  TokenAmount,
} from "@raydium-io/raydium-sdk"
import useToken from "@/hooks/useToken"
import { useQuery } from "@tanstack/react-query"
import BN from "bn.js"
import { routeSwapInfo } from "@/utils/swapRoute"
import { SOL } from "@/constants"
import { getWalletTokenAccount } from "@/utils/util"
import usePoolsInfo from "@/hooks/usePoolsInfo"

interface PositionItemProps {
  onWithdrawToken: any
  onBurnToken: any
  name: string
  pubKey: PublicKey
}

const PositionItem: React.FC<PositionItemProps> = ({
  name,
  pubKey,
  onWithdrawToken,
  onBurnToken,
}) => {
  const { connection } = useConnection()
  const { token } = useToken()
  const { clmmPools, sPool, isLoading } = usePoolsInfo()

  const { data: tokenBalance, isLoading: isTokenLoading } = useQuery({
    queryKey: ["fetchTokenBalance", pubKey, token],
    queryFn: async () => {
      if (!token) return undefined
      const accountInfo = await connection.getTokenAccountsByOwner(pubKey, {
        mint: token.mint,
      })

      return new TokenAmount(
        token,
        accountInfo.value.length
          ? SPL_ACCOUNT_LAYOUT.decode(accountInfo.value[0].account.data).amount
          : new BN(0)
      )
    },
    enabled: Boolean(token),
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
  })

  const { data: swapEstAmount, isLoading: isEstLoading } = useQuery({
    queryKey: [
      "fetchSwapEstimation",
      pubKey,
      token,
      tokenBalance,
      sPool,
      clmmPools,
    ],
    queryFn: async () => {
      if (!token || !tokenBalance) return 0
      if (tokenBalance.isZero()) return 0
      const walletTokenAccounts = await getWalletTokenAccount(
        connection,
        pubKey
      )

      const routeInfo = await routeSwapInfo(connection, {
        inputToken: token,
        outputToken: SOL,
        inputTokenAmount: tokenBalance,
        slippage: new Percent(1, 100),
        wallet: pubKey,
        walletTokenAccounts,
      })

      console.log(
        routeInfo,
        routeInfo.amountOut.amount.toExact(),
        routeInfo.amountOut.amount.raw.toString()
      )

      return parseFloat(routeInfo.amountOut.amount.toExact())
    },
    enabled: Boolean(token),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  })

  return (
    <tr className="text-center border-b text-sm hover:bg-black/5 cursor-pointer">
      <td className="text-left py-3">{name}</td>
      <td className="text-left">
        {token ? (
          <span>
            {!isTokenLoading ? (
              `${
                tokenBalance
                  ? parseFloat(tokenBalance.toExact() ?? "0").toLocaleString(
                      "en-US",
                      {
                        maximumFractionDigits: 3,
                      }
                    )
                  : 0
              }`
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
        ) : null}
        {token ? (
          <span>
            &nbsp;/&nbsp;
            {!isEstLoading && !isLoading ? (
              `${swapEstAmount ?? 0} SOL`
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
        ) : null}
      </td>
      <td className="text-left">
        {onWithdrawToken && parseFloat(tokenBalance?.toExact() ?? "0") > 0 && (
          <button
            className="rounded-full p-1 hover:shadow-md active:brightness-95 transition-all"
            onClick={onWithdrawToken}
          >
            <FcCurrencyExchange size={20} />
          </button>
        )}
        {onBurnToken && parseFloat(tokenBalance?.toExact() ?? "0") > 0 && (
          <button
            className="rounded-full p-1 hover:shadow-md active:brightness-95 transition-all"
            onClick={onBurnToken}
          >
            <FaFire size={20} fill="#f96111" />
          </button>
        )}
      </td>
    </tr>
  )
}

export default PositionItem
