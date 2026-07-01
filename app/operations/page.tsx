import { TechniciansProvider } from "@/components/operations/technicians-store"
import { MaterialRequestsProvider } from "@/components/operations/material-requests-store"
import { OperationsPortal } from "@/components/operations/operations-portal"

export default function OperationsPage() {
  // OrdersProvider is mounted globally in the AppShell so orders stay in sync
  // across the Front Desk, Operations and technician views.
  return (
    <TechniciansProvider>
      <MaterialRequestsProvider>
        <OperationsPortal />
      </MaterialRequestsProvider>
    </TechniciansProvider>
  )
}
