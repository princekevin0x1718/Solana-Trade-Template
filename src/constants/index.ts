import { Currency, TOKEN_PROGRAM_ID, Token } from "@raydium-io/raydium-sdk"
import { PublicKey } from "@solana/web3.js"

export const WSOL = new Token(
  TOKEN_PROGRAM_ID,
  new PublicKey("So11111111111111111111111111111111111111112"),
  9,
  "WSOL",
  "Wrapped SOL"
)

export const SOL = new Currency(9, "SOL", "Solana")
