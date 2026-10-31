import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { Mail02Icon } from '@/components/icon/Mail02Icon'
import { TableCore } from '@/components/TableCore'
import { VendorAnnonateType, VendorEnum } from '@/types/vendor'
import { getVendorLists } from '@/utils/apiRequestHelper'
import { slugify, vendorBadgeColor } from '@/utils/globalHelper'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { VendorDto } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const columnHelper = createColumnHelper<VendorDto>()

export const EventTable = () => {
  const {
    data: vendorData,
    error: vendorError,
    trigger: vendorTrigger,
  } = useSWRMutation(`desc/${VendorEnum.EVENT}/99999/1`, getVendorLists)

  const columnsVendorTable = useMemo<ColumnDef<VendorDto, any>[]>(
    () => [
      columnHelper.accessor((row) => row.vendor_information['name'], {
        id: 'name',
        header: 'Name',
        size: 210,
      }),
      columnHelper.accessor(
        (row) => row.vendor_categories.map((category) => category.vendor_category_info.name).join(', '),
        {
          id: 'categories',
          header: 'Categories',
          size: 280,
          cell: (info) => (
            <div className="inline-flex gap-1">
              {info
                .getValue()
                .split(',')
                .slice(0, 3)
                .map((item: any, index: number) => (
                  <Badge
                    key={index}
                    size="sm"
                    color={vendorBadgeColor(slugify(item) as unknown as VendorAnnonateType)}
                    icon="none"
                  >
                    {item}
                  </Badge>
                ))}
              {info.getValue().split(',').length > 3 && (
                <Badge size="sm" color="blue-gray" icon="none">
                  +{Number(info.getValue().split(',').length - 3)}
                </Badge>
              )}
            </div>
          ),
        },
      ),
      columnHelper.accessor((row) => row.vendor_information['description'], {
        id: 'description',
        header: 'Description / Scope of Work',
        size: 210,
        cell: (info) => <div className="line-clamp-2 w-52">{info.getValue()}</div>,
      }),
      columnHelper.accessor((row) => row.vendor_information['location'], {
        id: 'location',
        header: 'Location',
        size: 130,
      }),
      columnHelper.accessor((row) => row.vendor_information['pic'], {
        id: 'pic',
        header: 'PIC',
        size: 130,
      }),
      columnHelper.accessor((row) => row.vendor_information['phone_number'], {
        id: 'phone_number',
        header: 'Phone',
        size: 160,
        cell: (info) => <>{info.getValue()?.replace('_', ' ')}</>,
      }),
      columnHelper.accessor((row) => row.vendor_information['email'], {
        id: 'email',
        header: 'Email',
        size: 162,
        cell: (info) => (
          <>
            {info.getValue() ? (
              <Link href={`mailto:${info.getValue()}`} className="flex whitespace-nowrap">
                <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="rectangle">
                  Send Email
                  <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : (
              <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="rectangle" disabled>
                Send Email
                <Mail02Icon className="h-5 w-5 stroke-gray-700" />
              </Button>
            )}
          </>
        ),
      }),
      columnHelper.accessor('id', {
        id: 'viewVendorDetail',
        size: 72,
        header: '',
        enableSorting: false,
        cell: (info) => (
          <Link href={`/dashboard/external/vendor-adm/${info.getValue()}`}>
            <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="square">
              <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
            </Button>
          </Link>
        ),
      }),
    ],
    [],
  )

  useEffect(() => {
    vendorTrigger()
  }, [])

  if (vendorError) {
    return <pre>Error: {JSON.stringify(vendorError, null, 2)}</pre>
  }

  return (
    <TableCore
      supportTableType="normal"
      data={vendorData}
      columns={columnsVendorTable}
      useSearchBar={true}
      buttons={[
        {
          id: 'categories',
          column: 'vendor_categories[].vendor_category_info.name',
          label: 'Categories',
          isArray: true,
        },
      ]}
    />
  )
}
