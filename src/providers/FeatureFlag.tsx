import React from 'react'

/**
 * checking feature flag
 */
class FeatureFlag extends React.Component<{ children; flag: string; replaceWith?: JSX.Element }, { allow: boolean }> {
  state = {
    allow: true,
  }

  render() {
    return this.state.allow ? this.props.children : this.props.replaceWith
  }

  componentDidMount = async (): Promise<unknown> => {
    try {
      const res = await fetch(`https://config.sim.puskapa.org/read?key=${this.props.flag}`)
      this.setState({ allow: Boolean(res.text()) })
    } catch (e) {
      this.setState({ allow: false })
    }
    return
  }
}

export default FeatureFlag
