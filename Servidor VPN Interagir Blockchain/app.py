from web3 import Web3
import json

# Configurar a conexão com a blockchain
rpc_url = "HTTP://127.0.0.1:7545"  # Substitua com a URL do seu nó
web3 = Web3(Web3.HTTPProvider(rpc_url))

# Verificar se está conectado
if web3.is_connected():  # Alterado para is_connected
    print("Conectado à blockchain")
else:
    print("Falha ao conectar")
    exit()

# Endereço do contrato (substitua pelo endereço correto)
contrato_endereco = "0xd1106bA63Ea508bb59b3c178F64e71E2a43a3782"

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

# Chamar uma função do contrato (exemplo: leitura do saldo do contrato)
try:
    saldo_contrato = contrato.functions.getContractBalance().call()
    # Usar Web3.from_wei para converter de wei para ether
    saldo_em_ether = Web3.from_wei(saldo_contrato, "ether")
    print("Saldo do contrato:", saldo_em_ether, "ETH")
except Exception as e:
    print("Erro ao chamar a função do contrato:", e)
