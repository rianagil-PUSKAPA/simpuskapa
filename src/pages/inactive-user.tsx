import dynamic from 'next/dynamic'

const InformationalPage: any = dynamic(() =>
  import('@/components/InformationalPage').then((mod) => mod.InformationalPage),
)

const InactiveUser = () => {
  return (
    <InformationalPage
      perTitle="Warning"
      title="You're in active user."
      description="Please contact admin of SIMPUSKAPA for more information."
    />
  )
}

export default InactiveUser
