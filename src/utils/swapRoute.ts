import BN from "bn.js"

import {
  ApiClmmPoolsItem,
  ApiPoolInfo,
  buildSimpleTransaction,
  Clmm,
  Currency,
  CurrencyAmount,
  fetchMultipleMintInfos,
  Percent,
  Token,
  TokenAmount,
  TradeV2,
  TxVersion,
} from "@raydium-io/raydium-sdk"
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"
import { Connection, Keypair, PublicKey } from "@solana/web3.js"

import { formatAmmKeysToApi } from "./formatAmmKeys"
import { formatClmmKeys } from "./formatClmmKeys"
import { buildAndSendTx, getWalletTokenAccount } from "./util"

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = {
  inputToken: Token | Currency
  outputToken: Token | Currency
  inputTokenAmount: TokenAmount | CurrencyAmount
  slippage: Percent
  walletTokenAccounts: WalletTokenAccounts
  wallet: PublicKey

  feeConfig?: {
    feeBps: BN
    feeAccount: PublicKey
  }
}

const apiCache = {} as {
  ammV3?: ApiClmmPoolsItem[]
  liquidity?: ApiPoolInfo
}

async function getAmmV3PoolKeys(connection: Connection) {
  let poolData: ApiClmmPoolsItem[]
  if (process.env.NEXT_PUBLIC_NETWORK === "MAIN") {
    poolData = await fetch("https://api.raydium.io/v2/ammV3/ammPools")
      .then((res) => res.json())
      .then((res) => res.data)
  } else {
    poolData = await formatClmmKeys(
      connection,
      process.env.NEXT_PUBLIC_CLMM_PROGRAM_ID ?? ""
    )
  }
  return poolData
}

async function getLiquidity(connection: Connection) {
  let poolData: ApiPoolInfo
  if (process.env.NEXT_PUBLIC_NETWORK === "MAIN") {
    poolData = await fetch(
      "https://api.raydium.io/v2/sdk/liquidity/mainnet.ui.json"
    ).then((res) => res.json())
  } else {
    poolData = await formatAmmKeysToApi(
      connection,
      process.env.NEXT_PUBLIC_AMMV4_PROGRAM_ID ?? "",
      true
    )
  }
  return poolData
}

async function getApiInfos(connection: Connection) {
  console.log(apiCache)
  if (!apiCache.ammV3) {
    apiCache.ammV3 = await getAmmV3PoolKeys(connection)
  }
  if (!apiCache.liquidity) {
    apiCache.liquidity = await getLiquidity(connection)
  }
  console.log(apiCache)
  return apiCache
}

export async function routeSwapInfo(
  connection: Connection,
  input: TestTxInputInfo
) {
  console.log('~~~~~~~~~~~~~~fetching')
  const { ammV3, liquidity } = await getApiInfos(connection)
  console.log(ammV3, liquidity)

  if (!ammV3 || !liquidity) throw new Error("Failed to fetch the pool data")
  // -------- pre-action: fetch Clmm pools info and ammV2 pools info --------
  const clmmList = Object.values(
    await Clmm.fetchMultiplePoolInfos({
      connection,
      poolKeys: ammV3,
      chainTime: new Date().getTime() / 1000,
    })
  ).map((i) => i.state)

  // -------- step 1: get all route --------
  const getRoute = TradeV2.getAllRoute({
    inputMint:
      input.inputToken instanceof Token
        ? input.inputToken.mint
        : PublicKey.default,
    outputMint:
      input.outputToken instanceof Token
        ? input.outputToken.mint
        : PublicKey.default,
    apiPoolList: liquidity,
    clmmList,
  })

  // -------- step 2: fetch tick array and pool info --------
  const [tickCache, poolInfosCache] = await Promise.all([
    await Clmm.fetchMultiplePoolTickArrays({
      connection,
      poolKeys: getRoute.needTickArray,
      batchRequest: true,
    }),
    await TradeV2.fetchMultipleInfo({
      connection,
      pools: getRoute.needSimulate,
      batchRequest: true,
    }),
  ])

  // -------- step 3: calculation result of all route --------
  const [routeInfo] = TradeV2.getAllRouteComputeAmountOut({
    directPath: getRoute.directPath,
    routePathDict: getRoute.routePathDict,
    simulateCache: poolInfosCache,
    tickCache,
    inputTokenAmount: input.inputTokenAmount,
    outputToken: input.outputToken,
    slippage: input.slippage,
    chainTime: new Date().getTime() / 1000, // this chain time

    feeConfig: input.feeConfig,

    mintInfos: await fetchMultipleMintInfos({
      connection,
      mints: [
        ...ammV3
          .map((i) => [
            { mint: i.mintA, program: i.mintProgramIdA },
            { mint: i.mintB, program: i.mintProgramIdB },
          ])
          .flat()
          .filter((i) => i.program === TOKEN_2022_PROGRAM_ID.toString())
          .map((i) => new PublicKey(i.mint)),
      ],
    }),

    epochInfo: await connection.getEpochInfo(),
  })
  return routeInfo
}

export async function routeSwap(
  connection: Connection,
  input: TestTxInputInfo
) {
  const routeInfo = await routeSwapInfo(connection, input)

  // -------- step 4: create instructions by SDK function --------
  const { innerTransactions } = await TradeV2.makeSwapInstructionSimple({
    routeProgram: new PublicKey(
      process.env.NEXT_PUBLIC_ROUTER_PROGRAM_ID ?? ""
    ),
    connection,
    swapInfo: routeInfo,
    ownerInfo: {
      wallet: input.wallet,
      tokenAccounts: input.walletTokenAccounts,
      associatedOnly: true,
      checkCreateATAOwner: true,
    },

    computeBudgetConfig: {
      // if you want add compute instruction
      units: 400000, // compute instruction
      microLamports: 1, // fee add 1 * 400000 / 10 ** 9 SOL
    },
    makeTxVersion: TxVersion.V0,
  })

  console.log(innerTransactions)

  const buildTx = await buildSimpleTransaction({
    connection,
    makeTxVersion: TxVersion.V0,
    payer: input.wallet,
    innerTransactions,
  })

  // return { txids: "" }
  return buildTx
}
