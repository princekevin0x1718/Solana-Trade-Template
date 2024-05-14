import { formatAmmKeysToApi } from "@/utils/formatAmmKeys"
import { formatClmmKeys } from "@/utils/formatClmmKeys"
import { ApiClmmPoolsItem, ApiPoolInfo } from "@raydium-io/raydium-sdk"
import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import React, { useState, Dispatch, SetStateAction, useEffect } from "react"

const defaultVal: {
  sPool?: ApiPoolInfo
  clmmPools?: ApiClmmPoolsItem[]
  isLoading: boolean
} = {
  isLoading: false,
}

export const PoolsInfoContext = React.createContext(defaultVal)

export default function usePoolsInfo() {
  return React.useContext(PoolsInfoContext)
}

export const PoolsInfoProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { connection } = useConnection()

  const { data: sPool, isLoading: sPoolLoading } = useQuery({
    queryKey: ["fetchSPoolInfo"],
    queryFn: async () => {
      return undefined
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
    },
    refetchOnWindowFocus: false,
  })

  const { data: clmmPools, isLoading: clmmPoolsLoading } = useQuery({
    queryKey: ["fetchClmmPoolsInfo"],
    queryFn: async () => {
      console.log("----------fetching")
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
    },
  })

  console.log(sPool, clmmPools)

  return (
    <PoolsInfoContext.Provider
      value={{ sPool, clmmPools, isLoading: sPoolLoading || clmmPoolsLoading }}
    >
      {children}
    </PoolsInfoContext.Provider>
  )
}
