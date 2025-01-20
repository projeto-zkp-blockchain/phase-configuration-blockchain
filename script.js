document.addEventListener("DOMContentLoaded", () => {
    const deployButton = document.getElementById("deployButton");
    const statusMessage = document.getElementById("statusMessage");
    const contractAddress = document.getElementById("contractAddress");

    deployButton.addEventListener("click", async () => {
        const bytecode = document.getElementById("bytecode").value.trim();
        const abi = document.getElementById("abi").value.trim();

        if (!bytecode || !abi) {
            statusMessage.textContent = "Por favor, insira o Bytecode e o ABI do contrato!";
            statusMessage.style.color = "red";
            return;
        }

        if (typeof window.ethereum !== "undefined") {
            const web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();
                const deployerAccount = accounts[0];

                statusMessage.textContent = "Conectado à conta: " + deployerAccount;
                statusMessage.style.color = "green";

                const contract = new web3.eth.Contract(JSON.parse(abi));
                const deployTransaction = contract.deploy({ data: bytecode });

                statusMessage.textContent = "Estimando custo do gas...";
                const gasEstimate = await deployTransaction.estimateGas({ from: deployerAccount });

                statusMessage.textContent = "Fazendo deploy do contrato...";
                const deployedContract = await deployTransaction.send({
                    from: deployerAccount,
                    gas: gasEstimate,
                });

                statusMessage.textContent = "Contrato implantado com sucesso!";
                contractAddress.textContent = "Endereço do contrato: " + deployedContract.options.address;
                contractAddress.style.color = "blue";
            } catch (error) {
                console.error(error);
                statusMessage.textContent = "Erro ao fazer o deploy: " + error.message;
                statusMessage.style.color = "red";
            }
        } else {
            statusMessage.textContent = "MetaMask não encontrada. Instale a extensão para continuar.";
            statusMessage.style.color = "red";
        }
    });
});
