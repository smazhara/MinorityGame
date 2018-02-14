pragma solidity ^0.4.19;

contract MinorityGame {
    address owner;

    enum GameState { Commit, Reveal, Tally }

    uint256 constant bid = 100;

    GameState public state = GameState.Commit;

    enum Choice { NA, Blue, Red }

    struct Commitment {
        bytes32 hash;
        bytes32 salt;
        uint8 choice;
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

    function commit1(bytes23 hash, bytes32 salt) public onlyCommit returns (bool) {
        return true;
//        require(hash.length > 0 && salt.length > 0 && msg.value == bid);

        //if (commitments[msg.sender].hash == 0x0) {
            //commitmentCount++;
        //}

        //commitments[msg.sender] = Commitment(hash, salt, 0);
    }

    // marked as 'view' to silence compiler warnings, but it's not 'view'
    // it can change commitment.choice
    function reveal(uint8 choice) public view onlyReveal returns (uint8) {
        require(choice == 1 || choice == 2);

        Commitment memory commitment = commitments[msg.sender];

        require(commitment.hash != 0x0 && commitment.salt != 0x0);

        if (keccak256(choice, commitment.salt) == commitment.hash) {
            commitment.choice = choice;
        }

        return commitment.choice;// > 0;
    }

    function keccak(string choice) public pure returns (bytes32) {
        return keccak256(choice);
    }

    function setState(GameState newState) public onlyOwner {
        state = newState;
    }
}
