import { OrdersProvider } from "@/components/front-desk/orders-store"
import { OrdersDashboard } from "@/components/front-desk/orders-dashboard"

export default function FrontDeskPage() {
  return (
    <OrdersProvider>
      <OrdersDashboard />
    </OrdersProvider>
  )
}
