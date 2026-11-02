import { JwtLib } from '@/shared/jwt.lib'
import React from 'react'
import { getCookie } from 'typescript-cookie'

/**
 * Checking component level user access roles
 */
class AccessGateProvider extends React.Component<
  { children; roles: string[]; replaceWith?: JSX.Element },
  { allow: boolean }
> {
  state = {
    allow: false,
  }

  render() {
    return this.state.allow ? this.props.children : this.props.replaceWith
  }

  componentDidMount = async (): Promise<unknown> => {
    try {
      while (true) {
        if (typeof window !== 'undefined') {
          const authToken = getCookie('auth_token')

          if (!authToken) {
            // console.log('redirected', authToken)
            this.setState({ allow: false })
            return
          }

          JwtLib.decodeOnly(authToken)
            .then((claim) => {
              const userRoles: string[] = claim['role']

              if (this.props.roles.length == 0) {
                this.setState({ allow: true })
                return
              }

              const found = this.props.roles.some((r) => userRoles.includes(r))
              // console.log(found, this.props.roles, userRoles)

              if (found) {
                this.setState({ allow: true })
                return
              }

              this.setState({ allow: false })
              return
            })
            .catch((_err) => {
              this.setState({ allow: false })
              return
            })
          break
        } else {
          break
        }
      }

      this.setState({ allow: false })
      return
    } catch (err) {
      this.setState({ allow: false })
    }
  }
}

export default AccessGateProvider
