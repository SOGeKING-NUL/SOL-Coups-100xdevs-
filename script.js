const endpoint = "https://api.devnet.solana.com";
const solanaConnection = new solanaWeb3.Connection(endpoint);

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".page-1").style.display = "flex";
});

function goToPage2() {
  const email = document.getElementById("displayEmail").value;
  const paymentAmount = parseFloat(
    document.getElementById("output").dataset.totalAmount
  );
  const solAmount = parseFloat(
    document.getElementById("output").dataset.solAmount
  );
  const errorMessage = document.getElementById("errorMessage");

  errorMessage.textContent = "";

  if (email && !isNaN(paymentAmount)) {
    document.getElementById("displayEmailPage2").value = email;
    document.getElementById("paymentAmountPage2").value = paymentAmount;
    document.getElementById("solAmountPage2").value = solAmount;

    document.querySelector(".page-1").style.display = "none";
    document.querySelector(".page-2").style.display = "flex";
  } else {
    errorMessage.textContent = "Please enter a valid email and amount.";
  }
}

function goBack() {
  document.querySelector(".page-2").style.display = "none";
  document.querySelector(".page-1").style.display = "flex";
}

var email = "";

function saveEmail() {
  const Email = document.getElementById("email").value;
  email = Email;
  const errorEmail = document.getElementById("errorEmail");

  errorEmail.textContent = "";

  if (validateEmail(email)) {
    document.getElementById("displayEmail").value = email;
    document.querySelector(".final-email-holder").style.display = "none";
    document.querySelector(".inital-email-holder").style.display = "flex";
  } else {
    errorEmail.textContent = "Please enter a valid email.";
  }
}

function editEmail() {
  document.querySelector(".inital-email-holder").style.display = "none";
  document.querySelector(".final-email-holder").style.display = "flex";
  document.getElementById("email").value =
    document.getElementById("displayEmail").value;
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

async function fetchSolToInrRate() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=inr"
    );
    const data = await response.json();
    return data.solana.inr;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
}

var voucherAmount = 0;

async function checkPrize() {
  const amount = parseFloat(document.getElementById("voucherAmount").value);
  const rate = await fetchSolToInrRate();
  const output = document.getElementById("output");

  if (isNaN(amount) || amount < 50) {
    output.textContent = "Please enter an amount of at least ₹50";
    return;
  }

  if (amount > 10000) {
    output.textContent = "Voucher not available for amounts above ₹10,000.";
    return;
  }

  let feePercentage;
  if (amount <= 1000 && amount >= 50) {
    feePercentage = 0.15; // 15% fee
  } else if (amount <= 5000) {
    feePercentage = 0.09; // 9% fee
  } else if (amount <= 10000) {
    feePercentage = 0.03; // 3% fee
  }

  const voucher_amount = (amount / rate).toFixed(7);
  voucherAmount = voucher_amount;
  const fee = amount * feePercentage;
  const totalAmount = amount + fee;
  const solAmount = (totalAmount / rate).toFixed(7);

  output.textContent = `Total payable amount: ₹${totalAmount}`;
  output.dataset.totalAmount = totalAmount;
  output.dataset.solAmount = solAmount;
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".edit-button").addEventListener("click", editEmail);
  document.querySelector(".save-button").addEventListener("click", saveEmail);
});

async function validateWalletAddress() {
  const walletAddress = document.getElementById("senderWallet").value;
  let isValid = false;
  try {
    const publicKey = new solanaWeb3.PublicKey(walletAddress);
    isValid = solanaWeb3.PublicKey.isOnCurve(publicKey);
  } catch (error) {
    isValid = false;
  }

  if (isValid) {
    document.getElementById("validationResult").textContent = "Valid address";
    document.getElementById("validationResult").style.color = "green";
    return true;
  } else {
    document.getElementById("validationResult").textContent = "Invalid address";
    document.getElementById("validationResult").style.color = "red";
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTransactions(senderAddress, expectedAmount) {
  const senderPubKey = new solanaWeb3.PublicKey(senderAddress);
  const receiverAddress = "E1GvucNq72EiVPZoytdukF7F7Cg8RYk678Cp8mYJHg8F";

  let transactionList = await solanaConnection.getSignaturesForAddress(
    senderPubKey,
    { limit: 5 }
  );

  transactionList = transactionList.filter(
    (tx) => tx.confirmationStatus === "finalized"
  );

  if (transactionList.length === 0) {
    console.log("No finalized transactions found.");
    return false;
  }

  let signatureList = transactionList.map(
    (transaction) => transaction.signature
  );

  for (let signature of signatureList) {
    // Adding  delay to avoid rate-limiting
    await sleep(1);

    try {
      let transactionDetails = await solanaConnection.getParsedTransaction(
        signature
      );

      if (
        transactionDetails &&
        transactionDetails.transaction &&
        transactionDetails.transaction.message &&
        transactionDetails.transaction.message.accountKeys
      ) {
        const senderAddressInTx =
          transactionDetails.transaction.message.accountKeys[0].pubkey.toString();
        const instructions =
          transactionDetails.transaction.message.instructions;

        for (let instruction of instructions) {
          if (
            instruction.programId.toString() ===
            solanaWeb3.SystemProgram.programId.toString()
          ) {
            const parsedInfo = instruction.parsed.info;
            const amountSent = parsedInfo.lamports;
            const receiverAddressInTx = parsedInfo.destination;

            if (
              senderAddressInTx === senderAddress &&
              receiverAddressInTx === receiverAddress &&
              amountSent === expectedAmount * 1000000000
            ) {
              if (
                transactionDetails.meta &&
                transactionDetails.meta.err === null
              ) {
                console.log("Successful transaction");
                return true;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(
        `Error fetching transaction details for signature ${signature}:`,
        error
      );
    }
  }

  console.log("Failed transaction");
  return false;
}

var freezeTimer = false;

function startPeriodCheck(
  senderAddress,
  expectedAmount,
  interval = 5000 // checks after every 5 seconds
) {
  return new Promise((resolve) => {
    const checkTransactions = async () => {
      const paymentReceived = await getTransactions(
        senderAddress,
        expectedAmount
      );
      if (paymentReceived) {
        console.log("Payment confirmed!");
        resolve("Payment confirmed!");
        clearInterval(periodicCheck);
        clearTimeout(timeout);
        freezeTimer = true;
        sendEmail(email);
      }
    };

    const periodicCheck = setInterval(checkTransactions, interval);

    checkTransactions();

    timeout = setTimeout(() => {
      clearInterval(periodicCheck);
      console.log("Payment failed");
      resolve("Payment failed");
    }, 300000);
  });
}

async function goToPage3() {
  const isValid = await validateWalletAddress();
  if (isValid) {
    document.querySelector(".page-2").style.display = "none";
    document.querySelector(".page-3").style.display = "flex";

    const solAmount = document.getElementById("solAmountPage2").value;
    document.getElementById("solAmountDisplay").value = solAmount;

    startStopwatch();

    const senderAddress = document.getElementById("senderWallet").value;
    const expectedAmount = parseFloat(solAmount);

    const result = await startPeriodCheck(senderAddress, expectedAmount);

    const confirmationMessage = document.getElementById("confirmationMessage");

    if (result === "Payment confirmed!") {
      confirmationMessage.style.color = "green";
    } else if (result === "Payment failed") {
      confirmationMessage.textContent = "Sorry, Transaction didn't go through";
      confirmationMessage.style.color = "red";
    }
  }
}

function copyWalletAddress() {
  const walletAddressInput = document.getElementById("walletAddress");
  walletAddressInput.select();
  walletAddressInput.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand("copy");

  const copyButton = document.getElementById("copyButton");
  copyButton.textContent = "Copied!";
  copyButton.classList.add("copied");

  setTimeout(() => {
    copyButton.textContent = "Copy";
    copyButton.classList.remove("copied");
  }, 2000);
}

function startStopwatch() {
  const timerDisplay = document.getElementById("timer");
  let timeLeft = 300;

  const timer = setInterval(() => {
    if (freezeTimer) {
      timerDisplay.textContent = "Payment Successful!";
      return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timer);
      timerDisplay.textContent = "Time's up!";
    }
  }, 1000);
}

function copyWalletAddress() {
  const walletAddressInput = document.getElementById("walletAddress");
  walletAddressInput.select();
  walletAddressInput.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand("copy");

  const copyButton = document.getElementById("copyButton");
  copyButton.textContent = "Copied!";
  copyButton.classList.add("copied");

  setTimeout(() => {
    copyButton.textContent = "Copy";
    copyButton.classList.remove("copied");
  }, 2000);
}

function copySolAmount() {
  const solAmountInput = document.getElementById("solAmountDisplay");
  solAmountInput.select();
  solAmountInput.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand("copy");

  const copyButton = document.getElementById("copySolAmountButton");
  copyButton.textContent = "Copied!";
  copyButton.classList.add("copied");

  setTimeout(() => {
    copyButton.textContent = "Copy";
    copyButton.classList.remove("copied");
  }, 2000);
}

function generate_voucher() {
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  function getRandomCharacters(length, characterSet) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characterSet.charAt(
        Math.floor(Math.random() * characterSet.length)
      );
    }
    return result;
  }

  const part1 = getRandomCharacters(4, alphabets);
  const part2 = getRandomCharacters(4, numbers);
  const part3 = getRandomCharacters(4, numbers);

  const voucher = `${part1}-${part2}-${part3}`;
  return voucher;
}

function sendEmail(userEmail) {
  const voucherCode = generate_voucher();
  console.log("Sending email to:", userEmail);
  console.log("Using voucher code:", voucherCode);

  emailjs
    .send("service_o1gdu2l", "template_74b26u7", {
      voucher_code: voucherCode,
      to_email: userEmail,
    })
    .then(
      function (response) {
        confirmationMessage.textContent = "Voucher sent over mail";
      },
      function (error) {
        confirmationMessage.textContent = `Failed to mail because of ${error}`;
      }
    );
}
