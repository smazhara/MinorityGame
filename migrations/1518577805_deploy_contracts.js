const MinorityGame = artifacts.require('./MinorityGame')

module.exports = deployer => {
  deployer.deploy(MinorityGame)
};
