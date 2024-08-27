  
  const endpoint = 'https://api.devnet.solana.com';
  const solanaConnection = new solanaWeb3.Connection(endpoint);
  
  document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('.page-1').style.display = 'flex';
  });

  function goToPage2() {
  const email = document.getElementById('displayEmail').value;
  const paymentAmount = document.getElementById('output').dataset.totalAmount;
  const solAmount = document.getElementById('output').dataset.solAmount;

  document.getElementById('displayEmailPage2').value = email;
  document.getElementById('paymentAmountPage2').value = paymentAmount;
  document.getElementById('solAmountPage2').value = solAmount;

  document.querySelector('.page-1').style.display = 'none';
  document.querySelector('.page-2').style.display = 'flex';
  }

  function goBack() {
  document.querySelector('.page-2').style.display = 'none';
  document.querySelector('.page-1').style.display = 'flex';
  }

  function saveEmail() {
  const email = document.getElementById('email').value;
  if (validateEmail(email)) {
      document.getElementById('displayEmail').value = email;
      document.querySelector('.final-email-holder').style.display = 'none';
      document.querySelector('.inital-email-holder').style.display = 'flex';
  } else {
      alert('Please enter a valid email address.');
  }
  }

  function editEmail() {
  document.querySelector('.inital-email-holder').style.display = 'none';
  document.querySelector('.final-email-holder').style.display = 'flex';
  document.getElementById('email').value = document.getElementById('displayEmail').value;
  }

  function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
  }

  async function fetchSolToInrRate() {
  try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=inr');
      const data = await response.json();
      return data.solana.inr;
  } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return null;
  }
  }

  async function checkPrize() {
  const amount = parseFloat(document.getElementById('voucherAmount').value);
  const rate = await fetchSolToInrRate();
  const output = document.getElementById('output');

  if (isNaN(amount) || amount < 50) {
      output.textContent = 'Please enter an amount of at least ₹50';
      return;
  }

  if (amount > 10000) {
      output.textContent = 'Voucher not available for amounts above ₹10,000.';
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

  const fee = amount * feePercentage;
  const totalAmount = amount + fee;
  const solAmount = totalAmount / rate;

  output.textContent = `Total payable amount: ₹${totalAmount}`;
  output.dataset.totalAmount = totalAmount;
  output.dataset.solAmount = solAmount;
  }

  function continuePayment() {
  // Handle the continuation of payment process
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.edit-button').addEventListener('click', editEmail);
  document.querySelector('.save-button').addEventListener('click', saveEmail);
  });

  function validateWalletAddress() {
    const walletAddress =document.getElementById('senderWallet').value.trim();
    const validationResult = document.getElementById('validationResult');

    try {
        // Initialize the Solana PublicKey object
        const publicKey = new solanaWeb3.PublicKey(walletAddress);
        
        // Check if the address is valid by verifying its length
        if (publicKey.toBase58().length === 44) {
            validationResult.textContent = 'Valid address';
            validationResult.className = 'valid-address';
        } else {
            throw new Error('Invalid address');
        }
    } catch (error) {
        validationResult.textContent = 'invalid address';
        validationResult.className = 'invalid-address';
    }
}


  