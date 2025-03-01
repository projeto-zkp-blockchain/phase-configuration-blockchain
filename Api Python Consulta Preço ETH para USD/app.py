from flask import Flask, jsonify
from requests import Session
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

# Configuração da API CoinMarketCap
API_KEY = "SUA-CHAVE-API-CoinMarketCap"  # Substitua pela sua chave API
URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
PARAMETERS = {'start': '1', 'limit': '100', 'convert': 'USD'}
HEADERS = {'Accepts': 'application/json', 'X-CMC_PRO_API_KEY': API_KEY}

def get_eth_price():
    """ Obtém o preço atual do Ethereum em USD """
    session = Session()
    session.headers.update(HEADERS)
    response = session.get(URL, params=PARAMETERS)
    data = response.json()

    for moeda in data["data"]:
        if moeda["symbol"] == "ETH":
            return moeda["quote"]["USD"]["price"]
    
    return None  # Caso não encontre ETH

@app.route('/price-eth-usd', methods=['GET'])
def price_eth_usd():
    """ Endpoint que retorna o preço do ETH em USD com timestamp """
    eth_price = get_eth_price()

    # Formata o timestamp no formato PT-BR (DD/MM/YYYY HH:MM:SS)
    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')

    if eth_price is not None:
        return jsonify({
            "timestamp": timestamp,
            "eth_price_usd": round(eth_price, 2)
        })
    else:
        return jsonify({"error": "Não foi possível obter o preço do Ethereum"}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
