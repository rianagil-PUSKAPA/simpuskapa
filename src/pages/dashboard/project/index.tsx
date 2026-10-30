import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { ProgramCreateRequestProgramOwnershipTypeEnum } from 'sdk/api'

const ProgramList: any = dynamic(() => import('@/layout/program/ProgramList').then((mod) => mod.ProgramList))

const ProgramListIndex = () => {
  return <ProgramList program_ownership_type={ProgramCreateRequestProgramOwnershipTypeEnum.Program} />
}

export default ProgramListIndex

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const authTokenJWT = safeDecodeJwt(auth_token)

  if (!authTokenJWT) {
    return { redirect: { destination: '/refresh', permanent: false } }
  }
  return {
    props: {
      jwtInformation: authTokenJWT,
      activeSidebar: 'Project List',
    },
  }
}
