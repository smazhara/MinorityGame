import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

import Contract from './components/Contract'

class App extends Component {
  state = {
    storageValue: 0,
    web3: null
  }

  componentWillMount() {
    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })
      this.web3 = results.web3

      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  async instantiateContract() {
    this.contract = await new Contract().instance()

    this.web3.eth.getCoinbase((err, account) => {
      this.setState({
        account: account
      })
    })

    this.setState({
      state: await this.gameState(),
      playing: await this.isPlaying(),
      playerCount: await this.playerCount()
    })
  }

  async playerCount() {
    return (await this.contract.commitmentCount()).toNumber()
  }

  async isPlaying() {
    return (await this.contract.commitments(this.state.account))[0] !== ''
  }

  async gameState() {
    const stateLabels = ['Commit', 'Reveal', 'Tally']

    const state = await this.contract.state()

    return stateLabels[state.toNumber()]
  }

  onBlue = () => {
    this.commit('red')
  }

  onRed = () => {
    this.commit('red')
  }

  onWithdraw = () => {
    try {
      this.contract.withdraw()
      this.setState({playing: false})
    } catch (error) {
      this.setState({error: error})
    }
  }

  async commit(choice) {
    try {
      await this.contract.commit(
        this.state.account,
        choice,
        { from: this.state.account, value: this.web3.toWei(1, 'finney') }
      )

      this.setState({
        playing: true,
        playerCount: await this.playerCount()
      })
    } catch (error) {
      if (error.message.match(/User denied transaction signature/)) {
        console.log('Denied')
        return
      }

      console.error(error)
    }
  }

  Controls = () => {
    if (this.state.playing) {
      return (
        <p>
          You are in
          <button
            onClick={this.onWithdraw}
          >
            Withdraw
          </button>
        </p>
      )
    } else {
      return (
        <p>
          Make your move
          <button
            onClick={this.onBlue}
          >
            Blue
          </button>

          <button
            onClick={this.onRed}
          >
            Red
          </button>
        </p>
      )
    }
  }

  render() {
    const { Controls } = this;
    console.log(this.state)

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">
              Minority Game
            </a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Good to Go!</h1>

              <p>Game state <u>{this.state.state}</u></p>

              <p>Account: <u>{this.state.account}</u></p>

              <Controls/>

              <p>Players <u>{this.state.playerCount}</u></p>

              <p>{this.state.error}</p>

            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
