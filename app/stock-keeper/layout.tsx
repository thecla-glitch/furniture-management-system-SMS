import { StockProvider } from "@/components/stock-keeper/stock-store"

export default function StockKeeperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <StockProvider>{children}</StockProvider>
}
