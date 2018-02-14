const MinorityGame = artifacts.require('./MinorityGame.sol');

contract('MinorityGame', async accounts => {
  const owner = accounts[0]

  const [red, blue] = [1, 2]

  const alice = {
    account: accounts[0],
    salt: 'c9188b4',
    hash: web3.sha3(`c9188b4${red}`),
    choice: red
  }

  const bob = {
    account: accounts[1],
    salt: '2d989bb',
    hash: web3.sha3(`2d989bb${red}`),
    choice: red
  }

  const carol = {
    account: accounts[2],
    salt: 'b25c13b',
    hash: web3.sha3(`b25c13b${blue}`),
    choice: blue
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

    xit('initializes', async () => {
      assert.equal(await contract.state(), commit)

      assert.equal(await contract.commitmentCount(), 0)
    })
  })

  describe('commit', async () => {
    context('when in commit state', async () => {
      xit('fails if invalid bid amount', async () => {
        const contract = await MinorityGame.deployed()

        try {
          await contract.commit(
            alice.hash,
            alice.salt,
            { from: alice.account, value: invalidBid }
          )
        } catch (error) {
          assert.equal(error, revertError)
        }

        assert.equal(await commitmentCount(), 0)
      })

      it('fails if empty hash', async () => {
        const contract = await MinorityGame.deployed()

        try {
          a = await contract.commit1(
            0,
            alice.salt
          )
            console.log(`>>> ${a} <<<`)
        } catch (error) {
          assert.equal(error, revertError)
          assert.equal(await commitmentCount(), 0)
          return
        }

        assert(false, 'Failed')
      })

      xit('fails if empty salt', async () => {
        const contract = await MinorityGame.deployed()

        try {
          await contract.commit(
            alice.hash,
            '',
            { from: alice.account, value: validBid }
          )
        } catch (error) {
          assert.equal(error, revertError)
        }

        assert.equal(await commitmentCount(), 0)
      })

      xit('works if valid bid', async () => {
        const contract = await MinorityGame.deployed()

        await contract.commit(
          alice.hash,
          alice.salt,
          { from: alice.account, value: validBid }
        )

        assert.equal(await contract.commitmentCount(), 1)
      })

      xit('fails to reveal bid in commit state', async () => {
        assert.equal(await contract.state(), commit)

        try {
          await contract.reveal(blue, { from: alice.account })
        } catch (error) {
          assert.equal(error, revertError)
        }
      })
    })

    xcontext('when in reveal state', async () => {
      beforeEach(async () => {
        contract.setState(reveal, { from: owner })
      })

      xit('reveals valid value', async () => {
        assert.equal(alice.choice, red)

        assert(
          (await contract.reveal(red, { from: alice.account }))
        )
      })

      xit('fails to reveal invalid value', async () => {
        assert.equal(alice.choice, red)

        let a = await contract.reveal(red, { from: alice.account })

        console.log(a.toNumber())

      })

    })
  })
})
