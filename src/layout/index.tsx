import { Toaster } from "react-hot-toast"
import Header from "./header"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <div className="flex justify-center">
        <div className="container">{children}</div>
      </div>
      <Toaster position="top-right" />
    </>
  )
}

export default Layout
