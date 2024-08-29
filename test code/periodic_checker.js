const solanaWeb3 = require('@solana/web3.js');

// Define your receiver address here
const endpoint = 'https://api.devnet.solana.com';
const solanaConnection = new solanaWeb3.Connection(endpoint);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getTransactions(senderAddress, expectedAmount) {
    const senderPubKey = new solanaWeb3.PublicKey(senderAddress);
    const receiverAddress = 'E1GvucNq72EiVPZoytdukF7F7Cg8RYk678Cp8mYJHg8F';

    let transactionList = await solanaConnection.getSignaturesForAddress(senderPubKey, { limit: 5 });

    // Filter only finalized transactions
    transactionList = transactionList.filter(tx => tx.confirmationStatus === 'finalized');

    if (transactionList.length === 0) {
        console.log('No finalized transactions found.');
        return false;
    }

    let signatureList = transactionList.map(transaction => transaction.signature);

    for (let signature of signatureList) {
        // Adding delay to avoid rate-limiting
        await sleep(1);

        try {
            let transactionDetails = await solanaConnection.getParsedTransaction(signature);

            if (transactionDetails && transactionDetails.transaction && transactionDetails.transaction.message && transactionDetails.transaction.message.accountKeys) {
                const senderAddressInTx = transactionDetails.transaction.message.accountKeys[0].pubkey.toString();
                const instructions = transactionDetails.transaction.message.instructions;

                for (let instruction of instructions) {
                    if (instruction.programId.toString() === solanaWeb3.SystemProgram.programId.toString()) {
                        const parsedInfo = instruction.parsed.info;
                        const amountSent = parsedInfo.lamports;
                        const receiverAddressInTx = parsedInfo.destination;

                        if (senderAddressInTx === senderAddress && receiverAddressInTx === receiverAddress && amountSent === (expectedAmount * 1000000000)) {
                            if (transactionDetails.meta && transactionDetails.meta.err === null) {
                                console.log('Successful transaction');
                                return true; // Stop after finding the latest successful transaction
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching transaction details for signature ${signature}:`, error);
        }
    }

    console.log('Failed transaction');
    return false;
}

function startPeriodCheck(senderAddress, expectedAmount, interval = 10000) {
    return new Promise((resolve) => {
        const checkTransactions = async () => {
            const paymentReceived = await getTransactions(senderAddress, expectedAmount);
            if (paymentReceived) {
                console.log('Payment confirmed!');
                resolve('Payment confirmed!');
                clearInterval(periodicCheck);
                clearTimeout(timeout);
            }
        };

        const periodicCheck = setInterval(checkTransactions, interval);

        // Start the first check immediately
        checkTransactions();

        // Set a timeout to stop checking after 5 minutes
        timeout= setTimeout(() => {
            clearInterval(periodicCheck);
            console.log('Payment failed');
            resolve('Payment failed');
        }, 300000); // 5 minutes in milliseconds
    });
}

startPeriodCheck('Fseqb4QxdhFsqBT9G4k5tQiTr5rp9yFtooaXy4wbXLDZ', 10);

// Export the function for use
//module.exports = { startPeriodCheck };
