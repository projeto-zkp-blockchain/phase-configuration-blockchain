document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("accountSelect");
    const connectWalletButton = document.getElementById("connectWallet");
    const deployContractButton = document.getElementById("deployContract");
    const statusMessage = document.getElementById("statusMessage");

    let selectedAccount = null;
    let deployedContract = null;

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

                statusMessage.textContent = "Carteira conectada. Selecione uma conta.";
                statusMessage.style.color = "green";
            } catch (error) {
                console.error(error);
                statusMessage.textContent = "Erro ao conectar a carteira: " + error.message;
                statusMessage.style.color = "red";
            }
        } else {
            statusMessage.textContent = "MetaMask não encontrada. Instale a extensão para continuar.";
            statusMessage.style.color = "red";
        }
    });

    accountSelect.addEventListener("change", (event) => {
        selectedAccount = event.target.value;
        if (selectedAccount) {
            statusMessage.textContent = `Conta selecionada: ${selectedAccount}`;
            statusMessage.style.color = "blue";
            deployContractButton.disabled = false;
        }
    });

    deployContractButton.addEventListener("click", async () => {
        if (!selectedAccount) {
            statusMessage.textContent = "Por favor, selecione uma conta.";
            statusMessage.style.color = "red";
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

            statusMessage.textContent = "Fazendo deploy do contrato...";
            const gasEstimate = await deployTransaction.estimateGas({ from: selectedAccount });

            deployedContract = await deployTransaction.send({
                from: selectedAccount,
                gas: gasEstimate,
            });

            statusMessage.textContent = "Contrato implantado com sucesso!";
            statusMessage.style.color = "green";

            const contractInfo = document.createElement("p");
            contractInfo.innerHTML = `<strong>Endereço do contrato:</strong> ${deployedContract.options.address}`;
            document.body.appendChild(contractInfo);

            // Enviando fundos para o contrato
            statusMessage.textContent = "Enviando fundos do pagamento pro contrato...";
            const amountInEther = "0.1"; // Valor em Ether
            const amountInWei = web3.utils.toWei(amountInEther, "ether");

            await web3.eth.sendTransaction({
                from: selectedAccount,
                to: deployedContract.options.address,
                value: amountInWei,
            });

            statusMessage.textContent = `Fundos enviados com sucesso! Valor: ${amountInEther} Ether`;
            statusMessage.style.color = "green";

            // Enviando pagamento para VPN
            statusMessage.textContent = "Enviando o pagamento do contrato para a VPN...";
            const vpnAddress = "0x858d28E95676a5e6F9894796b58aAD7020BfbF14";
            await deployedContract.methods
                .transferPayment(vpnAddress, amountInWei)
                .send({ from: selectedAccount });

            statusMessage.textContent = "Pagamento enviado com sucesso!";
            statusMessage.style.color = "green";
        } catch (error) {
            console.error(error);
            statusMessage.textContent = "Erro durante o processo: " + error.message;
            statusMessage.style.color = "red";
        }
    });
});
