import axios from 'https://cdn.skypack.dev/axios';

// Get the modal
const modal = document.getElementById("paymentModal");

// Get the button that opens the modal
const booknowBTN = document.getElementById("booknow-btn");

// Get the <span> element that closes the modal
const span = document.getElementsByClassName("close")[0];

// Get the payment buttons
const zalopayBtn = document.getElementById("zalopayBtn");
const momoBtn = document.getElementById("momoBtn");
const totalDiscount = document.getElementById('total-discount');
const finalPrice = document.getElementById('final-price');

// Get the customer data
const customerDataElement = document.getElementById('customer-data');
const CustomerData = JSON.parse(decodeURIComponent(customerDataElement.dataset.customer));

// Get voucher data
const vouchersContainer = document.getElementById('vouchers');
const rawVoucherInfo = decodeURIComponent(vouchersContainer.dataset.voucherInfo);
const voucherData = JSON.parse(rawVoucherInfo);
const voucherCode = document.getElementById('voucher-input').value;
const voucher = voucherData.find(v => v.voucherName === voucherCode);

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

zalopayBtn.onclick = function() {
    const voucher_ID = voucher ? voucher._id : '';
    const selectedTicketsArray = JSON.parse(localStorage.getItem('selectedTickets') || '[]');

    const zalopayDetail = {
        method: 'zalopay',
        totalprice: selectedTicketsArray.reduce((total, ticket) => total + ticket.price * ticket.quantity, 0),
        selectedTicketsArray,
        customerID: CustomerData._id,
        voucherID: voucher_ID,
        discount: parseInt(totalDiscount.textContent.slice(1, -1).replaceAll(',', '')) || 0,
        finalprice: finalPrice.textContent.slice(0, -1).replaceAll(',', ''),
    }

    // Call payment API for zalopay
    axios.post('/api/v1/payment', { zalopayDetail }, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        console.log('ZaloPay Payment Successful:', response.data);
        window.open(response.data);
        modal.style.display = "none";
    })
    .catch(error => {
        console.error('ZaloPay Payment Error:', error);
        alert('Lỗi xảy ra trong quá trình giao dịch ZaloPay');
    });
}

momoBtn.onclick = function() {
    const voucher_ID = voucher ? voucher._id : '';
    const selectedTicketsArray = JSON.parse(localStorage.getItem('selectedTickets') || '[]');
    const momoDetail = {
        method: 'momo',
        totalprice: selectedTicketsArray.reduce((total, ticket) => total + ticket.price * ticket.quantity, 0),
        selectedTicketsArray,
        customerID: CustomerData._id,
        voucherID: voucher_ID,
        discount: parseInt(totalDiscount.textContent.slice(1, -1).replaceAll(',', '')) || 0,
        finalprice: finalPrice.textContent.slice(0, -1).replaceAll(',', ''),
    }

    // Call payment API for momo
    axios.post('/api/v1/payment', { momoDetail }, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        console.log('Momo Payment Successful:', response.data);
        window.open(response.data);
        modal.style.display = "none";
    })
    .catch(error => {
        console.error('Momo Payment Error:', error);
        alert('Lỗi xảy ra trong quá trình giao dịch momo');
    });
}