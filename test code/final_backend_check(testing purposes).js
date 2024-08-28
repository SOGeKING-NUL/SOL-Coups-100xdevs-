const solanaWeb3 = require('@solana/web3.js');
const searchSenderAddress = 'Fseqb4QxdhFsqBT9G4k5tQiTr5rp9yFtooaXy4wbXLDZ';
const searchReceiverAddress = 'E1GvucNq72EiVPZoytdukF7F7Cg8RYk678Cp8mYJHg8F';
const endpoint = 'https://api.devnet.solana.com';
const solanaConnection = new solanaWeb3.Connection(endpoint);
const expectedAmount = 3000000000; // Amount you expect to be sent, in lamports (1 SOL = 1,000,000,000 lamports)
const txnLimit = 5; // Limit the number of transactions to check

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const getTransactions = async (senderAddress, receiverAddress, numTx) => {
    const senderPubKey = new solanaWeb3.PublicKey(senderAddress);
    const receiverPubKey = new solanaWeb3.PublicKey(receiverAddress);

    let transactionList = await solanaConnection.getSignaturesForAddress(senderPubKey, { limit: numTx });

    // Filter only finalized transactions
    transactionList = transactionList.filter(tx => tx.confirmationStatus === 'finalized');

    if (transactionList.length === 0) {
        console.log('No finalized transactions found.');
        return;
    }

    let signatureList = transactionList.map(transaction => transaction.signature);

    let successfulTransactionFound = false;

    for (let signature of signatureList) {
        // Adding delay to avoid rate-limiting
        await sleep(1);

        try {
            let transactionDetails = await solanaConnection.getParsedTransaction(signature);

            if (transactionDetails && transactionDetails.transaction && transactionDetails.transaction.message && transactionDetails.transaction.message.accountKeys) {
                const senderAddressInTx = transactionDetails.transaction.message.accountKeys[0].pubkey.toString();
                const instructions = transactionDetails.transaction.message.instructions;

                let matchFound = false;

                for (let instruction of instructions) {
                    if (instruction.programId.toString() === solanaWeb3.SystemProgram.programId.toString()) {
                        const parsedInfo = instruction.parsed.info;
                        const amountSent = parsedInfo.lamports;
                        const receiverAddressInTx = parsedInfo.destination;

                        if (senderAddressInTx === senderAddress && receiverAddressInTx === receiverAddress && amountSent === expectedAmount) {
                            matchFound = true;
                            break;
                        }
                    }
                }

                if (matchFound && transactionDetails.meta && transactionDetails.meta.err === null) {
                    successfulTransactionFound = true;
                    console.log('Successful transaction');
                    break; // Stop after finding the latest successful transaction
                }
            }
        } catch (error) {
            console.error(`Error fetching transaction details for signature ${signature}:`, error);
        }
    }

    if (!successfulTransactionFound) {
        console.log('Failed transaction');
    }
};

getTransactions(searchSenderAddress, searchReceiverAddress, txnLimit);
