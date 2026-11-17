import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.requisition_form.update({
    where: {
      id: '71d0c343-e818-4836-9e1f-0716461deb88',
    },
    data: {
      rf_budgets: JSON.stringify([
        {
          id: '29b215b6-8741-4807-9b4f-700c836c28b8',
          ordering_seq: 1,
          code: 'A.01.01',
          description: 'ATK',
          vendor_category_id: '44f3f1a9-cd4a-4d44-a19c-5f13876880d4',
          qty: 1,
          unit: '1',
          pkg_qty: 1,
          pkg_unit: '1',
          unit_cost_value: 7000000,
          recommended_vendor: '67083531-9d55-421c-a2c1-e1c7c808a19c',
          unit_cost: 'IDR_7000000',
          additional_data: { remaining_rf: 3000000 },
          return: 2000000,
        },
      ]), // your data here
    },
  })

  console.log('Updated:', result)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
