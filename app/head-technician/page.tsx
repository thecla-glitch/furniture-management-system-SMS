import { OrdersProvider } from "@/components/front-desk/orders-store"
import { TechniciansProvider } from "@/components/operations/technicians-store"
import { MaterialRequestsProvider } from "@/components/operations/material-requests-store"
import { HeadTechnicianPortal } from "@/components/head-technician/head-technician-portal"

export default function HeadTechnicianPage() {
  return (
    <OrdersProvider>
      <TechniciansProvider>
        <MaterialRequestsProvider>
          <HeadTechnicianPortal />
        </MaterialRequestsProvider>
      </TechniciansProvider>
    </OrdersProvider>
  )
}
