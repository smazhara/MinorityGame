const MinorityGame = artifacts.require('./MinorityGame.sol');

contract('MinorityGame', async accounts => {
  const owner = accounts[0]

  let nonce = 'nonce'

  const alice = {
    account: accounts[0],
    nonce: 'nonce',
    choice: 'red'
  }

  alice.hash = web3.sha3(alice.choice + alice.nonce)

  const bob = {
    account: accounts[1],
    nonce: 'nonce',
    hash: web3.sha3('noncered'),
    choice: 'red'
  }

  const carol = {
    account: accounts[2],
    nonce: 'b25c13b',
    hash: web3.sha3('noncered'),
    choice: 'blue'
  }

  const validBid = 1000000000000000;

  const invalidBid = 1;

  const [commit, reveal, tally, pause] = [0, 1, 2, 3]

  const revertError = 'Error: VM Exception while processing transaction: revert'

  async function commitmentCount() {
    return (await contract.commitmentCount()).toNumber()
  }

  function setState(state) {
    (async () => await contract.setState(state))()
  }

  async function assertCommitment(player) {
    const [ contractHash, contractChoice ] =
      await contract.commitments(player.account)

    assert.equal(contractHash, player.hash)
    assert.equal(contractChoice, '')
  }

  async function assertRevealedCommitment(player) {
    const [ contractHash, contractChoice ] =
      await contract.commitments(player.account)

    assert.equal(contractHash, player.hash)
    assert.equal(contractChoice, player.choice)
  }

  async function sendCommit(player) {
    await contract.commit(
      player.hash,
      { from: player.account, value: validBid }
    )
  }

  async function assertNoCommitment(player) {
    const [ contractHash, contractChoice ] =
      await contract.commitments(player.account)

    assert.equal(contractHash, 0)
    assert.equal(contractChoice, '')
  }

  beforeEach(async () => {
    contract = await MinorityGame.new()
  })

  describe('constructor', () => {
    it('initializes', async () => {
      assert.equal(await contract.state(), commit)

      assert.equal(await contract.commitmentCount(), 0)
    })
  })

  describe('commit', async () => {
    async function subject() {
      await contract.commit(
        alice.hash,
        { from: alice.account, value: bid }
      )
    }

    context('when in commit state', () => {
      beforeEach(() => setState(commit))

      it('fails if invalid bid amount', async () => {
        bid = invalidBid

        try {
          await subject()
        } catch (error) {
          assert.equal(error, revertError)
          assertNoCommitment(alice)
          return
        }

        assert(false, 'Failed')
      })

      it('works if valid bid amount', async () => {
        bid = validBid

        await subject()

        assertCommitment(alice)
      })
    })

    Array.of(reveal, tally, pause).map(state => {
      context(`when in ${state} state`, () => {
        beforeEach(() => setState(state))

        it('just fails', async () => {
          try {
            await subject()
          } catch (error) {
            assert.equal(error, revertError)
            assertNoCommitment(alice)
            return
          }

          assert(false, 'Failed')
        })
      })
    })
  })

  describe('reveal', async () => {
    async function subject() {
      await contract.reveal(choice, nonce)
    }

    async function fails() {
      try {
        await subject()
      } catch (error) {
        assert.equal(error, revertError)
        assertNoCommitment(alice)
      }
    }

    let choice = alice.choice

    let nonce = alice.nonce

    context('when reveal state', () => {
      beforeEach(() => setState(reveal) )

      context('when no commitment', () => {
        it('fails', fails)
      })

      context('when commitment', () => {
        beforeEach(() => {
          setState(commit)
          contract.commit(alice.hash,
            { from: alice.account,value: validBid })
          setState(reveal)
        })

        context('when invalid choice', () => {
          let choice = alice.choice == 'red' ? 'blue' : 'red'

          it('fails', fails)
        })

        context('when invalid nonce', () => {
          let nonce = 'bam'

          it('fails', fails)
        })

        context('when all is good', () => {
          it('works', async () => {
            await subject()

            assert.equal(
              (await contract.commitments(alice.account))[1], alice.choice
            )
          })
        })
      })
    })

    Array.of(commit, tally, pause).map(state => {
      context(`when in ${state} state`, () => {
        beforeEach(() => setState(state))

        it('fails', fails)
      })
    })
  })

  describe('withdraw', async () => {
    async function subject() {
      await contract.withdraw()
    }

    async function fails() {
      try {
        await subject()
      } catch (error) {
        assert.equal(error, revertError)
      }
    }

    Array.of(reveal, tally, pause).map(state => {
      context(`when in ${state} state`, () => {
        beforeEach(() => setState(state))

        it('fails', fails)
      })
    })

    context('when in commit state', () => {
      beforeEach(() => {
        setState(commit)
        sendCommit(alice)
      })

      it('works', async () => {
        await subject()

        assertNoCommitment(alice)
      })
    })
  })
})
