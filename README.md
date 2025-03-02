# 1. Implementação *fase de configuração*

## 1.1 Informações gerais

O código neste repositório refere-se à *fase de configuração*, ou seja, a contratação pelo serviço e recebimentos dos parâmetros de autenticação. De forma breve segue o fluxo semelhante ao que pode ser visto abaixo:

![image](https://github.com/user-attachments/assets/3a8b8c84-a32c-4d4f-ad46-706fce8fd09d)

## Este Repositório possui três pastas:
- Api Python Consulta Preço ETH para USD: Responsável por consultar o preço do Ethereum (ETH) em dólares (USD) utilizando a API do CoinMarketCap. Essa funcionalidade é essencial para obter o valor do ETH no momento de cada transação e converter os custos de gás para o valor correspondente em dólar.
- Cliente VPN Interagir Blockchain: Representa o Cliente VPN. Sua principal função é conectar-se à carteira do usuário e gerenciar a interação com a blockchain.
- Servidor VPN Interagir Blockchain: Responsável por verificar se o pagamento realizado é legítimo, garantindo a segurança da transação.

## 1.2 Api Python Consulta Preço ETH para USD

- Primeiramente, deve-se ter o Python instalado.
- As bibliotecas necessárias para a instalação: `Flask`, `requests`, `flask-cors`, existe outras, mas, fazem parte das bibliotecas padrões. Para instalar, basta executar:
  
`pip install flask requests flask-cors`

- Um ponto muito importante: para acessar a API do [CoinMarketCap](https://coinmarketcap.com/), deve-se criar uma conta na plataforma para gerar uma chave de acesso à API. Essa chave deve ser inserida no local indicado no código Python.
- Após isso, basta rodar o código como uma API. Esse serviço será importante para que o Cliente VPN possa consultar o preço do ETH em USD.
- A API pode ser hospedada em uma VM no Google Cloud, como foi desenvolvido. Uma alternativa mais simples seria rodá-la no [Replit](https://replit.com/), que permite executar código Python de forma prática, porém com algumas limitações.
- A imagem a seguir mostra o retorno da rota pra consultar o preço do ETH:

![preco-eth-usd](https://github.com/user-attachments/assets/c2215327-458a-4b79-a4be-0c9fdb9edc47)

## 1.3 Cliente VPN Interagir Blockchain

O código do Cliente VPN é composto principalmente por arquivos **HTML**, **JavaScript** e outros que não necessitam de configuração adicional, como o **ABI** e o **Bytecode** do Contrato Inteligente.

### Executando o Cliente VPN  

Para rodar a aplicação onde for necessário (no nosso caso, foi utilizada uma **VM no Google Cloud**), basta acessar a pasta do projeto na VM e executar o seguinte comando:

`python3 -m http.server 5000`

### Sobre a Interface Web  

A interface web foi projetada para ser simples e intuitiva para o usuário.  

- Ao acessar a página, há um botão para conectar à carteira do usuário.  
- Após a conexão, as contas disponíveis na carteira serão listadas na página web.  
- O usuário seleciona a conta que deseja utilizar para o pagamento.  
- Em seguida, basta clicar no botão **"Implantar Contrato e Realizar Pagamento"**.  
- Por fim, será necessário confirmar as transações na carteira para concluir todo o processo de configuração.

### Imagem após selecionada uma conta:
![Conta Selecionada Janela](https://github.com/user-attachments/assets/4e2d1cc9-80ae-4730-8371-ffa4ec833108)

### Fazendo deploy do Contrato Inteligente
![1](https://github.com/user-attachments/assets/a94fff62-e4c7-478c-9955-f3adcc782bd0)

### Enviando valor do pagamento para o endereço do contrato inteligente
![6](https://github.com/user-attachments/assets/4ccf0b8f-664f-4f0b-b76e-2a7923cff34d)

### Interagindo com a função do contrato inteligente que envia as criptomoedas armazenadas no contrato para o endereço da carteira do Servidor VPN
![11](https://github.com/user-attachments/assets/079c6c93-ef62-40f2-b248-c65227a7f976)

### Tela final
![tela final cheia](https://github.com/user-attachments/assets/5d070b85-da32-43c5-b40d-0289072eb7aa)

## 1.4 Servidor VPN Interagir Blockchain









