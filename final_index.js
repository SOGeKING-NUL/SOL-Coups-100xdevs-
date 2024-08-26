const solanaWeb3 = require('@solana/web3.js');
const searchAddress = 'Fseqb4QxdhFsqBT9G4k5tQiTr5rp9yFtooaXy4wbXLDZ';
const endpoint = 'https://api.devnet.solana.com';
const solanaConnection = new solanaWeb3.Connection(endpoint);
const expectedAmount = 5000000000; // Amount you expect to be sent, in lamports (1 SOL = 1,000,000,000 lamports)

const getTransactions = async (address, numTx) => {
    const pubKey = new solanaWeb3.PublicKey(address);
    let transactionList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: numTx });
    
    // Filter only finalized transactions
    transactionList = transactionList.filter(tx => tx.confirmationStatus === 'finalized');

    if (transactionList.length === 0) {
        console.log('No finalized transactions found.');
        return;
    }
    
    let signatureList = transactionList.map(transaction => transaction.signature);
    let transactionDetails = await solanaConnection.getParsedTransactions(signatureList);

    transactionDetails.forEach(tx => {
        if (tx && tx.transaction && tx.transaction.message && tx.transaction.message.accountKeys) {
            const senderAddress = tx.transaction.message.accountKeys[0].pubkey.toString();
            const instructions = tx.transaction.message.instructions;
            let amountSent = 0;
            let matchFound = false;

            // Iterate through instructions to find transfer instructions
            instructions.forEach(instruction => {
                if (instruction.programId.toString() === solanaWeb3.SystemProgram.programId.toString()) {
                    // Check if it's a transfer instruction
                    const data = instruction.parsed.info.lamports; // Amount transferred in lamports
                    if (instruction.parsed.info.source === senderAddress) {
                        amountSent = data;
                        if (amountSent === expectedAmount) {
                            matchFound = true;
                        }
                    }
                }
            });

            if (matchFound && tx.meta && tx.meta.err === null) {
                console.log('Successful transaction');
            } else {
                console.log('Failed transaction');
            }
        }
    });
};

getTransactions(searchAddress, 1);
