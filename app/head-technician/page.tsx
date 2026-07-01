import { TechniciansProvider } from "@/components/operations/technicians-store"
import { MaterialRequestsProvider } from "@/components/operations/material-requests-store"
import { HeadTechnicianPortal } from "@/components/head-technician/head-technician-portal"

export default function HeadTechnicianPage() {
  return (
    <TechniciansProvider>
      <MaterialRequestsProvider>
        <HeadTechnicianPortal />
      </MaterialRequestsProvider>
    </TechniciansProvider>
  )
}
