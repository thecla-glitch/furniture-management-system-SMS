import { StockProvider } from "@/components/stock-keeper/stock-store"
import { StockKeeperPortal } from "@/components/stock-keeper/stock-keeper-portal"

export default function StockKeeperPage() {
  return (
    <StockProvider>
      <StockKeeperPortal />
    </StockProvider>
  )
}
