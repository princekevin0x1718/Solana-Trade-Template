import assert from "assert"

import {
  buildSimpleTransaction,
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeys,
  Percent,
  Token,
  TokenAmount,
  TxVersion,
} from "@raydium-io/raydium-sdk"
import { Connection, Keypair, PublicKey } from "@solana/web3.js"

import { formatAmmKeysById } from "./formatAmmKeysById"
import { buildAndSendTx, getWalletTokenAccount } from "./util"

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = {
  outputToken: Token
  inputTokenAmount: TokenAmount
  slippage: Percent
  walletTokenAccounts: WalletTokenAccounts
  wallet: PublicKey
}

export async function computeSwapAmountOut(
  connection: Connection,
  input: TestTxInputInfo
) {
  const targetPool = await fetch(
    "https://api.raydium.io/v2/sdk/liquidity/mainnet.json"
  )
    .then((res) => res.json())
    .then((res) => {
      const pools = [...res.official, ...res.unOfficial]
      return pools.find(
        (item) =>
          (item.baseMint === input.inputTokenAmount.token.mint.toBase58() &&
            item.quoteMint === input.outputToken.mint.toBase58()) ||
          (item.quoteMint === input.inputTokenAmount.token.mint.toBase58() &&
            item.baseMint === input.outputToken.mint.toBase58())
      )?.id
    })
    .catch((err) => console.log(err))
  console.log(targetPool)
  // -------- pre-action: get pool info --------
  const targetPoolInfo = await formatAmmKeysById(connection, targetPool)
  assert(targetPoolInfo, "cannot find the target pool")
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys

  console.log(targetPoolInfo)

  // -------- step 1: coumpute amount out --------
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  })
  console.log(amountOut, minAmountOut)
  return { poolKeys, amountOut, minAmountOut }
}

export async function swapOnlyAmm(
  connection: Connection,
  input: TestTxInputInfo
) {
  const { amountOut, minAmountOut, poolKeys } = await computeSwapAmountOut(
    connection,
    input
  )

  // -------- step 2: create instructions by SDK function --------
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: "in",
    makeTxVersion: TxVersion.V0,
  })

  console.log(
    "amountOut:",
    amountOut.toFixed(),
    "  minAmountOut: ",
    minAmountOut.toFixed()
  )

  const buildTx = await buildSimpleTransaction({
    connection,
    makeTxVersion: TxVersion.V0,
    payer: input.wallet,
    innerTransactions,
  })

  return buildTx
  // return { txids: await buildAndSendTx(innerTransactions) }
}
