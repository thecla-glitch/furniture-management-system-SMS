import { OrdersProvider } from "@/components/front-desk/orders-store"
import { DirectorPortal } from "@/components/director/director-portal"

export default function DirectorPage() {
  return (
    <OrdersProvider>
      <DirectorPortal />
    </OrdersProvider>
  )
}
