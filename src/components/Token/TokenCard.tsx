import { Metaplex, PublicKey } from "@metaplex-foundation/js"
import {
  SPL_MINT_LAYOUT,
  TOKEN_PROGRAM_ID,
  Token,
} from "@raydium-io/raydium-sdk"
import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import Loading from "@/assets/Loading.svg"
import Image from "next/image"
import useToken from "@/hooks/useToken"

type TokenCardProps = {
  address: string
}

const TokenCard: React.FC<TokenCardProps> = ({ address }) => {
  const { connection } = useConnection()
  const { setToken } = useToken()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["fetchTokenInfo", address],
    queryFn: async () => {
      const token = await connection.getAccountInfo(new PublicKey(address))
      const mx = Metaplex.make(connection)
      const tokenInfo = await mx
        .nfts()
        .findByMint({ mintAddress: new PublicKey(address) })
      if (token) {
        const decoded = SPL_MINT_LAYOUT.decode(token.data)
        console.log(decoded)

        const totalSupply = await connection.getTokenSupply(
          new PublicKey(address)
        )
        setToken(
          new Token(
            TOKEN_PROGRAM_ID,
            new PublicKey(address),
            decoded.decimals,
            tokenInfo.symbol,
            tokenInfo.name
          )
        )
        return {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          decimals: decoded.decimals,
          totalSupply: totalSupply.value.uiAmount,
          freeze: decoded.freezeAuthority.toBase58(),
          mintable: decoded.mintAuthority.toBase58(),
        }
      } else {
        throw new Error("Invalid token")
      }
    },
  })

  return (
    <div className="bg-white shadow-sm mt-4 py-4 px-6">
      <div className="flex justify-between items-center pb-2 border-b mb-4">
        <h4 className="text-lg font-bold">Token</h4>
      </div>
      {isLoading ? (
        <Image src={Loading.src} width={60} height={60} alt="loading" />
      ) : isError || !data ? (
        <h2 className="text-red-600 font-bold">Failed to load token info</h2>
      ) : (
        <>
          <div className="py-2">
            Address: <b>{address}</b>
          </div>
          <div className="py-2">
            Name: <b>{data.name}</b>
          </div>
          <div className="py-2">
            Symbol: <b>{data.symbol}</b>
          </div>
          <div className="py-2">
            Decimals: <b>{data.decimals}</b>
          </div>
          <div className="py-2">
            Total Supply: <b>{data.totalSupply ?? 0}</b>
          </div>
          <div className="py-2">
            Freeze Authority: <b>{data.freeze}</b>
          </div>
          <div className="py-2">
            Mint Authority: <b>{data.mintable}</b>
          </div>
        </>
      )}
    </div>
  )
}

export default TokenCard
