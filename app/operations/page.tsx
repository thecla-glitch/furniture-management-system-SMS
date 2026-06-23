import { OrdersProvider } from "@/components/front-desk/orders-store"
import { TechniciansProvider } from "@/components/operations/technicians-store"
import { MaterialRequestsProvider } from "@/components/operations/material-requests-store"
import { OperationsPortal } from "@/components/operations/operations-portal"

export default function OperationsPage() {
  return (
    <OrdersProvider>
      <TechniciansProvider>
        <MaterialRequestsProvider>
          <OperationsPortal />
        </MaterialRequestsProvider>
      </TechniciansProvider>
    </OrdersProvider>
  )
}
