import React from 'react'

export default class extends React.Component {
  onSetState = (state) => {
    this.props.app.contract.setState(state,
      { from: this.props.account, gas: 30000 })
  }

  get states() {
    return ['Commit', 'Reveal', 'Tally', 'Paused']
  }

  render() {
    if (!this.props.app.state.isOwner)
      return null

    return (
      <fieldset>
        <legend>Admin Panel</legend>
        {this.states.map((name, state) => {
          return (
            <button onClick={() => this.onSetState(state)} key={state}>
              {name}
            </button>
          )
        })}

        <p>Balance {this.props.app.web3.fromWei(this.props.app.state.balance, 'ether')}</p>

      </fieldset>
    )
  }
}
