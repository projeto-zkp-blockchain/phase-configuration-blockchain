document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("accountSelect");
    const connectWalletButton = document.getElementById("connectWallet");
    const deployContractButton = document.getElementById("deployContract");
    const statusMessage = document.getElementById("statusMessage");

    let selectedAccount = null;
    let deployedContract = null;

    function formatarDataBrasileira(data) {
        return data.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo', // Fuso horário brasileiro
            hour12: false // Formato de 24 horas
        });
    }

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

    // Função para obter o preço do ETH em USD da sua API
    async function getETHPriceAndTimestamp() {
        try {
            const response = await fetch('http://127.0.0.1:5001/price-eth-usd'); // Corrigido para a URL correta
            const data = await response.json();
            return {
                ethPriceUSD: data.eth_price_usd,
                timestamp: data.timestamp
            }; // Retorna o preço do Ethereum em USD
        } catch (error) {
            console.error("Erro ao buscar o preço do ETH:", error);
            return null; // Retorna null em caso de erro
        }
    }

    // Função para calcular o valor em Ether equivalente a um valor em USD
    async function getAmountInEther(amountInUSD) {
        const ethPriceUSD = await getETHPriceAndTimestamp(); // Função para obter o preço do Ethereum em USD
        if (ethPriceUSD !== null) {
            const amountInEther = amountInUSD / ethPriceUSD.ethPriceUSD; // Calcula o valor equivalente em Ether
            return amountInEther.toFixed(4); // Retorna com 4 casas decimais
        } else {
            // Se não conseguir obter o preço, retorna o valor padrão de 0.001 ETH
            console.log("Não foi possível obter o preço do ETH. Usando valor padrão de 0.001 ETH.");
            return "0.001"; // Valor padrão
        }
    }


    const contractInfo = document.createElement("p");
    document.querySelector(".container").appendChild(contractInfo);

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
            deployContractButton.disabled = true;

            // Fazendo deploy do contrato
            showStatusMessage("Fazendo deploy do contrato...", "waiting");

            const gasEstimate = await deployTransaction.estimateGas({ from: selectedAccount });

            let envioDeploy, fimDeploy, tempoDeploy;
            let temposExecucao;

            deployedContract = await deployTransaction.send({
                from: selectedAccount,
                gas: gasEstimate,
            })
                .on('transactionHash', (hash) => {
                    console.log("Transação enviada, aguardando mineração...", hash);
                    envioDeploy = performance.now(); // Tempo exato do envio
                })
                .once('receipt', async (receipt) => {
                    fimDeploy = performance.now(); // Tempo da confirmação
                    tempoDeploy = ((fimDeploy - envioDeploy) / 1000).toFixed(4) + " s"; // Em segundos

                    temposExecucao = JSON.parse(localStorage.getItem(`tempos_${receipt.contractAddress}`)) || {};

                    temposExecucao["1 - Tempo Deploy Contrato"] = tempoDeploy;
                    console.log("Tempo real de deploy:", tempoDeploy);

                    // Cálculo do gás usado e taxa em ETH
                    const gasUsed = receipt.gasUsed;
                    const gasPrice = receipt.effectiveGasPrice;
                    const gasFee = BigInt(gasUsed) * BigInt(gasPrice); // Cálculo do custo total do gás
                    const gasFeeInETH = Number(gasFee) / 1e18; // Convertendo de wei para ETH

                    console.log("Custo Total de Gas (ETH):", gasFeeInETH);

                    // Obter o preço atual do ETH em USD da sua rota
                    const ethPriceUSDandData = await getETHPriceAndTimestamp();
                    let gasFeeInUSD = null;
                    if (ethPriceUSDandData !== null) {
                        gasFeeInUSD = gasFeeInETH * ethPriceUSDandData.ethPriceUSD; // Converter gás de ETH para USD
                        console.log(`Custo do gás em USD: $${gasFeeInUSD.toFixed(2)}`);
                        console.log(`Preço atual do Ethereum: $${ethPriceUSDandData.ethPriceUSD.toFixed(2)} USD`);
                    } else {
                        console.log("Não foi possível obter o preço do ETH.");
                    }

                    // Preço do Ethereum (em USD)
                    const ethPrice = ethPriceUSDandData.ethPriceUSD !== null ? ethPriceUSDandData.ethPriceUSD.toFixed(2) : "Indisponível";

                    // Preencher o objeto temposExecucao com as informações de tempo e outras informações
                    temposExecucao["1.1 Custo Total de Gas (ETH)"] = gasFeeInETH.toString();
                    temposExecucao["1.2 Custo Total de Gas (USD)"] = gasFeeInUSD !== null ? gasFeeInUSD.toFixed(2) : "Indisponível";
                    temposExecucao["1.3 Preço Atual do Ethereum (USD)"] = ethPrice;
                    temposExecucao["1.4 Data da Execução"] = ethPriceUSDandData.timestamp; // Usando a data do JSON para formatar

                    // Exibir os valores no console
                    console.log("1.1 Custo Total de Gas (ETH)", temposExecucao["1.1 Custo Total de Gas (ETH)"]);
                    console.log("1.2 Custo Total de Gas (USD)", temposExecucao["1.2 Custo Total de Gas (USD)"]);
                    console.log("1.3 Preço Atual do Ethereum (USD)", temposExecucao["1.3 Preço Atual do Ethereum (USD)"]);
                    console.log("1.4 Data da Execução", temposExecucao["1.4 Data da Execução"]);

                    // Salvar no localStorage com o endereço do contrato
                    localStorage.setItem(`tempos_${receipt.contractAddress}`, JSON.stringify(temposExecucao));

                    //showStatusMessage("Contrato implantado com sucesso!", "success");

                    contractInfo.innerHTML = `<strong>Endereço do contrato:</strong> ${receipt.contractAddress}<br>`;

                });
            // Enviando fundos para o contrato
            showStatusMessage("Enviando fundos do pagamento para o contrato...", "waiting");

            const amountInEther = await getAmountInEther(20);

            contractInfo.innerHTML += `<br>💬 Será enviado $20 (${amountInEther} ETH) para o contrato!<br>`;

            const amountInWei = web3.utils.toWei(amountInEther, "ether");

            let envioPagamentoContrato, fimPagamentoContrato, tempoPagamentoContrato;

            await web3.eth.sendTransaction({
                from: selectedAccount,
                to: deployedContract.options.address,
                value: amountInWei,
            })
                .on('transactionHash', (hash) => {
                    console.log("Transação enviada, aguardando mineração...", hash);
                    envioPagamentoContrato = performance.now();
                })
                .once('receipt', async (receipt) => {
                    fimPagamentoContrato = performance.now();
                    tempoPagamentoContrato = ((fimPagamentoContrato - envioPagamentoContrato) / 1000).toFixed(4) + " s";

                    temposExecucao["2 - Tempo Transação para o Contrato"] = tempoPagamentoContrato;
                    console.log("Tempo real Transação para o Contrato:", tempoPagamentoContrato);

                    // Cálculo do gás usado e taxa em ETH
                    const gasUsed = receipt.gasUsed;
                    const gasPrice = receipt.effectiveGasPrice;
                    const gasFee = BigInt(gasUsed) * BigInt(gasPrice); // Cálculo do custo total do gás
                    const gasFeeInETH = Number(gasFee) / 1e18; // Convertendo de wei para ETH

                    console.log("Custo Total de Gas (ETH):", gasFeeInETH);

                    // Obter o preço atual do ETH em USD
                    const ethPriceUSDandData = await getETHPriceAndTimestamp();
                    let gasFeeInUSD = null;
                    if (ethPriceUSDandData !== null) {
                        gasFeeInUSD = gasFeeInETH * ethPriceUSDandData.ethPriceUSD; // Converter gás de ETH para USD
                        console.log(`Custo do gás em USD: $${gasFeeInUSD.toFixed(2)}`);
                        console.log(`Preço atual do Ethereum: $${ethPriceUSDandData.ethPriceUSD.toFixed(2)} USD`);
                    } else {
                        console.log("Não foi possível obter o preço do ETH.");
                    }

                    // Preço do Ethereum (em USD)
                    const ethPrice = ethPriceUSDandData !== null ? ethPriceUSDandData.ethPriceUSD.toFixed(2) : "Indisponível";

                    // Preencher o objeto temposExecucao com as informações de tempo e outras informações
                    temposExecucao["2.1 Custo Total de Gas (ETH)"] = gasFeeInETH.toString();
                    temposExecucao["2.2 Custo Total de Gas (USD)"] = gasFeeInUSD !== null ? gasFeeInUSD.toFixed(2) : "Indisponível";
                    temposExecucao["2.3 Preço Atual do Ethereum (USD)"] = ethPrice;
                    temposExecucao["2.4 Data da Execução"] = ethPriceUSDandData.timestamp; // Usando a data do JSON para formatar

                    // Exibir os valores no console
                    console.log("2.1 Custo Total de Gas (ETH)", temposExecucao["2.1 Custo Total de Gas (ETH)"]);
                    console.log("2.2 Custo Total de Gas (USD)", temposExecucao["2.2 Custo Total de Gas (USD)"]);
                    console.log("2.3 Preço Atual do Ethereum (USD)", temposExecucao["2.3 Preço Atual do Ethereum (USD)"]);
                    console.log("2.4 Data da Execução", temposExecucao["2.4 Data da Execução"]);

                    // Salvar no localStorage com o endereço do contrato
                    localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

                });

            // Enviando pagamento para VPN
            showStatusMessage("Enviando o pagamento do contrato para a VPN...", "waiting");
            const vpnAddress = "0xdCcEEd9A4b102093bB0eC1e81a0969d9BB6b55a2";

            let envioVPN, fimVPN, tempoVPN;

            const tx = await deployedContract.methods
                .transferPayment(vpnAddress, amountInWei)
                .send({ from: selectedAccount })
                .on('transactionHash', (hash) => {
                    console.log("Transação para VPN enviada, aguardando mineração...", hash);
                    envioVPN = performance.now(); // Marca o momento em que a transação é enviada
                })
                .once('receipt', async (receipt) => {

                    fimVPN = performance.now(); // Marca o momento em que a transação é confirmada
                    tempoVPN = ((fimVPN - envioVPN) / 1000).toFixed(4) + " s"; // Calcula o tempo de transação em segundos

                    // Cálculo do gás usado e taxa em ETH
                    const gasUsed = receipt.gasUsed;
                    const gasPrice = receipt.effectiveGasPrice;
                    const gasFee = BigInt(gasUsed) * BigInt(gasPrice); // Cálculo do custo total do gás em wei
                    const gasFeeInETH = Number(gasFee) / 1e18; // Convertendo de wei para ETH

                    console.log("Custo Total de Gas (ETH):", gasFeeInETH);

                    // Obter o preço atual do ETH em USD
                    const ethPriceUSDandData = await getETHPriceAndTimestamp();
                    let gasFeeInUSD = null;
                    if (ethPriceUSDandData !== null) {
                        gasFeeInUSD = gasFeeInETH * ethPriceUSDandData.ethPriceUSD; // Converter gás de ETH para USD
                        console.log(`Custo do gás em USD: $${gasFeeInUSD.toFixed(2)}`);
                        console.log(`Preço atual do Ethereum: $${ethPriceUSDandData.ethPriceUSD.toFixed(2)} USD`);
                    } else {
                        console.log("Não foi possível obter o preço do ETH.");
                    }

                    // Preço do Ethereum (em USD)
                    const ethPrice = ethPriceUSDandData !== null ? ethPriceUSDandData.ethPriceUSD.toFixed(2) : "Indisponível";

                    // Preencher o objeto temposExecucao com as informações de tempo e outras informações
                    temposExecucao["3 - Tempo Transação do Contrato Para a VPN"] = tempoVPN;
                    temposExecucao["3.1 Custo Total de Gas (ETH)"] = gasFeeInETH.toString(); // Exibir com todas as casas decimais
                    temposExecucao["3.2 Custo Total de Gas (USD)"] = gasFeeInUSD !== null ? gasFeeInUSD.toFixed(2) : "Indisponível";
                    temposExecucao["3.3 Preço Atual do Ethereum (USD)"] = ethPrice;
                    temposExecucao["3.4 Data da Execução"] = formatarDataBrasileira(new Date()); // Armazenando a data no formato brasileiro

                    // Exibir os valores no console
                    console.log("3 - Tempo Transação do Contrato Para a VPN", temposExecucao["3 - Tempo Transação do Contrato Para a VPN"]);
                    console.log("3.1 Custo Total de Gas (ETH)", temposExecucao["3.1 Custo Total de Gas (ETH)"]);
                    console.log("3.2 Custo Total de Gas (USD)", temposExecucao["3.2 Custo Total de Gas (USD)"]);
                    console.log("3.3 Preço Atual do Ethereum (USD)", temposExecucao["3.3 Preço Atual do Ethereum (USD)"]);
                    console.log("3.4 Data da Execução", temposExecucao["3.4 Data da Execução"]);

                    // Salvar no localStorage
                    localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

                    showStatusMessage("Pagamento enviado com sucesso!", "success");
                });

            //console.log("Transação confirmada:", tx);


            // Medindo o tempo para obter o receiptCode
            let inicioReceiptCode = performance.now();
            const receiptCode = await deployedContract.methods.getReceiptCode().call({ from: selectedAccount });
            let fimReceiptCode = performance.now();
            let tempoReceiptCode = ((fimReceiptCode - inicioReceiptCode) / 1000).toFixed(4) + " s";

            temposExecucao["4 - Tempo Obtenção ReceiptCode"] = tempoReceiptCode;
            console.log("Tempo real Obtenção ReceiptCode:", tempoReceiptCode);
            localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

            console.log("ReceiptCode:", receiptCode);

            // Medindo o tempo de geração das chaves
            let inicioGeracaoChaves = performance.now();
            const chaves = gerarChaves();
            let fimGeracaoChaves = performance.now();
            let tempoGeracaoChaves = ((fimGeracaoChaves - inicioGeracaoChaves) / 1000).toFixed(4) + " s";

            temposExecucao["5 - Tempo Geração de Chaves"] = tempoGeracaoChaves;
            console.log("Tempo real Geração de Chaves:", tempoGeracaoChaves);
            localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

            if (chaves) {
                console.log("Chave Privada (hex):", chaves.chavePrivada);
                console.log("Chave Pública X:", chaves.chavePublicaX);
                console.log("Chave Pública Y:", chaves.chavePublicaY);
            }

            const url = "http://127.0.0.1:5000/verificarPagamento";

            const data = {
                addressContract: deployedContract.options.address,
                receiptCode: receiptCode,
                Quser: {
                    x: chaves.chavePublicaX,
                    y: chaves.chavePublicaY
                }
            };

            let inicioVerificacaoPagamento = performance.now();

            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {

                    let fimVerificacaoPagamento = performance.now();
                    let tempoVerificacaoPagamento = ((fimVerificacaoPagamento - inicioVerificacaoPagamento) / 1000).toFixed(4) + " s";

                    temposExecucao["6 - Tempo Verificação Pagamento"] = tempoVerificacaoPagamento;
                    console.log("Tempo real Verificação Pagamento:", tempoVerificacaoPagamento);
                    localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

                    //console.log("Resposta do servidor:", result);

                    if (!result) {
                        console.log("❌ Pagamento não encontrado.");
                    } else {

                        contractInfo.innerHTML += `<br>✅ Pagamento verificado com sucesso!<br>`;
                        //showStatusMessage("✅ Pagamento verificado com sucesso!", "success");

                        const info_user = {
                            IDuser: result.IDuser,
                            Kuser: chaves.chavePrivada,
                            Quser: {
                                x: chaves.chavePublicaX,
                                y: chaves.chavePublicaY
                            },
                            pagamento: {
                                addressContract: deployedContract.options.address,
                                receiptCode: receiptCode
                            }
                        };

                        //console.log("Informações do usuário:", info_user);

                        baixarJSON(info_user);

                        contractInfo.innerHTML += `<br>✅ Informações de autenticação baixadas!<br>`;
                        //showStatusMessage("✅ Informações de autenticação baixadas!", "success");
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
