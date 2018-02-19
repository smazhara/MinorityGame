pragma solidity ^0.4.19;

contract MinorityGame {
    address public owner;

    uint constant Commit = 1 << 0;

    uint constant Reveal = 1 << 1;

    uint constant Cashout = 1 << 2;

    uint constant Pause = 1 << 3;

    uint256 constant bid = 1000000000000000;

    uint public state = Commit;

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

    modifier onlyState(uint stateMask) {
        require(state & stateMask > 0);
        _;
    }

    modifier onlyWinner {
        require(
            equal(winningChoice(), "draw") ||
            equal(commitments[msg.sender].choice, winningChoice())
        );
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function getBalance() public view returns (uint256) {
        return this.balance;
    }

    function commit(bytes32 hash)
        public payable onlyState(Commit)
    {
        if (hasCommitment()) {
            require(msg.value == 0);
        } else {
            require(msg.value == bid);
        }

        if (! hasCommitment()) {
            commitmentCount++;
        }

        commitments[msg.sender] = Commitment(hash, '');
    }

    mapping (address => uint) pendingWithdrawals;

    function withdraw()
        public onlyState(Commit) onlyExistingCommitment
    {
        pendingWithdrawals[msg.sender] += bid;
        commitmentCount--;
        delete commitments[msg.sender];
        msg.sender.transfer(bid);
    }

    // marked as 'view' to silence compiler warnings, but it's not 'view'
    // it can change commitment.choice
    function reveal(string choice, string nonce)
        public onlyState(Reveal) onlyExistingCommitment
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

    function winningChoice()
        public view onlyState(Reveal | Cashout | Pause) returns (string)
    {
        if (redCount < blueCount && redCount > 0)
            return "red";

        if (redCount > blueCount && blueCount > 0)
            return "blue";

        return "draw";
    }

    function cashout()
        public onlyState(Cashout) onlyWinner
    {
    }

    // onlyOwner functions
    function setState(uint newState) public onlyOwner {
        require(validState(newState));

        state = newState;
    }

    function equal(string a, string b) private pure returns (bool) {
        return keccak256(a) == keccak256(b);
    }

    function empty(string a) private pure returns (bool) {
        return equal(a, "");
    }

    modifier onlyExistingCommitment()
    {
        require(hasCommitment());
        _;
    }

    function hasCommitment() private view returns (bool) {
        return commitments[msg.sender].hash > 0;
    }

    function validState(uint _state) private pure returns (bool) {
        return _state == Commit ||
            _state == Reveal ||
            _state == Cashout ||
            _state == Pause;
    }
}
