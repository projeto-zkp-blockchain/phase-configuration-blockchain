// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract Payment {
    address public owner;
    uint256 private nonce; 
    bytes32 private receiptCode;  // Private variable to store the receiptCode

    constructor() {
        owner = msg.sender;
        nonce = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, address(this))));
    }

    event PaymentReceived(address indexed sender, uint256 amount);
    event PaymentTransferred(address indexed from, address indexed to, uint256 amount, bytes32 hashValue, uint256 timestamp);

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function transferPayment(address payable recipient, uint256 amount) public returns (bytes32) {
        require(msg.sender == owner, "Apenas o dono pode realizar transferencias");
        require(address(this).balance >= amount, "Saldo insuficiente no contrato");
        require(recipient != address(0), "O endereco do destinatario nao pode ser zero");

        // Updates nonce for each transaction, making the code unpredictable
        nonce++;

        // Secure receipt code generation
        receiptCode = keccak256(abi.encodePacked(
            blockhash(block.number - 1),  // Previous block hash
            block.timestamp,              // Transaction timestamp
            msg.sender,                   // Sender's address
            gasleft(),                    // Remaining gas in the transaction
            nonce                         // Unique secret number
        ));

        // Hash of the receipt code with the amount and timestamp
        bytes32 hashValue = keccak256(abi.encodePacked(receiptCode, amount, block.timestamp));

        // Payment transfer
        recipient.transfer(amount);

        // Emit event with receiptCode and hashValue
        emit PaymentTransferred(address(this), recipient, amount, hashValue, block.timestamp);

        // Returns the receiptCode
        return receiptCode;
    }

    // Public function for the owner to access the receiptCode
    function getReceiptCode() public view returns (bytes32) {
        require(msg.sender == owner, "Apenas o dono pode acessar o receiptCode");
        return receiptCode;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
