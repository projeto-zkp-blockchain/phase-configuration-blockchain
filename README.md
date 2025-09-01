# 1. Implementation *Configuration Phase*

## 1.1 General Information

The code in this repository refers to the *configuration phase*, that is, the service subscription and the receipt of authentication parameters. In brief, the workflow is similar to what can be seen below:

<img width="4952" height="5484" alt="image" src="https://github.com/user-attachments/assets/ebb42b69-a9c4-488c-b368-3c148cf2f613" />

## This Repository Contains Three Folders:
- **PythonAPI-ETH-USD-Price**: Responsible for querying the price of Ethereum (ETH) in US dollars (USD) using the CoinMarketCap API. This functionality is essential to obtain the ETH value at the time of each transaction and convert the gas fees to the corresponding USD amount.
- **VPN-Client-Blockchain-Interaction**: Represents the VPN Client. Its main function is to connect to the user's wallet and manage the interaction with the blockchain.
- **VPN-Server-Blockchain-Interaction**: Responsible for verifying whether the payment made is legitimate, ensuring the security of the transaction.

## 1.2 Python API ETH to USD Price Query

- First, Python must be installed.
- The required libraries for installation are: `Flask`, `requests`, `flask-cors`. There are others, but they are part of the standard libraries. To install, simply run:
  
`pip install flask requests flask-cors`

- A very important point: to access the [CoinMarketCap](https://coinmarketcap.com/) API, you must create an account on the platform to generate an API access key. This key must be inserted in the designated location in the Python code.
- After that, simply run the code as an API. This service is essential for the VPN Client to query the price of ETH in USD.
- The API can be hosted on a VM in Google Cloud, as it was developed. A simpler alternative would be to run it on [Replit](https://replit.com/), which allows Python code to be executed conveniently, but with some limitations.
- The image below shows the response from the route to query the ETH price:

![preco-eth-usd](https://github.com/user-attachments/assets/c2215327-458a-4b79-a4be-0c9fdb9edc47)

## 1.3 VPN Client Blockchain Interaction

The VPN Client code is mainly composed of **HTML**, **JavaScript**, and other files that do not require additional configuration, such as the **ABI** and **Bytecode** of the Smart Contract.

### Running the VPN Client  

To run the application wherever needed (in our case, a **VM on Google Cloud** was used), simply navigate to the project folder on the VM and execute the following command:

`python3 -m http.server 5000`

### About the Web Interface  

The web interface was designed to be simple and intuitive for the user.  

- Upon accessing the page, there is a button to connect to the user's wallet.  
- After connecting, the accounts available in the wallet will be listed on the web page.  
- The user selects the account they wish to use for payment.  
- Then, simply click the **"Deploy Contract and Make Payment"** button.  
- Finally, it is necessary to confirm the transactions in the wallet to complete the entire configuration process.

### Image after an account is selected:
<img width="1920" height="1030" alt="1" src="https://github.com/user-attachments/assets/823cb420-8468-44a2-9014-03b3c4d89ab6" />

### Deploying the Smart Contract
<img width="1920" height="1030" alt="2 2" src="https://github.com/user-attachments/assets/30bf4deb-5562-4cf3-9a05-6c8cb9f17d97" />

### Sending the payment amount to the smart contract address
<img width="1920" height="1030" alt="3 1" src="https://github.com/user-attachments/assets/07667cb8-ef7d-4c42-8ce4-ad6fb0725df8" />

### Interacting with the smart contract function that sends the cryptocurrencies stored in the contract to the VPN Server's wallet address
<img width="1920" height="1030" alt="4 1" src="https://github.com/user-attachments/assets/ffc48ee1-865b-4c4b-952e-a00cfb04a3d6" />


### Final Screen
<img width="1920" height="1030" alt="5" src="https://github.com/user-attachments/assets/7eb3aa47-34c9-4a98-8031-8d0002a76a30" />


## 1.4 VPN Server Blockchain Interaction

- First, Python must be installed, then install the following libraries:

`pip install flask web3 flask-cors eth-hash`

To illustrate what the server does, basically, it searches the blockchain for the log record (event) and verifies whether the payment was actually made. To do this, it searches the last 100 blocks added to the blockchain. Essentially, the server recalculates the hash value, and if it finds the same value, it means everything is correct. The example below shows that the hash value was calculated exactly the same way.

<img width="787" height="233" alt="6 git" src="https://github.com/user-attachments/assets/c40dbf58-44e8-485a-bc65-8ddb562dbca8" />













