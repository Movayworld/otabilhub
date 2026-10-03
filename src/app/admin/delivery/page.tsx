import { getAllDeliveryLocations } from '@/lib/queries/delivery'
import { DeliveryPageContent } from './_components/delivery-page-content'
import { AdminLayout } from '@/app/admin/components/admin-layout'
import { Section } from '@/components/ui/section'
import { Container } from '@/components/layout/container'

export default async function AdminDeliveryPage() {
  const locations = await getAllDeliveryLocations()

  return (
    <AdminLayout currentPath="/admin/delivery">
      <Section className="py-8 sm:py-12 lg:py-16">
        <Container>
          <DeliveryPageContent initialLocations={locations} />
        </Container>
      </Section>
    </AdminLayout>
  )
}
