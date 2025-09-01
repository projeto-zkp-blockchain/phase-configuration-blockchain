document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("accountSelect");
    const connectWalletButton = document.getElementById("connectWallet");
    const deployContractButton = document.getElementById("deployContract");
    const statusMessage = document.getElementById("statusMessage");

    let selectedAccount = null;
    let deployedContract = null;

    function formatBrazilianDate(data) {
        return data.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo', // Brazilian time zone
            hour12: false // 24-hour format
        });
    }

    // Function to download the JSON file
    function baixarJSON(info_user) {
        const jsonString = JSON.stringify(info_user, null, 2);  // Convert the object to JSON string
        const blob = new Blob([jsonString], { type: "application/json" });  // Create a Blob with MIME type 'application/json'
        const link = document.createElement("a");  // Create a link element
        link.href = URL.createObjectURL(blob);  // Create a URL for the Blob
        link.download = "info_user.json";  // Set the name of the file to be downloaded
        link.click();  // Simulate a click on the link to start the download
    }

    // Generates a cryptographic key pair (private and public) using the secp256k1 elliptic curve
    function gerarChaves() {
        function gerarChaves() {
            // Check if the library was loaded correctly
            if (typeof elliptic === 'undefined') {
                console.error("The elliptic library was not loaded correctly.");
                return null;
            }
            // Create the elliptic key generator with the secp256k1 curve
            const EC = elliptic.ec;
            const ec = new EC('secp256k1'); // Using the secp256k1 curve
            // Generate the key pair
            const chave = ec.genKeyPair();
            // Get the private key in hexadecimal format
            const chavePrivada = chave.getPrivate('hex');
            // Get the public key as integer coordinates
            const pontoPublico = chave.getPublic(); // Public point object
            const x = pontoPublico.getX().toString(); // X coordinate
            const y = pontoPublico.getY().toString(); // Y coordinate
            // Return the keys as an object
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

        // Create the elliptic key generator with the secp256k1 curve
        const EC = elliptic.ec;
        const ec = new EC('secp256k1'); // Usando a curva secp256k1

        // Generate the key pair
        const chave = ec.genKeyPair();

        // Get the private key in hexadecimal format
        const chavePrivada = chave.getPrivate('hex');

        // Get the public key as integer coordinates
        const pontoPublico = chave.getPublic(); // Public point object
        const x = pontoPublico.getX().toString(); // X coordinate
        const y = pontoPublico.getY().toString(); // Y coordinate

        // Return the keys as an object
        return {
            chavePrivada: chavePrivada,
            chavePublicaX: x,
            chavePublicaY: y
        };
    }


    // Function to display the message with proper styling
    function showStatusMessage(message, type = "info") {
        // Clear previous messages
        statusMessage.classList.add("hidden");
        setTimeout(() => {
            statusMessage.classList.remove("hidden");
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}-message`;
        }, 500);  // Time for the previous message to disappear before showing the new one
    }

    connectWalletButton.addEventListener("click", async () => {
        if (typeof window.ethereum !== "undefined") {
            const web3 = new Web3(window.ethereum);

            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();

                accountSelect.innerHTML = "<option value=''>Select an account</option>";
                accounts.forEach((account, index) => {
                    const option = document.createElement("option");
                    option.value = account;
                    option.textContent = `Account ${index + 1}: ${account}`;
                    accountSelect.appendChild(option);
                });

                showStatusMessage("Wallet connected. Select an account.", "success");
            } catch (error) {
                console.error(error);
                showStatusMessage("Error connecting to wallet: " + error.message, "error");
            }
        } else {
            showStatusMessage("MetaMask not found. Please install the extension to continue.", "error");
        }
    });

    accountSelect.addEventListener("change", (event) => {
        selectedAccount = event.target.value;
        if (selectedAccount) {
            showStatusMessage(`Selected account: ${selectedAccount}`, "info");
            deployContractButton.disabled = false;
        }
    });

    // Function to get the ETH price in USD from your API
    async function getETHPriceAndTimestamp() {
        try {
            const response = await fetch('http://127.0.0.1:5001/price-eth-usd'); // URL to query ETH in USD
            const data = await response.json();
            return {
                ethPriceUSD: data.eth_price_usd,
                timestamp: data.timestamp
            }; // Returns the Ethereum price in USD
        } catch (error) {
            console.error("Error fetching the ETH price:", error);
            return null; // Returns null in case of error
        }
    }

    // Function to calculate the Ether amount equivalent to a value in USD
    async function getAmountInEther(amountInUSD) {
        const ethPriceUSD = await getETHPriceAndTimestamp(); // Function to get the Ethereum price in USD
        if (ethPriceUSD !== null) {
            const amountInEther = amountInUSD / ethPriceUSD.ethPriceUSD; // Calculate the equivalent amount in Ether
            return amountInEther.toFixed(4); // Return with 4 decimal places
        } else {
            // If unable to get the price, return the default value of 0.001 ETH
            console.log("Could not retrieve the ETH price. Using default value of 0.001 ETH.");
            return "0.001"; // Default value
        }
    }


    const contractInfo = document.createElement("p");
    document.querySelector(".container").appendChild(contractInfo);

    deployContractButton.addEventListener("click", async () => {
        if (!selectedAccount) {
            showStatusMessage("Please select an account.", "error");
            return;
        }

        try {
            // Loading ABI and Bytecode
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

            // Deploying the contract
            showStatusMessage("Deploying the contract...", "waiting");

            const gasEstimate = await deployTransaction.estimateGas({ from: selectedAccount });

            let envioDeploy, fimDeploy, tempoDeploy;
            let executionTimes;

            deployedContract = await deployTransaction.send({
                from: selectedAccount,
                gas: gasEstimate,
            })
                .on('transactionHash', (hash) => {
                    console.log("Transaction sent, awaiting mining...", hash);
                    envioDeploy = performance.now(); // Exact time of sending
                })
                .once('receipt', async (receipt) => {
                    fimDeploy = performance.now(); // Confirmation time
                    tempoDeploy = ((fimDeploy - envioDeploy) / 1000).toFixed(4) + " s"; // In seconds

                    executionTimes = JSON.parse(localStorage.getItem(`times_${receipt.contractAddress}`)) || {};

                    executionTimes["1 - Contract Deploy Time"] = tempoDeploy;
                    console.log("Actual deploy time:", tempoDeploy);

                    // Calculation of gas used and fee in ETH
                    const gasUsed = receipt.gasUsed;
                    const gasPrice = receipt.effectiveGasPrice;
                    const gasFee = BigInt(gasUsed) * BigInt(gasPrice); // Calculation of total gas cost
                    const gasFeeInETH = Number(gasFee) / 1e18; // Converting from wei to ETH

                    console.log("Total Gas Cost (ETH):", gasFeeInETH);

                    // Get the current ETH price in USD from your route
                    const ethPriceUSDandData = await getETHPriceAndTimestamp();
                    let gasFeeInUSD = null;
                    if (ethPriceUSDandData !== null) {
                        gasFeeInUSD = gasFeeInETH * ethPriceUSDandData.ethPriceUSD; // Convert gas from ETH to USD
                        console.log(`Gas cost in USD: $${gasFeeInUSD.toFixed(2)}`);
                        console.log(`Current Ethereum price: $${ethPriceUSDandData.ethPriceUSD.toFixed(2)} USD`);
                    } else {
                        console.log("Could not retrieve the ETH price.");
                    }

                    // Ethereum price (in USD)
                    const ethPrice = ethPriceUSDandData.ethPriceUSD !== null ? ethPriceUSDandData.ethPriceUSD.toFixed(2) : "Unavailable";

                    // Fill the executionTimes object with time and other information
                    executionTimes["1.1 Total Gas Cost (ETH)"] = gasFeeInETH.toString();
                    executionTimes["1.2 Total Gas Cost (USD)"] = gasFeeInUSD !== null ? gasFeeInUSD.toFixed(2) : "Unavailable";
                    executionTimes["1.3 Current Ethereum Price (USD)"] = ethPrice;
                    executionTimes["1.4 Execution Date"] = ethPriceUSDandData.timestamp; // Usando a data do JSON para formatar

                    // Display the values in the console
                    console.log("1.1 Total Gas Cost (ETH)", executionTimes["1.1 Total Gas Cost (ETH)"]);
                    console.log("1.2 Total Gas Cost (USD)", executionTimes["1.2 Total Gas Cost (USD)"]);
                    console.log("1.3 Current Ethereum Price (USD)", executionTimes["1.3 Current Ethereum Price (USD)"]);
                    console.log("1.4 Execution Date", executionTimes["1.4 Execution Date"]);

                    // Save in localStorage with the contract address
                    localStorage.setItem(`times_${receipt.contractAddress}`, JSON.stringify(executionTimes));

                    //showStatusMessage("Contrato implantado com sucesso!", "success");

                    contractInfo.innerHTML = `<strong>Contract address:</strong> ${receipt.contractAddress}<br>`;

                });
            // Sending funds to the contract
            showStatusMessage("Sending payment funds to the contract...", "waiting");

            const amountInEther = await getAmountInEther(20);

            contractInfo.innerHTML += `<br>💬 $20 (${amountInEther} ETH) will be sent to the contract!<br>`;

            const amountInWei = web3.utils.toWei(amountInEther, "ether");

            let envioPagamentoContrato, fimPagamentoContrato, tempoPagamentoContrato;

            await web3.eth.sendTransaction({
                from: selectedAccount,
                to: deployedContract.options.address,
                value: amountInWei,
            })
                .on('transactionHash', (hash) => {
                    console.log("Transaction sent, awaiting mining...", hash);
                    envioPagamentoContrato = performance.now();
                })
                .once('receipt', async (receipt) => {
                    fimPagamentoContrato = performance.now();
                    tempoPagamentoContrato = ((fimPagamentoContrato - envioPagamentoContrato) / 1000).toFixed(4) + " s";

                    executionTimes["2 - Transaction Time to Contract"] = tempoPagamentoContrato;
                    console.log("Actual transaction time to the contract:", tempoPagamentoContrato);

                    // Calculation of gas used and fee in ETH
                    const gasUsed = receipt.gasUsed;
                    const gasPrice = receipt.effectiveGasPrice;
                    const gasFee = BigInt(gasUsed) * BigInt(gasPrice); // Calculation of the total gas cost
                    const gasFeeInETH = Number(gasFee) / 1e18; // Converting from wei to ETH

                    console.log("Total Gas Cost (ETH):", gasFeeInETH);

                    // Get the current ETH price in USD
                    const ethPriceUSDandData = await getETHPriceAndTimestamp();
                    let gasFeeInUSD = null;
                    if (ethPriceUSDandData !== null) {
                        gasFeeInUSD = gasFeeInETH * ethPriceUSDandData.ethPriceUSD; // Convert gas from ETH to USD
                        console.log(`Gas cost in USD: $${gasFeeInUSD.toFixed(2)}`);
                        console.log(`Current Ethereum price: $${ethPriceUSDandData.ethPriceUSD.toFixed(2)} USD`);
                    } else {
                        console.log("Could not retrieve the ETH price.");
                    }

                    // Ethereum price (in USD)
                    const ethPrice = ethPriceUSDandData !== null ? ethPriceUSDandData.ethPriceUSD.toFixed(2) : "Unavailable";

                    // Fill the executionTimes object with time and other information
                    executionTimes["2.1 Total Gas Cost (ETH)"] = gasFeeInETH.toString();
                    executionTimes["2.2 Total Gas Cost (USD)"] = gasFeeInUSD !== null ? gasFeeInUSD.toFixed(2) : "Unavailable";
                    executionTimes["2.3 Current Ethereum Price (USD)"] = ethPrice;
                    executionTimes["2.4 Execution Date"] = ethPriceUSDandData.timestamp; // Using the date from the JSON to format

                    // Display the values in the console
                    console.log("2.1 Total Gas Cost (ETH)", executionTimes["2.1 Total Gas Cost (ETH)"]);
                    console.log("2.2 Total Gas Cost (USD)", executionTimes["2.2 Total Gas Cost (USD)"]);
                    console.log("2.3 Current Ethereum Price (USD)", executionTimes["2.3 Current Ethereum Price (USD)"]);
                    console.log("2.4 Execution Date", executionTimes["2.4 Execution Date"]);

                    // Save in localStorage with the contract address
                    localStorage.setItem(`times_${deployedContract.options.address}`, JSON.stringify(executionTimes));

                });

            // Sending payment to VPN
            showStatusMessage("Sending contract payment to the VPN...", "waiting");
            const vpnAddress = "0xdCcEEd9A4b102093bB0eC1e81a0969d9BB6b55a2";

            let envioVPN, fimVPN, tempoVPN;

            const tx = await deployedContract.methods
                .transferPayment(vpnAddress, amountInWei)
                .send({ from: selectedAccount })
                .on('transactionHash', (hash) => {
                    console.log("Transaction to VPN sent, awaiting mining...", hash);
                    envioVPN = performance.now(); // Marks the moment the transaction is sent
                })
                .once('receipt', async (receipt) => {

                    fimVPN = performance.now(); // Marks the moment the transaction is confirmed
                    tempoVPN = ((fimVPN - envioVPN) / 1000).toFixed(4) + " s"; // Calculates the transaction time in seconds

                    // Calculation of gas used and fee in ETH
                    const gasUsed = receipt.gasUsed;
                    const gasPrice = receipt.effectiveGasPrice;
                    const gasFee = BigInt(gasUsed) * BigInt(gasPrice); // Calculation of total gas cost in wei
                    const gasFeeInETH = Number(gasFee) / 1e18; // Converting from wei to ETH

                    console.log("Total Gas Cost (ETH):", gasFeeInETH);

                    // Get the current ETH price in USD
                    const ethPriceUSDandData = await getETHPriceAndTimestamp();
                    let gasFeeInUSD = null;
                    if (ethPriceUSDandData !== null) {
                        gasFeeInUSD = gasFeeInETH * ethPriceUSDandData.ethPriceUSD; // Convert gas from ETH to USD
                        console.log(`Gas cost in USD: $${gasFeeInUSD.toFixed(2)}`);
                        console.log(`Current Ethereum price: $${ethPriceUSDandData.ethPriceUSD.toFixed(2)} USD`);
                    } else {
                        console.log("Could not retrieve the ETH price.");
                    }

                    // Ethereum price (in USD)
                    const ethPrice = ethPriceUSDandData !== null ? ethPriceUSDandData.ethPriceUSD.toFixed(2) : "Unavailable";

                    // Fill the executionTimes object with time and other information
                    executionTimes["3 - Contract Transaction Time to VPN"] = tempoVPN;
                    executionTimes["3.1 Total Gas Cost (ETH)"] = gasFeeInETH.toString(); // Display with all decimal places
                    executionTimes["3.2 Total Gas Cost (USD)"] = gasFeeInUSD !== null ? gasFeeInUSD.toFixed(2) : "Unavailable";
                    executionTimes["3.3 Current Ethereum Price (USD)"] = ethPrice;
                    executionTimes["3.4 Execution Date"] = formatBrazilianDate(new Date()); // Storing the date in Brazilian format

                    // Display the values in the console
                    console.log("3 - Contract Transaction Time to VPN", executionTimes["3 - Contract Transaction Time to VPN"]);
                    console.log("3.1 Total Gas Cost (ETH)", executionTimes["3.1 Total Gas Cost (ETH)"]);
                    console.log("3.2 Total Gas Cost (USD)", executionTimes["3.2 Total Gas Cost (USD)"]);
                    console.log("3.3 Current Ethereum Price (USD)", executionTimes["3.3 Current Ethereum Price (USD)"]);
                    console.log("3.4 Execution Date", executionTimes["3.4 Execution Date"]);

                    // Save to localStorage
                    localStorage.setItem(`times_${deployedContract.options.address}`, JSON.stringify(executionTimes));

                    showStatusMessage("Payment sent successfully!", "success");
                });

            //console.log("Transaction confirmed:", tx);


            // Measuring the time to obtain the receiptCode
            let inicioReceiptCode = performance.now();
            const receiptCode = await deployedContract.methods.getReceiptCode().call({ from: selectedAccount });
            let fimReceiptCode = performance.now();
            let tempoReceiptCode = ((fimReceiptCode - inicioReceiptCode) / 1000).toFixed(4) + " s";

            executionTimes["4 - ReceiptCode Retrieval Time"] = tempoReceiptCode;
            console.log("Actual ReceiptCode Retrieval Time:", tempoReceiptCode);
            localStorage.setItem(`times_${deployedContract.options.address}`, JSON.stringify(executionTimes));

            console.log("ReceiptCode:", receiptCode);

            // Measuring the key generation time
            let inicioGeracaoChaves = performance.now();
            const chaves = gerarChaves();
            let fimGeracaoChaves = performance.now();
            let tempoGeracaoChaves = ((fimGeracaoChaves - inicioGeracaoChaves) / 1000).toFixed(4) + " s";

            executionTimes["5 - Key Generation Time"] = tempoGeracaoChaves;
            console.log("Actual Key Generation Time:", tempoGeracaoChaves);
            localStorage.setItem(`times_${deployedContract.options.address}`, JSON.stringify(executionTimes));

            if (chaves) {
                console.log("Private Key (hex):", chaves.chavePrivada);
                console.log("Public Key X:", chaves.chavePublicaX);
                console.log("Public Key Y:", chaves.chavePublicaY);
            }

            const url = "http://127.0.0.1:5000/verify-payment";

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

                    executionTimes["6 - Payment Verification Time"] = tempoVerificacaoPagamento;
                    console.log("Actual Payment Verification Time:", tempoVerificacaoPagamento);
                    localStorage.setItem(`times_${deployedContract.options.address}`, JSON.stringify(executionTimes));

                    //console.log("Resposta do servidor:", result);

                    if (!result) {
                        console.log("❌ Payment not found.");
                    } else {

                        contractInfo.innerHTML += `<br>✅ Payment successfully verified!<br>`;
                        //showStatusMessage("✅ Payment successfully verified!", "success");

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

                        //console.log("User information:", info_user);

                        baixarJSON(info_user); // Downloads the user's data as JSON

                        contractInfo.innerHTML += `<br>✅ Authentication information downloaded!<br>`;
                        //showStatusMessage("✅ Authentication information downloaded!", "success");
                    }
                })
                .catch(error => {
                    console.error("Error sending request:", error);
                });

        } catch (error) {
            console.error(error);
            showStatusMessage("Error during the process: " + error.message, "error");
        }
    });



});