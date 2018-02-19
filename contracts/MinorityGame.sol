pragma solidity ^0.4.19;

contract MinorityGame {
    address public owner;

    enum GameState { Commit, Reveal, Tally, Pause }

    uint256 constant bid = 1000000000000000;

    GameState public state = GameState.Commit;

    struct Commitment {
        bytes32 hash;
        string choice;
    }

    mapping (address => Commitment) public commitments;

    uint8 public commitmentCount;

    uint8 public blueCount;

    uint8 public redCount;

    function MinorityGame() public {
        owner = msg.sender;
    }

    function sender() public view returns (address) {
        return msg.sender;
    }

    modifier onlyCommit {
        require(state == GameState.Commit);
        _;
    }

    modifier onlyReveal {
        require(state == GameState.Reveal);
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier onlyRunning {
        require(state != GameState.Pause);
        _;
    }

    function getBalance() public view returns (uint256) {
        return this.balance;
    }

    function commit(bytes32 hash)
        public onlyCommit payable onlyRunning
    {
        require(msg.value == bid);

        if (! hasCommitment()) {
            commitmentCount++;
        }

        commitments[msg.sender] = Commitment(hash, '');
    }

    mapping (address => uint) pendingWithdrawals;

    function withdraw()
        public onlyCommit onlyRunning onlyExistingCommitment
    {
        pendingWithdrawals[msg.sender] += bid;
        commitmentCount--;
        delete commitments[msg.sender];
        msg.sender.transfer(bid);
    }

    // marked as 'view' to silence compiler warnings, but it's not 'view'
    // it can change commitment.choice
    function reveal(string choice, string nonce)
        public onlyReveal onlyExistingCommitment onlyRunning
    {
        bool redChoice = equal(choice, "red");
        bool blueChoice = equal(choice, "blue");
        require(redChoice || blueChoice);

        require(keccak256(choice, nonce) == commitments[msg.sender].hash);

        commitments[msg.sender].choice = choice;

        if (redChoice)
            redCount++;

        if (blueChoice)
            blueCount++;
    }

    // onlyOwner functions
    function setState(GameState newState) public onlyOwner {
        state = newState;
    }

    function equal(string a, string b) private pure returns (bool) {
        return keccak256(a) == keccak256(b);
    }

    function empty(string a) private pure returns (bool) {
        return equal(a, "");
    }

    function newCommitment(Commitment commitment)
        private pure returns (bool)
    {
        return commitment.hash == 0;
    }

    modifier onlyExistingCommitment()
    {
        require(hasCommitment());
        _;
    }

    function hasCommitment() private view returns (bool) {
        return commitments[msg.sender].hash > 0;
    }
}
