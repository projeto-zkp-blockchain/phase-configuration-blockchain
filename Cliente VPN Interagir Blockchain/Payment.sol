// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract Payment {
    address public owner;
    uint256 private nonce; 
    bytes32 private receiptCode;  // Variável privada para armazenar o receiptCode

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

        // Atualiza nonce para cada transação, tornando o código imprevisível
        nonce++;

        // Geração do código de recibo seguro
        receiptCode = keccak256(abi.encodePacked(
            blockhash(block.number - 1),  // Hash do bloco anterior
            block.timestamp,              // Tempo da transação
            msg.sender,                   // Endereço do remetente
            gasleft(),                    // Gás restante na transação
            nonce                         // Número secreto único
        ));

        // Hash do código de recibo com o valor e o timestamp
        bytes32 hashValue = keccak256(abi.encodePacked(receiptCode, amount, block.timestamp));

        // Transferência do pagamento
        recipient.transfer(amount);

        // Emitir evento com receiptCode e hashValue
        emit PaymentTransferred(address(this), recipient, amount, hashValue, block.timestamp);

        // Retorna o receiptCode
        return receiptCode;
    }

    // Função pública para o proprietário acessar o receiptCode
    function getReceiptCode() public view returns (bytes32) {
        require(msg.sender == owner, "Apenas o dono pode acessar o receiptCode");
        return receiptCode;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
