from flask import Flask, jsonify
from web3 import Web3
import json

app = Flask(__name__)

# Configurar a conexão com a blockchain
rpc_url = "HTTP://127.0.0.1:7545"  # Substitua com a URL do seu nó
web3 = Web3(Web3.HTTPProvider(rpc_url))

# Verificar se está conectado
if not web3.is_connected():
    print("Falha ao conectar")
    exit()
else:
    print("Conectado à blockchain")

# Endereço do contrato (substitua pelo endereço correto)
contrato_endereco = "0x6e5271e01e498071aEAaC26aDe72571ea565519a"

# Ler o ABI do contrato de um arquivo externo
try:
    with open("contract_abi.json", "r") as abi_file:
        contrato_abi = json.load(abi_file)
except FileNotFoundError:
    print("Erro: Arquivo 'contract_abi.json' não encontrado.")
    exit()
except json.JSONDecodeError:
    print("Erro: O arquivo ABI contém um JSON inválido.")
    exit()

# Criar uma instância do contrato
contrato = web3.eth.contract(address=contrato_endereco, abi=contrato_abi)

@app.route('/teste', methods=['GET'])
def verificar_pagamento():
    try:
        # Chamar uma função do contrato (exemplo: leitura do saldo do contrato)
        saldo_contrato = contrato.functions.getContractBalance().call()

        proprietario = contrato.functions.owner().call()

        print(proprietario)
        print(saldo_contrato)
        
        # Usar Web3.from_wei para converter de wei para ether
        saldo_em_ether = Web3.from_wei(saldo_contrato, "ether")
        
        return jsonify({
            "status": "sucesso",
            "saldo": saldo_em_ether,
            "Proprietario": proprietario
        })
    except Exception as e:
        return jsonify({
            "status": "erro",
            "mensagem": str(e)
        })

@app.route('/verificarPagamento', methods=['POST'])
def verificar_pagamento():
    try:
        # Chamar uma função do contrato (exemplo: leitura do saldo do contrato)
        saldo_contrato = contrato.functions.getContractBalance().call()

        proprietario = contrato.functions.owner().call()

        print(proprietario)
        print(saldo_contrato)
        
        # Usar Web3.from_wei para converter de wei para ether
        saldo_em_ether = Web3.from_wei(saldo_contrato, "ether")
        
        return jsonify({
            "status": "sucesso",
            "saldo": saldo_em_ether,
            "Proprietario": proprietario
        })
    except Exception as e:
        return jsonify({
            "status": "erro",
            "mensagem": str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)
