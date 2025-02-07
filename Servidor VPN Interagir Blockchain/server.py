from flask import Flask, request, jsonify
from web3 import Web3
import hashlib
from eth_hash.auto import keccak
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Configurar a conexão com a blockchain         
#rpc_url = "https://holesky.drpc.org"  # Substitua com a URL do seu nó
#rpc_url = "https://ethereum-sepolia-rpc.publicnode.com"  # Substitua com a URL do seu nó
rpc_url = "HTTP://127.0.0.1:7545"  # Substitua com a URL do seu nó
web3 = Web3(Web3.HTTPProvider(rpc_url))

contrato_abi = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "from", "type": "address"},
            {"indexed": True, "name": "to", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
            {"indexed": False, "name": "hashValue", "type": "bytes32"},
            {"indexed": False, "name": "timestamp", "type": "uint256"}
        ],
        "name": "PaymentTransferred",
        "type": "event"
    }
]

# Calcula o hash SHA256 de strings concatenadas e retorna em inteiro
def H(*args):
    concatenated = "".join(args)
    hash_hex = hashlib.sha256(concatenated.encode('utf-8')).hexdigest()
    return int(hash_hex, 16)

def generate_hash_value(receipt_code: str, amount: int, timestamp: int) -> str:
    """Gera o hashValue a partir do receiptCode, amount e block.timestamp"""
    receipt_bytes = bytes.fromhex(receipt_code[2:] if receipt_code.startswith("0x") else receipt_code)
    amount_bytes = amount.to_bytes(32, 'big')  # uint256 -> 32 bytes
    timestamp_bytes = timestamp.to_bytes(32, 'big')  # uint256 -> 32 bytes (corrigido)

    data = receipt_bytes + amount_bytes + timestamp_bytes  # Concatenando como Solidity faz
    return keccak(data).hex()  # Adiciona prefixo 0x para compatibilidade


@app.route('/verificarPagamento', methods=['POST'])
def verificar_pagamento():
    data = request.get_json()
    addressContract = data["addressContract"]
    receiptCode = data["receiptCode"]
    Quser_x = data["Quser"]["x"]
    Quser_y = data["Quser"]["y"]

    # Definir o intervalo de busca (últimos 100 blocos)
    start_block = max(0, web3.eth.block_number - 100)
    end_block = web3.eth.block_number

    contract = web3.eth.contract(address=addressContract, abi=contrato_abi)

    print(f"🔍 Buscando eventos entre os blocos {start_block} e {end_block}...")

    # Buscar eventos dentro do intervalo
    event_logs = contract.events.PaymentTransferred.get_logs(from_block=start_block, to_block=end_block)

    if event_logs:
        event = event_logs[0]  # Pega o primeiro evento encontrado
        print(f"\n✅ Evento encontrado no bloco {event['blockNumber']}:")
        print(f"De: {event['args']['from']}")
        print(f"Para: {event['args']['to']}")
        print(f"Valor: {web3.from_wei(event['args']['amount'], 'ether')} ETH")
        print(f"HashValue: {event['args']['hashValue'].hex()}")
        print(f"Timestamp: {event['args']['timestamp']}")

        amount = event['args']['amount']
        hashValue_event = event['args']['hashValue'].hex()
        timestamp = event['args']['timestamp']

        # Gera o hash para verificar a autenticidade do evento
        hash_value = generate_hash_value(receiptCode, amount, timestamp)

        print("Hash Value Event:", hashValue_event)
        print("Hash Value Calculado:", hash_value)

        IDuser = H(str(Quser_x), str(Quser_y))

        if hashValue_event == hash_value:
            return jsonify({'IDuser': str(IDuser)})
        else:
            return jsonify(False)

    print("🚫 Nenhum evento encontrado no intervalo definido.")
    return jsonify(False)



if __name__ == '__main__':
    app.run(debug=True)
