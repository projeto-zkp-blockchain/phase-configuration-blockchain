document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("accountSelect");
    const connectWalletButton = document.getElementById("connectWallet");
    const deployContractButton = document.getElementById("deployContract");
    const statusMessage = document.getElementById("statusMessage");

    let selectedAccount = null;
    let deployedContract = null;
    let selectedOption = null;
    const options = [
        { label: "1 mês", usd: 30 },
        { label: "3 meses", usd: 80 },
        { label: "6 meses", usd: 150 },
        { label: "1 ano", usd: 200 },
    ];

    // Função para baixar o arquivo JSON
    function baixarJSON(info_user) {
        const jsonString = JSON.stringify(info_user, null, 2);  // Converte o objeto para string JSON
        const blob = new Blob([jsonString], { type: "application/json" });  // Cria um Blob com o tipo MIME 'application/json'
        const link = document.createElement("a");  // Cria um link
        link.href = URL.createObjectURL(blob);  // Cria uma URL para o Blob
        link.download = "info_user.json";  // Define o nome do arquivo a ser baixado
        link.click();  // Simula o clique no link para iniciar o download
    }

    function gerarChaves() {
        function gerarChaves() {
            // Verificar se a biblioteca foi carregada corretamente
            if (typeof elliptic === 'undefined') {
                console.error("A biblioteca elliptic não foi carregada corretamente.");
                return null;
            }
            // Criar o gerador de chave elliptic com a curva secp256k1
            const EC = elliptic.ec;
            const ec = new EC('secp256k1'); // Usando a curva secp256k1
            // Gerar o par de chaves
            const chave = ec.genKeyPair();
            // Obter a chave privada em formato hexadecimal
            const chavePrivada = chave.getPrivate('hex');
            // Obter a chave pública como coordenadas inteiras
            const pontoPublico = chave.getPublic(); // Objeto de ponto público
            const x = pontoPublico.getX().toString(); // Coordenada x
            const y = pontoPublico.getY().toString(); // Coordenada y
            // Retornar as chaves como um objeto
            return {
                chavePrivada: chavePrivada,
                chavePublicaX: x,
                chavePublicaY: y
            };
        }

        if (typeof elliptic === 'undefined') {
            console.error("A biblioteca elliptic não foi carregada corretamente.");
            return null;
        }

        // Criar o gerador de chave elliptic com a curva secp256k1
        const EC = elliptic.ec;
        const ec = new EC('secp256k1'); // Usando a curva secp256k1

        // Gerar o par de chaves
        const chave = ec.genKeyPair();

        // Obter a chave privada em formato hexadecimal
        const chavePrivada = chave.getPrivate('hex');

        // Obter a chave pública como coordenadas inteiras
        const pontoPublico = chave.getPublic(); // Objeto de ponto público
        const x = pontoPublico.getX().toString(); // Coordenada x
        const y = pontoPublico.getY().toString(); // Coordenada y

        // Retornar as chaves como um objeto
        return {
            chavePrivada: chavePrivada,
            chavePublicaX: x,
            chavePublicaY: y
        };
    }


    // Função para exibir a mensagem com estilo adequado
    function showStatusMessage(message, type = "info") {
        // Limpar as mensagens anteriores
        statusMessage.classList.add("hidden");
        setTimeout(() => {
            statusMessage.classList.remove("hidden");
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}-message`;
        }, 500);  // Tempo para desaparecer a mensagem anterior antes de mostrar a nova
    }

    connectWalletButton.addEventListener("click", async () => {
        if (typeof window.ethereum !== "undefined") {
            const web3 = new Web3(window.ethereum);

            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();

                accountSelect.innerHTML = "<option value=''>Selecione uma conta</option>";
                accounts.forEach((account, index) => {
                    const option = document.createElement("option");
                    option.value = account;
                    option.textContent = `Conta ${index + 1}: ${account}`;
                    accountSelect.appendChild(option);
                });

                showStatusMessage("Carteira conectada. Selecione uma conta.", "success");
            } catch (error) {
                console.error(error);
                showStatusMessage("Erro ao conectar a carteira: " + error.message, "error");
            }
        } else {
            showStatusMessage("MetaMask não encontrada. Instale a extensão para continuar.", "error");
        }
    });

    accountSelect.addEventListener("change", (event) => {
        selectedAccount = event.target.value;
        if (selectedAccount) {
            showStatusMessage(`Conta selecionada: ${selectedAccount}`, "info");
            deployContractButton.disabled = false;
        }
    });

    //---------------Converter Dolar pra ETH

    /* 
        async function getEthereumPriceInUSD() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                const data = await response.json();
                return data.ethereum.usd;
            } catch (error) {
                console.error('Erro ao buscar a cotação do Ethereum:', error);
                return null;
            }
        }
    
        async function populateOptions() {
            const ethPriceInUSD = await getEthereumPriceInUSD();
            const timeSelection = document.getElementById('timeSelection');
    
            if (ethPriceInUSD) {
                options.forEach(option => {
                    const ethAmount = (option.usd / ethPriceInUSD).toFixed(6);
                    const optionElement = document.createElement('option');
                    optionElement.value = option.usd;
                    optionElement.textContent = `${option.label} - $${option.usd} (${ethAmount} ETH)`;
                    timeSelection.appendChild(optionElement);
                });
            } else {
                timeSelection.innerHTML = "<option value=''>Erro ao carregar cotações</option>";
            }
        }
    
        document.getElementById('timeSelection').addEventListener('change', function () {
            const selectedIndex = this.selectedIndex;
            if (selectedIndex > 0) {
                selectedOption = options[selectedIndex - 1]; // Armazena a opção selecionada
                console.log("Opção selecionada:", selectedOption);
            }
        });
    
        async function convertUsdToEth() {
            if (!selectedOption) {
                document.getElementById('result').innerText = 'Por favor, selecione uma opção válida.';
                return;
            }
    
            const ethPriceInUSD = await getEthereumPriceInUSD();
            if (ethPriceInUSD) {
                const ethAmount = selectedOption.usd / ethPriceInUSD;
                document.getElementById('result').innerText = `Valor em Ethereum: ${ethAmount.toFixed(6)} ETH`;
            } else {
                document.getElementById('result').innerText = 'Erro ao obter a cotação do Ethereum.';
            }
        }
    
        window.onload = populateOptions;
    */

    //--------------Fim Converter Dolar pra ETH

    deployContractButton.addEventListener("click", async () => {
        if (!selectedAccount) {
            showStatusMessage("Por favor, selecione uma conta.", "error");
            return;
        }

        try {
            // Carregando ABI e Bytecode
            const abiResponse = await fetch('abi.json');
            const bytecodeResponse = await fetch('bytecode.txt');
            const abi = await abiResponse.json();
            const bytecode = await bytecodeResponse.text();

            const web3 = new Web3(window.ethereum);
            const contract = new web3.eth.Contract(abi);
            const deployTransaction = contract.deploy({ data: bytecode });

            accountSelect.disabled = true;
            connectWallet.disabled = true;

            showStatusMessage("Fazendo deploy do contrato...", "info");
            const gasEstimate = await deployTransaction.estimateGas({ from: selectedAccount });

            deployedContract = await deployTransaction.send({
                from: selectedAccount,
                gas: gasEstimate,
            });

            showStatusMessage("Contrato implantado com sucesso!", "success");

            const contractInfo = document.createElement("p");
            contractInfo.innerHTML = `<strong>Endereço do contrato:</strong> ${deployedContract.options.address}<br>`;
            document.querySelector(".container").appendChild(contractInfo);

            // Enviando fundos para o contrato
            showStatusMessage("Enviando fundos do pagamento pro contrato...", "info");
            const amountInEther = "0.01"; // Valor em Ether
            const amountInWei = web3.utils.toWei(amountInEther, "ether");

            await web3.eth.sendTransaction({
                from: selectedAccount,
                to: deployedContract.options.address,
                value: amountInWei,
            });

            showStatusMessage(`Fundos enviados com sucesso! Valor: ${amountInEther} Ether`, "success");

            // Enviando pagamento para VPN
            showStatusMessage("Enviando o pagamento do contrato para a VPN...", "info");
            const vpnAddress = "0xc4EC580F6cF1B62CF84D54A3CCA2675F46316479";

            const tx = await deployedContract.methods
                .transferPayment(vpnAddress, amountInWei)
                .send({ from: selectedAccount });

            console.log("Transação confirmada:", tx);

            const receiptCode = await deployedContract.methods.getReceiptCode().call({ from: selectedAccount });

            console.log("ReceiptCode:", receiptCode);

            showStatusMessage("Pagamento enviado com sucesso!", "success");

            // Gerando as chaves
            const chaves = gerarChaves();
            if (chaves) {
                console.log("Chave Privada (hex):", chaves.chavePrivada);
                console.log("Chave Pública X:", chaves.chavePublicaX);
                console.log("Chave Pública Y:", chaves.chavePublicaY);
            }

            const url = "http://127.0.0.1:5000/verificarPagamento"; // Atualize se necessário

            const data = {
                addressContract: deployedContract.options.address,  // Endereço do contrato
                receiptCode: receiptCode,  // Código do recibo
                Quser: {
                    x: chaves.chavePublicaX,
                    y: chaves.chavePublicaY
                }
            };

            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {
                    console.log("Resposta do servidor:", result);

                    if (result === false) {
                        console.log("❌ Pagamento não encontrado.");
                    } else {
                        contractInfo.innerHTML += `<br>✅ Pagamento verificado com sucesso!<br>`;
                        //contractInfo.innerHTML += `<strong>ID User:</strong> ${result.IDuser}<br>`;
                        console.log("✅ Pagamento verificado com sucesso!");

                        // Agora você pode usar o IDuser aqui
                        const info_user = {
                            "IDuser": result.IDuser,  // Usando diretamente o IDuser recebido da resposta
                            "Kuser": chaves.chavePrivada,
                            "Quser": {
                                "x": chaves.chavePublicaX,
                                "y": chaves.chavePublicaY
                            },
                            "pagamento": {
                                "addressContract": deployedContract.options.address,
                                "receiptCode": receiptCode
                            }
                        };

                        console.log("Informações do usuário:", info_user);

                        baixarJSON(info_user);
                        contractInfo.innerHTML += `<br>✅ Informações de autenticação baixadas!<br>`;
                    }
                })
                .catch(error => {
                    console.error("Erro ao enviar requisição:", error);
                });

        } catch (error) {
            console.error(error);
            showStatusMessage("Erro durante o processo: " + error.message, "error");
        }
    });




});
