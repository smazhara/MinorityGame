const MinorityGame = artifacts.require('./MinorityGame.sol');

contract('MinorityGame', async accounts => {
  const owner = accounts[0]

  let nonce = 'nonce'

  const alice = {
    account: accounts[0],
    nonce: 'nonce',
    choice: 'blue'
  }
  alice.hash = web3.sha3(alice.choice + alice.nonce)

  const bob = {
    account: accounts[1],
    nonce: 'nonce',
    choice: 'red'
  }
  bob.hash = web3.sha3(bob.choice + bob.nonce)

  const carol = {
    account: accounts[2],
    nonce: 'b25c13b',
    choice: 'red'
  }
  carol.hash = web3.sha3(carol.choice + carol.nonce)

  const validBid = 1000000000000000;

  const invalidBid = 1;

  const [commit, reveal, cashout, pause] = [1, 2, 4, 8]

  const labels = {
    1: 'commit',
    2: 'reveal',
    4: 'cashout',
    8: 'pause'
  }

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

    async function makeCommit(player) {
      await contract.commit(
        player.hash,
        { from: player.account, value: validBid }
      )
    }

    async function makeReveal(player) {
      await contract.reveal(player.choice, player.nonce, { from: player.account })
    }

  async function assertNoCommitment(player) {
    const [ contractHash, contractChoice ] =
      await contract.commitments(player.account)

    assert.equal(contractHash, 0)
    assert.equal(contractChoice, '')
  }

  async function contractBalance() {
    return (await contract.getBalance()).toNumber()
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
    async function subject(bid) {
      await contract.commit(
        alice.hash,
        { from: alice.account, value: bid }
      )
    }

    context('when in commit state', () => {
      beforeEach(() => setState(commit))

      context('when invalid bid amount', async () => {
        it('fails', async () => {
          try {
            await subject(invalidBid)
          } catch (error) {
            assert.equal(error, revertError)
            assertNoCommitment(alice)
            return
          }

          assert(false, 'Failed')
        })
      })

      context('when valid bid amount', () => {
        beforeEach(async () => await subject(validBid))

        it('works', async () => {
          assertCommitment(alice)
          assert.equal(await contractBalance(), validBid)
        })
      })

      context('when duplicate commit', () => {
        beforeEach(async () => await subject(validBid))

        it('fails when payment sent', async () => {
          try {
            await subject(validBid)
          } catch (error) {
            assert.equal(error, revertError)
            assert.equal(await contractBalance(), validBid)
            return
          }

          assert(false, 'Failed')
        })

        it('works when payment not sent', async () => {
          await subject(0)
          assert.equal(await contractBalance(), validBid)
        })
      })
    })

    Array.of(reveal, cashout, pause).map(state => {
      context(`when in ${labels[state]} state`, () => {
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

    Array.of(commit, cashout, pause).map(state => {
      context(`when in ${labels[state]} state`, () => {
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

    Array.of(reveal, cashout, pause).map(state => {
      context(`when in ${labels[state]} state`, () => {
        beforeEach(() => setState(state))

        it('fails', fails)
      })
    })

    context('when in commit state', () => {
      beforeEach(() => setState(commit))

      context('when commitment', () => {
        beforeEach(() => makeCommit(alice))

        it('works', async () => {
          await subject()

          assertNoCommitment(alice)
        })
      })

      context('when no commitment', () => {
        it('fails', async () => {
          try {
            await subject()
          } catch (error) {
            assert.equal(error, revertError)
          }
        })
      })
    })
  })

  describe('winningChoice', () => {
    async function subject() {
      return await contract.winningChoice()
    }

    context('when commit', () => {
      beforeEach(() => setState(commit))

      it('fails', async () => {
        try {
          await subject()
        } catch (error) {
          assert.equal(error, revertError)
          return
        }

        assert(false, 'Failed')
      })
    })

    Array.of(reveal, cashout, pause).map(state => {
      context(`when ${labels[state]}`, () => {
        beforeEach(() => setState(state))

        context('when nothing revealed yet', () => {
          it('returns draw', async () => {
            assert.equal(await subject(), 'draw')
          })
        })

        context('when 1 color only revealed', () => {
          beforeEach(async () => {
            await setState(commit)
            await makeCommit(alice)

            await setState(reveal)
            await makeReveal(alice)
          })

          it('returns draw - \
            because there nobody to collect a prize', async () =>
          {
            assert.equal(await subject(), 'draw')
          })

        })

        context('when 1 red and 1 blue revealed', () => {
          beforeEach(async () => {
            await setState(commit)
            await makeCommit(alice)
            await makeCommit(bob)

            await setState(reveal)
            await makeReveal(alice)
            await makeReveal(bob)
          })

          it('returns draw', async () => {
            assert.equal(await subject(), 'draw')
          })
        })

        context('when 2 red and 1 blue revealed', () => {
          beforeEach(async () => {
            await setState(commit)
            await makeCommit(alice)
            await makeCommit(bob)
            await makeCommit(carol)

            await setState(reveal)
            await makeReveal(alice)
            await makeReveal(bob)
            await makeReveal(carol)
          })

          it('returns blue', async () => {
            assert.equal(await subject(), 'blue')
          })
        })
      })
    })
  })
})
