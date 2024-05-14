import {
  buildSimpleTransaction,
  findProgramAddress,
  InnerSimpleV0Transaction,
  SPL_ACCOUNT_LAYOUT,
  TOKEN_PROGRAM_ID,
  TokenAccount,
  TxVersion,
} from "@raydium-io/raydium-sdk"
import { SendTransactionOptions } from "@solana/wallet-adapter-base"
import {
  Connection,
  Keypair,
  PublicKey,
  SendOptions,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js"

export async function sendTx(
  connection: Connection,
  payer: Keypair | Signer,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendOptions
): Promise<string[]> {
  const txids: string[] = []
  for (const iTx of txs) {
    if (iTx instanceof VersionedTransaction) {
      iTx.sign([payer])
      txids.push(
        await connection.sendTransaction(iTx, options).then((res) => {
          console.log(res)
          return res
        })
      )
    } else {
      txids.push(await connection.sendTransaction(iTx, [payer], options))
    }
  }
  return txids
}

export async function sendWalletTx(
  connection: Connection,
  sendTransaction: any,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendTransactionOptions
): Promise<string[]> {
  const txids: string[] = []
  for (const iTx of txs) {
    txids.push(
      await sendTransaction(iTx, connection, options).then((res: any) => {
        console.log(res)
        return res
      })
    )
  }
  return txids
}

export async function getWalletTokenAccount(
  connection: Connection,
  wallet: PublicKey
): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  })
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }))
}

export async function buildAndSendTx(
  connection: Connection,
  wallet: Keypair,
  innerSimpleV0Transaction: InnerSimpleV0Transaction[],
  options?: SendOptions
) {
  const willSendTx = await buildSimpleTransaction({
    connection,
    makeTxVersion: TxVersion.V0,
    payer: wallet.publicKey,
    innerTransactions: innerSimpleV0Transaction,
  })

  return await sendTx(connection, wallet, willSendTx, options)
}

export function getATAAddress(
  programId: PublicKey,
  owner: PublicKey,
  mint: PublicKey
) {
  const { publicKey, nonce } = findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  )
  return { publicKey, nonce }
}

export async function sleepTime(ms: number) {
  console.log(new Date().toLocaleString(), "sleepTime", ms)
  return new Promise((resolve) => setTimeout(resolve, ms))
}
