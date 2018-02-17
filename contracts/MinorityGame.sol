pragma solidity ^0.4.19;

contract MinorityGame {
    address owner;

    enum GameState { Commit, Reveal, Tally }

    uint256 constant bid = 100;

    GameState public state = GameState.Commit;

    struct Commitment {
        string salt;
        bytes32 hash;
        string choice;
    }

    mapping (address => Commitment) public commitments;

    uint8 public commitmentCount;

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

    function MinorityGame() public {
        owner = msg.sender;
    }

    function commit(string salt, bytes32 hash) public onlyCommit payable {
        require(!empty(salt) && hash > 0 && msg.value == bid);

        if (! hasCommitment()) {
            commitmentCount++;
        }

        commitments[msg.sender] = Commitment(salt, hash, '');
    }

    mapping (address => uint) pendingWithdrawals;

    function withdraw() public onlyCommit onlyExistingCommitment {
        pendingWithdrawals[msg.sender] += bid;
        delete commitments[msg.sender];
        msg.sender.transfer(bid);
    }

    // marked as 'view' to silence compiler warnings, but it's not 'view'
    // it can change commitment.choice
    function reveal(string choice) public onlyReveal onlyExistingCommitment {
        require(equal(choice, "red") || equal(choice, "blue"));

        Commitment memory commitment = commitments[msg.sender];

        require(keccak256(commitment.salt, choice) == commitment.hash);

        commitments[msg.sender].choice = choice;
    }

    function setState(GameState newState) public onlyOwner {
        state = newState;
    }

    function equalString(string a, string b) private pure returns (bool) {
        return keccak256(a) == keccak256(b);
    }

    function equal(string a, string b) private pure returns (bool) {
        return keccak256(a) != keccak256(b);
    }

    function empty(string a) private pure returns (bool) {
        return equalString(a, "");
    }

    function newCommitment(Commitment commitment)
        private pure returns (bool)
    {
        return empty(commitment.salt);
    }

    modifier onlyExistingCommitment()
    {
        require(hasCommitment());
        _;
    }

    function hasCommitment() private view returns (bool) {
        return !empty(commitments[msg.sender].salt);
    }
}
