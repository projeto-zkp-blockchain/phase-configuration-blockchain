from flask import Flask, request, jsonify
from web3 import Web3
import hashlib
from eth_hash.auto import keccak
from flask_cors import CORS
import os
import json
import time


app = Flask(__name__)
CORS(app)

# Set up the connection to the blockchain   
#rpc_url = "https://holesky.drpc.org"  # Replace with your node's URL
#rpc_url = "https://ethereum-sepolia-rpc.publicnode.com"  # Replace with your node's URL
rpc_url = "HTTP://127.0.0.1:7545"  # Replace with your node's URL
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

# Calculates the SHA256 hash of concatenated strings and returns as integer
def H(*args):
    concatenated = "".join(args)
    hash_hex = hashlib.sha256(concatenated.encode('utf-8')).hexdigest()
    return int(hash_hex, 16)

def generate_hash_value(receipt_code: str, amount: int, timestamp: int) -> str:
    """Generates the hashValue from receiptCode, amount, and block.timestamp"""
    receipt_bytes = bytes.fromhex(receipt_code[2:] if receipt_code.startswith("0x") else receipt_code)
    amount_bytes = amount.to_bytes(32, 'big')  # uint256 -> 32 bytes
    timestamp_bytes = timestamp.to_bytes(32, 'big')  # uint256 -> 32 bytes (corrected)

    data = receipt_bytes + amount_bytes + timestamp_bytes  # Concatenating as Solidity does
    return keccak(data).hex()  # Adds 0x prefix for compatibility


def salvar_json(dados, arquivo_json="usuarios.json"):
    """ Saves the transaction data to a JSON file inside the script's directory """

    # Gets the directory where the script is located
    diretorio_script = os.path.dirname(os.path.abspath(__file__))  
    caminho_arquivo = os.path.join(diretorio_script, arquivo_json)  

    # Checks if the file already exists and loads existing data
    registros = []
    if os.path.exists(caminho_arquivo):
        try:
            with open(caminho_arquivo, "r") as f:
                registros = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            print("⚠️ Erro ao ler JSON. Criando um novo arquivo.")

    # Add the new data
    registros.append(dados)

    # Saves the JSON in the same directory as the script
    with open(caminho_arquivo, "w") as f:
        json.dump(registros, f, indent=4)

    #print(f"\n✅ Data saved to {caminho_arquivo}")

@app.route('/verify-payment', methods=['POST'])
def verificar_pagamento():
    data = request.get_json()
    addressContract = data["addressContract"]
    receiptCode = data["receiptCode"]
    Quser_x = data["Quser"]["x"]
    Quser_y = data["Quser"]["y"]

    start_time = time.time()  # Start the verification time count

    # Define the search range (last 100 blocks)
    start_block = max(0, web3.eth.block_number - 100)
    end_block = web3.eth.block_number

    contract = web3.eth.contract(address=addressContract, abi=contrato_abi)

    print(f"\n🔍 Searching for events between blocks {start_block} and {end_block}...")

    # Search for events within the range
    event_logs = contract.events.PaymentTransferred.get_logs(from_block=start_block, to_block=end_block)

    if event_logs:
        event = event_logs[0]  # Get the first event found
        print(f"\n✅ Event found in block {event['blockNumber']}:")
        print(f"From: {event['args']['from']}")
        print(f"To: {event['args']['to']}")
        print(f"Value: {web3.from_wei(event['args']['amount'], 'ether')} ETH")
        print(f"HashValue: {event['args']['hashValue'].hex()}")
        print(f"Timestamp: {event['args']['timestamp']}")

        amount = event['args']['amount']
        hashValue_event = event['args']['hashValue'].hex()
        timestamp = event['args']['timestamp']

        # Generate the hash to verify the authenticity of the event
        hash_value = generate_hash_value(receiptCode, amount, timestamp)

        print("\nHash Value from Event:", hashValue_event)
        print("Calculated Hash Value:", hash_value)

        IDuser = H(str(Quser_x), str(Quser_y))

        tempoVerificacao = time.time() - start_time  # Calculate the verification time

        pagamento_info = {
            "IDuser": str(IDuser),
            "Quser": {
                "x": str(Quser_x),
                "y": str(Quser_y)
            },
            "pagamento": {
                "addressContract": addressContract,
                "receiptCode": receiptCode,
                "blockNumber": event["blockNumber"],
                "amount": f"{web3.from_wei(amount, 'ether')} ETH",
                "hashValue": hashValue_event,
                "timestamp": timestamp
            },
            "tempoVerificacao": tempoVerificacao
        }

        # Save the data in JSON
        salvar_json(pagamento_info)

        if hashValue_event == hash_value:
            print(f"Legitimate user ✅\n")
            return jsonify({'IDuser': str(IDuser)})
        else:
            print(f"User not legitimate ❌\n")
            return jsonify(False)

    print("🚫 No events found in the specified range.")
    return jsonify(False)



if __name__ == '__main__':
    app.run(debug=True)