import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

import Contract from './components/Contract'
import AdminPanel from './components/AdminPanel'

export default class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    address: null
  }

  accounts = {
    '0x00d1ae0a6fc13b9ecdefa118b94cf95ac16d4ab0': 'alice',
    '0x1daa654cfbc28f375e0f08f329de219fff50c765': 'bob',
    '0xc2dbc0a6b68d6148d80273ce4d6667477dbf2aa7': 'carol'
  }

  constructor() {
    super()

    this.onWithdraw = this.onWithdraw.bind(this)
    this.updateState = this.updateState.bind(this)
  }

  componentWillMount() {
    getWeb3
    .then(async results => {
      this.setState({
        web3: results.web3
      })
      this.web3 = results.web3

      await this.instantiateContract()

      this.updateState()
      setInterval(this.updateState, 1000)
    })
    .catch((error) => {
      console.log(`Error finding web3: ${error}`)
    })
  }

  async instantiateContract() {
    this.contract = await new Contract().instance()
  }

  async updateState() {
    this.web3.eth.getCoinbase((err, account) => {
      this.setState({
        account: account,
        accountName: `${this.accounts[account]} (${account})`
      })
    })

    this.setState({
      state: await this.gameState(),
      playing: await this.isPlaying(),
      playerCount: await this.playerCount(),
      redCount: await this.redCount(),
      blueCount: await this.blueCount(),
      isOwner: await this.isOwner(),
      commitment: await this.contract.commitments(this.state.account),
      balance: (await this.contract.getBalance()).toNumber()
    })
  }

  async isOwner() {
    const owner = await this.contract.owner()
    return owner === this.state.account
  }

  async playerCount() {
    return (await this.contract.commitmentCount()).toNumber()
  }

  async redCount() {
    return (await this.contract.redCount()).toNumber()
  }

  async blueCount() {
    return (await this.contract.blueCount()).toNumber()
  }

  async isPlaying() {
    return (await this.contract.commitments(this.state.account))[0] > 0
  }

  async gameState() {
    const stateLabels = ['Commit', 'Reveal', 'Tally', 'Paused']

    const state = await this.contract.state()

    return stateLabels[state.toNumber()]
  }

  onBlue = () => {
    this.commit('blue')
  }

  onRed = () => {
    this.commit('red')
  }

  async withdraw() {
      await this.contract.withdraw({ from: this.state.account, gas: 90000 })
  }

  async onWithdraw() {
    try {
      await this.withdraw()

      this.updateState()

      console.log('asdf')
    } catch (error) {
      this.setState({error: error})
    }
  }

  async commit(choice) {
    const nonce = this.state.account

    try {
      await this.contract.commit(
        this.web3.sha3(`${choice}${nonce}`),
        { from: this.state.account, value: this.web3.toWei(1, 'finney') }
      )

      this.setState({
        playing: true,
        playerCount: await this.playerCount()
      })

      localStorage.setItem(`choice-${this.state.account}`, choice)
      console.log('here')
    } catch (error) {
      if (error.message.match(/User denied transaction signature/)) {
        console.log('Denied')
        return
      }

      console.error(error)
    }
  }

  async reveal() {
    await this.contract.reveal(
      localStorage.getItem(`choice-${this.state.account}`),
      this.state.account,
      { from: this.state.account }
    )
  }

  onReveal = () => {
    try {
      this.reveal()
    } catch (error) {
      console.log(error)
    }
  }

  PlayerControls = () => {
    if (this.state.state === 'Commit') {
      return (
        <p>
          You are in
          <button onClick={this.onWithdraw}>Withdraw</button>
        </p>
      )
    }

    if (this.state.state === 'Reveal') {
      let move = this.state.commitment[1]

      if (move === '') {
        return (
          <p>
            <button onClick={this.onReveal}>Reveal your hand</button>
          </p>
        )
      } else {
        return (
          <p>
            You bet on {move}.
          </p>
        )
      }
    }

    return <b>nothing</b>
  }

  Controls = () => {
    if (this.state.playing) {
      return <this.PlayerControls/>
    }


    if (this.state.state === 'Commit') {
      return (
        <p>
          Make your move
          <button onClick={this.onBlue}>Blue</button>

          <button onClick={this.onRed}>Red</button>
        </p>
      )
    } else {
      return <p>Wait for the next turn</p>
    }
  }

  render() {
    const { Controls } = this

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

              <p>Account: <u>{this.state.accountName}</u></p>

              <Controls/>

              <p>Players <u>{this.state.playerCount}</u></p>

              <p>Reds <u>{this.state.redCount}</u></p>

              <p>Blues <u>{this.state.blueCount}</u></p>

              <p>{this.state.error}</p>

              <AdminPanel app={this} contract={this.contract} account={this.state.account}/>

            </div>
          </div>
        </main>
      </div>
    );
  }
}
