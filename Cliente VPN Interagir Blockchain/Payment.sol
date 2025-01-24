// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract Payment {
    address public owner;

    // Construtor para definir o dono do contrato
    constructor() {
        owner = msg.sender;
    }

    // Evento para registrar pagamentos recebidos
    event PaymentReceived(address indexed sender, uint256 amount);

    // Evento para registrar transferências realizadas
    event PaymentTransferred(address indexed from, address indexed to, uint256 amount);

    // Função para receber pagamentos
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
    
    // Função para transferir pagamentos para outro endereço
    function transferPayment(address payable recipient, uint256 amount) public {
        require(msg.sender == owner, "Apenas o dono pode realizar transferencias");
        require(address(this).balance >= amount, "Saldo insuficiente no contrato");
        require(recipient != address(0), "O endereco do destinatario nao pode ser zero");

        recipient.transfer(amount);
        emit PaymentTransferred(address(this), recipient, amount);
    }

    // Função para verificar o saldo do contrato
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
