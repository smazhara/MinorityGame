const MinorityGame = artifacts.require('./MinorityGame.sol');

contract('MinorityGame', async accounts => {
  let contract

  const owner = accounts[0]

  let salt = 'salt'

  const alice = {
    account: accounts[0],
    salt: 'salt',
    hash: web3.sha3('saltred'),
    choice: 'red'
  }

  const bob = {
    account: accounts[1],
    salt: 'salt',
    hash: web3.sha3('saltred'),
    choice: 'red'
  }

  const carol = {
    account: accounts[2],
    salt: 'b25c13b',
    hash: web3.sha3('saltred'),
    choice: 'blue'
  }

  const validBid = 100;

  const invalidBid = 1;

  const [commit, reveal, tally] = [0, 1, 2]

  const revertError = 'Error: VM Exception while processing transaction: revert'

  async function commitmentCount() {
    return (await contract.commitmentCount()).toNumber()
  }

  describe('constructor', async () => {
    contract = await MinorityGame.deployed()

    it('initializes', async () => {
      assert.equal(await contract.state(), commit)

      assert.equal(await contract.commitmentCount(), 0)
    })
  })

  describe('commit', async () => {
    context('when in commit state', async () => {
      it('fails if invalid bid amount', async () => {
        const contract = await MinorityGame.deployed()

        try {
          await contract.commit(
            alice.hash,
            alice.salt,
            { from: alice.account, value: invalidBid }
          )
        } catch (error) {
          assert.equal(error, revertError)
          assert.equal(await commitmentCount(), 0)
          return
        }

        assert(false, 'Failed')
      })

      it('fails if empty hash @focus', async () => {
        const contract = await MinorityGame.deployed()

        try {
          await contract.commit(
            '',
            alice.salt
          )
        } catch (error) {
          assert.equal(error, revertError)
          assert.equal(await commitmentCount(), 0)
          return
        }

        assert(false, 'Failed')
      })

      it('fails if empty salt', async () => {
        const contract = await MinorityGame.deployed()

        try {
          await contract.commit(
            alice.hash,
            '',
            { from: alice.account, value: validBid }
          )
        } catch (error) {
          assert.equal(error, revertError)
          assert.equal(await commitmentCount(), 0)
          return
        }

        assert(false, 'Failed')
      })

      it('works if valid bid', async () => {
        const contract = await MinorityGame.deployed()

        await contract.commit(
          alice.hash,
          alice.salt,
          { from: alice.account, value: validBid }
        )

        assert.equal(await contract.commitmentCount(), 1)
      })

      it('fails to reveal bid in commit state', async () => {
        assert.equal(await contract.state(), commit)

        try {
          await contract.reveal('blue', { from: alice.account })
        } catch (error) {
          assert.equal(error, revertError)
          return
        }

        assert(false, 'Failed')
      })
    })

    context('when in reveal state', async () => {
      beforeEach(async () => {
        contract = await MinorityGame.deployed()
        contract.setState(commit, { from: owner })
      })

      it('reveals valid value', async () => {
        assert.equal(alice.choice, 'red')

        await contract.commit(
          alice.salt,
          alice.hash,
          { from: alice.account, value: validBid }
        )

        contract.setState(reveal, { from: owner })

        assert(
          (await contract.reveal('red', { from: alice.account }))
        )

        const aliceChoice = (await contract.commitments(alice.account))[2]

        assert.equal(aliceChoice, 'red')
      })

      it('fails to reveal invalid value', async () => {
        assert.equal(alice.choice, 'red')

        await contract.commit(
          alice.salt,
          alice.hash,
          { from: alice.account, value: validBid }
        )

        contract.setState(reveal, { from: owner })

        try {
          await contract.reveal('blue', { from: alice.account })
        } catch (error) {
          assert.equal(error, revertError)

          // alice choice hasn't changed
          const aliceChoice = (await contract.commitments(alice.account))[2]
          assert.equal(aliceChoice, '')

          return
        }

        assert(false, 'Failed')
      })
    })
  })
})
