import SchedulePrescription from 'src/components/hospital/outpatient/SchedulePrescription'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <SchedulePrescription params={resolvedParams} />
}
