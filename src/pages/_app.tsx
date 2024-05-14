import "@/styles/globals.css"
import type { AppProps } from "next/app"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { useMemo } from "react"
import Layout from "@/layout"
import { clusterApiUrl } from "@solana/web3.js"
import { AccountsProvider } from "@/hooks/useAccounts"
import { TokenProvider } from "@/hooks/useToken"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { PoolsInfoProvider } from "@/hooks/usePoolsInfo"

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  const network =
    process.env.NEXT_PUBLIC_NETWORK == "MAIN"
      ? WalletAdapterNetwork.Mainnet
      : WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_URL!, [network])
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {/* <PoolsInfoProvider> */}
            <AccountsProvider>
              <TokenProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </TokenProvider>
            </AccountsProvider>
            {/* </PoolsInfoProvider> */}
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
