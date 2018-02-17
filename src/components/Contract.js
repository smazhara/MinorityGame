import MinorityGame from '../../build/contracts/MinorityGame.json'
import getWeb3 from '../utils/getWeb3'

export default class {
  async instance() {
    await this.initWeb3()

    const truffleContract = require('truffle-contract')
    const minorityGame = truffleContract(MinorityGame)
    minorityGame.setProvider(this.web3.currentProvider)

    return await minorityGame.deployed()
  }

  async initWeb3() {
    getWeb3
    .then(results => {
      this.web3 = results.web3
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }
}
