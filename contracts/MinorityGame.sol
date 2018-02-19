pragma solidity ^0.4.19;

contract MinorityGame {
    address public owner;

    uint constant Commit = 1 << 0;

    uint constant Reveal = 1 << 1;

    uint constant Cashout = 1 << 2;

    uint constant Pause = 1 << 3;

    uint256 constant bid = 1000000000000000;

    uint public state = Commit;

    struct Player {
        bytes32 hash;
        string choice;
        bool cashed;
    }

    mapping (address => Player) public players;

    uint8 public playerCount;

    uint8 public blueCount;

    uint8 public redCount;

    mapping (address => uint) pendingWithdrawals;

    function MinorityGame() public {
        owner = msg.sender;
    }

    function () external { revert(); }

    // external

    function commit(bytes32 hash)
        external payable onlyState(Commit)
    {
        if (existingPlayer()) {
            require(msg.value == 0);
        } else {
            require(msg.value == bid);
        }

        if (! existingPlayer()) {
            playerCount++;
        }

        players[msg.sender] = Player(hash, '', false);
    }

    function withdraw()
        external onlyState(Commit) onlyExistingPlayer
    {
        pendingWithdrawals[msg.sender] += bid;
        playerCount--;
        delete players[msg.sender];
        msg.sender.transfer(bid);
    }

    function player() public view returns (Player) {
        return players[msg.sender];
    }

    // marked as 'view' to silence compiler warnings, but it's not 'view'
    // it can change commitment.choice
    function reveal(string choice, string nonce)
        external onlyState(Reveal) onlyExistingPlayer
    {
        bool redChoice = equal(choice, "red");
        bool blueChoice = equal(choice, "blue");
        require(redChoice || blueChoice);

        require(keccak256(choice, nonce) == player().hash);

        players[msg.sender].choice = choice;

        if (redChoice)
            redCount++;

        if (blueChoice)
            blueCount++;
    }

    //function cashout()
    //    external onlyState(Cashout) onlyWinner
    //{
    //}

    modifier onlyState(uint stateMask) {
        require(state & stateMask > 0);
        _;
    }

    modifier onlyWinner {
        require(
            equal(winningChoice(), "draw") ||
            equal(player().choice, winningChoice())
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

    function winningChoice()
        public view onlyState(Reveal | Cashout | Pause) returns (string)
    {
        if (redCount == 0 || blueCount == 0 || redCount == blueCount)
            return "draw";

        if (redCount < blueCount)
            return "red";

        if (redCount > blueCount)
            return "blue";
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

    modifier onlyExistingPlayer()
    {
        require(existingPlayer());
        _;
    }

    function existingPlayer() public view returns (bool) {
        return player().hash > 0;
    }

    function validState(uint _state) private pure returns (bool) {
        return _state == Commit ||
            _state == Reveal ||
            _state == Cashout ||
            _state == Pause;
    }
}
