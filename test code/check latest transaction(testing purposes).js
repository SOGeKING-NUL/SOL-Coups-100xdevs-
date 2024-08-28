const solanaWeb3 = require('@solana/web3.js');
const DepositAddress = 'E1GvucNq72EiVPZoytdukF7F7Cg8RYk678Cp8mYJHg8F';
const endpoint = 'https://api.devnet.solana.com';
const solanaConnection = new solanaWeb3.Connection(endpoint);

const getTransactions = async (address, numTx) => {
    const pubKey = new solanaWeb3.PublicKey(address);
    let transactionList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: numTx });
    
    
    let signatureList = transactionList.map(transaction => transaction.signature);
    let transactionDetails = await solanaConnection.getParsedTransactions(signatureList);

    
    if (transactionDetails && transactionDetails.length > 0) {
        transactionDetails.forEach(tx => {
            if (tx && tx.transaction && tx.transaction.message && tx.transaction.message.accountKeys) {
                // The sender is usually the first account in the accountKeys array
                const senderAddress = tx.transaction.message.accountKeys[0].pubkey.toString();
                console.log(`Sender's Wallet Address: ${senderAddress}`);

                const instructions = tx.transaction.message.instructions;
                instructions.forEach(instruction => {
                    if (instruction.programId.toString() === solanaWeb3.SystemProgram.programId.toString()) {
                        // Check if it's a transfer instruction
                        const data = instruction.parsed.info.lamports;
                        console.log(`Sent ammount is: ${data/1000000000}`); //since 1 SOL =1,000,000,000 lamports

                    }   
                });  
              
            }
        });
    } else {
        console.log('No transaction details found.');
    }
};

getTransactions(DepositAddress, 1);
