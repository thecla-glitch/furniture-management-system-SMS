import { OrdersProvider } from "@/components/front-desk/orders-store"
import { TechniciansProvider } from "@/components/operations/technicians-store"
import { OperationsPortal } from "@/components/operations/operations-portal"

export default function OperationsPage() {
  return (
    <OrdersProvider>
      <TechniciansProvider>
        <OperationsPortal />
      </TechniciansProvider>
    </OrdersProvider>
  )
}
