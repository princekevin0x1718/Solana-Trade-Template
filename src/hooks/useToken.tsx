import { Token } from "@raydium-io/raydium-sdk"
import React, { useState, Dispatch, SetStateAction } from "react"

const defaultVal: {
  token?: Token
  setToken: any
} = {
  setToken: () => {},
}

export const TokenContext = React.createContext(defaultVal)

export default function useToken() {
  return React.useContext(TokenContext)
}

export const TokenProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [token, setToken] = useState<Token>()

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  )
}
