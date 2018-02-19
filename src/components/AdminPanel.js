import React from 'react'

export default class extends React.Component {
  onSetState = (state) => {
    this.props.app.contract.setState(state,
      { from: this.props.account, gas: 30000 })
  }

  get states() {
    return {
      1: 'Commit',
      2: 'Reveal',
      4: 'Tally',
      8: 'Pause'
    }
  }

  render() {
    if (!this.props.app.state.isOwner)
      return null

    return (
      <fieldset>
        <legend>Admin Panel</legend>
        {Object.keys(this.states).map((state) => {
          return (
            <button onClick={() => this.onSetState(state)} key={state}>
              {this.states[state]}
            </button>
          )
        })}

        <p>Balance {this.props.app.web3.fromWei(this.props.app.state.balance, 'ether')}</p>

      </fieldset>
    )
  }
}
