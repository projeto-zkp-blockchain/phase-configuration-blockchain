document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("accountSelect");
    const connectWalletButton = document.getElementById("connectWallet");
    const deployContractButton = document.getElementById("deployContract");
    const statusMessage = document.getElementById("statusMessage");

    let selectedAccount = null;
    let deployedContract = null;

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

            showStatusMessage("Fazendo deploy do contrato...", "info");
            const gasEstimate = await deployTransaction.estimateGas({ from: selectedAccount });

            deployedContract = await deployTransaction.send({
                from: selectedAccount,
                gas: gasEstimate,
            });

            showStatusMessage("Contrato implantado com sucesso!", "success");

            const contractInfo = document.createElement("p");
            contractInfo.innerHTML = `<strong>Endereço do contrato:</strong> ${deployedContract.options.address}`;
            const container = document.querySelector(".container");
            container.appendChild(contractInfo);

            // Enviando fundos para o contrato
            showStatusMessage("Enviando fundos do pagamento pro contrato...", "info");
            const amountInEther = "0.1"; // Valor em Ether
            const amountInWei = web3.utils.toWei(amountInEther, "ether");

            await web3.eth.sendTransaction({
                from: selectedAccount,
                to: deployedContract.options.address,
                value: amountInWei,
            });

            showStatusMessage(`Fundos enviados com sucesso! Valor: ${amountInEther} Ether`, "success");

            // Enviando pagamento para VPN
            showStatusMessage("Enviando o pagamento do contrato para a VPN...", "info");
            const vpnAddress = "0x858d28E95676a5e6F9894796b58aAD7020BfbF14";
            await deployedContract.methods
                .transferPayment(vpnAddress, amountInWei)
                .send({ from: selectedAccount });

            showStatusMessage("Pagamento enviado com sucesso!", "success");
        } catch (error) {
            console.error(error);
            showStatusMessage("Erro durante o processo: " + error.message, "error");
        }
    });
});
