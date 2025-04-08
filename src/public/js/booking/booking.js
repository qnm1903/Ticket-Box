const ticketsContainer = document.getElementById('tickets');
const vouchersContainer = document.getElementById('vouchers');
const pricingContainer = document.getElementById('pricing');
const totalTicketsElement = document.getElementById('total-tickets');
const totalPriceElement = document.getElementById('total-price');
const bookNowBtnElement = document.getElementById('booknow-btn');
const stageLayoutBtnElement = document.getElementById('stagelayout-btn');
const paymentModal = document.getElementById('paymentModal');
const rawTicketTypeInfo = decodeURIComponent(ticketsContainer.dataset.ticketInfo);
const rawVoucherInfo = decodeURIComponent(vouchersContainer.dataset.voucherInfo);
const ticketData = JSON.parse(rawTicketTypeInfo);
const voucherData = JSON.parse(rawVoucherInfo);
console.log(voucherData);
// NOTE: biến quantity là số lượng đang chọn của mỗi loại vé, còn ticket.quantity là số vé còn lại của loại vé đấy trong db

const decryptData = (encryptedData, secretKey) => {
  let bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
const secretkey = 'sahjbjV1bCj23dgaSABJkgkwv1j2SAjh';

// Số vé hiển thị trên mỗi trang
const ticketsPerPage = 3;

// Biến quản lý trạng thái trang hiện tại
let currentPage = 1;

// Tính tổng số trang
const totalPages = Math.ceil(ticketData.length / ticketsPerPage);

let selectedTickets = {};

const InitializeSelectedTickets = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encryptedData = urlParams.get('cart');
  if (encryptedData) {
    const decryptedData = JSON.parse(decryptData(decodeURIComponent(encryptedData), secretkey));
    console.log(decryptedData);
    
    for (const ticket of decryptedData) {
      const ticketDataValue = ticketData.find(t => t.ticketTypeId === ticket.ticketTypeID);
      if (ticketDataValue) {
        selectedTickets[ticketDataValue.name] = ticket.quantity;
      }
    }
  }

  updateOrderSummary();
  renderTickets();
};

// Hàm lưu thông tin vé đã chọn vào localStorage
const saveBookingToStorage = () => {
  const ticketsArray = ticketData.map(ticket => ({
      ticketTypeID: ticket.ticketTypeId,
      quantity: selectedTickets[ticket.name] || 0,
      price: ticket.price
  })).filter(ticket => ticket.quantity > 0); // Chỉ lưu những vé có số lượng > 0

  if (ticketsArray.length > 0) {
      localStorage.setItem('selectedTickets', JSON.stringify(ticketsArray));
  } else {
      localStorage.removeItem('selectedTickets');
  }
};

// Hàm cập nhật tổng số vé và tổng giá tiền
const updateOrderSummary = () => {
  pricingContainer.innerHTML = '';
  let totalTickets = 0;
  let totalPrice = 0;

  for (const ticketName in selectedTickets) {
    const quantity = selectedTickets[ticketName];
    if (quantity > 0) {
      const ticket = ticketData.find(t => t.name === ticketName);
      const price = ticket.price * quantity;
      pricingContainer.innerHTML += `
        <div class="pricing-item">
          <span>${ticketName} x${quantity}</span>
          <span>${price.toLocaleString()}₫</span>
        </div>
      `;
      totalTickets += quantity;
      totalPrice += price;
    }
  }

  totalTicketsElement.textContent = totalTickets;
  totalPriceElement.textContent = totalPrice.toLocaleString() + '₫';

  const voucherCode = document.getElementById('voucher-input').value;
  const vouchers = voucherData;
  const voucher = vouchers.find(v => v.voucherName === voucherCode);
  if (voucher) {
      const discount = voucher.discountValue;
      const totalPrice = parseInt(totalPriceElement.textContent.replace('₫', '').replace(/,/g, ''), 10);
      const finalPrice = totalPrice * (1 - discount / 100);
      document.getElementById('total-discount').textContent = `-${(discount * totalPrice / 100).toLocaleString()}₫`;
      document.getElementById('final-price').textContent = `${finalPrice.toLocaleString()}₫`;
  }
  else document.getElementById('final-price').textContent = totalPrice.toLocaleString() + '₫';
    
  // Lưu vào localStorage mỗi khi cập nhật
  saveBookingToStorage();
};

// Hàm cập nhật số lượng vé
const updateTicket = (ticketName, delta) => {
    const currentQuantity = selectedTickets[ticketName];
    const newQuantity = Math.max(0, currentQuantity + delta);
    selectedTickets[ticketName] = newQuantity;

    document.getElementById(`quantity-${ticketName}`).value = newQuantity;
    updateOrderSummary();
};

// Hàm xử lý sự kiện input
const handleInput = (ticketName) => {
    const inputElement = document.getElementById(`quantity-${ticketName}`);
    const value = parseInt(inputElement.value, 10) || 0;
    selectedTickets[ticketName] = Math.max(0, value);
    updateOrderSummary();
};


// Hàm render vé của trang hiện tại
const renderTickets = () => {
    ticketsContainer.innerHTML = '';
    
    const start = (currentPage - 1) * ticketsPerPage;
    const end = Math.min(start + ticketsPerPage, ticketData.length);

    for (let i = start; i < end; i++) {
      const ticket = ticketData[i];
      selectedTickets[ticket.name] = selectedTickets[ticket.name] || 0;

      const ticketElement = document.createElement('div');
      ticketElement.className = 'ticket';

      ticketElement.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center ticket-info">
                <img src="${ticket.imgUrl}" alt="${ticket.name}" class="img-thumbnail" style="width: 80px; height: 80px" />
                <div class="ms-3" id="ticket-info">
                    <h6 class="mb-1">${ticket.name}</h6>
                    <small>Price: ${`${ticket.price.toLocaleString()}₫`}</small>
                </div>
            </div>
            <div class="ticket-quantity">
                ${
                    ticket.quantity === 0
                        ? '<div class="sold-out">Sold Out</div>'
                        : `
                  <button class="btn btn-outline-secondary btn-sm" id="minus-btn">-</button>
                  <input type="number" value="${selectedTickets[ticket.name]}" min="0" id="quantity-${ticket.name}">
                  <button class="btn btn-outline-secondary btn-sm" id="plus-btn">+</button>
                `
                }
            </div>
        </div>
      `;

      ticketsContainer.appendChild(ticketElement);
    }

    updatePaginationControls();
};

// Hàm cập nhật trạng thái nút phân trang
const updatePaginationControls = () => {
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    // Cập nhật trạng thái nút
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    // Hiển thị thông tin trang
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
};

// Hàm thay đổi trang
const changePage = (delta) => {
    currentPage = Math.min(Math.max(1, currentPage + delta), totalPages);
    renderTickets();
};

// Khởi tạo
InitializeSelectedTickets();

document.getElementById('apply-voucher-btn').addEventListener('click', (event) => {
  event.preventDefault();
  const voucherCode = document.getElementById('voucher-input').value;
  const vouchers = voucherData;
  const voucher = vouchers.find(v => v.voucherName === voucherCode);
  if (voucher) {
      const discount = voucher.discountValue;
      const totalPrice = parseInt(totalPriceElement.textContent.replace('₫', '').replace(/,/g, ''), 10);
      const finalPrice = totalPrice * (1 - discount / 100);
      document.getElementById('total-discount').textContent = `-${(discount * totalPrice / 100).toLocaleString()}₫`;
      document.getElementById('final-price').textContent = `${finalPrice.toLocaleString()}₫`;
  } else {
      alert('Mã giảm giá không hợp lệ');
  }
});
// Cập nhật event listener cho nút Book Now
bookNowBtnElement.addEventListener('click', () => {
  const selectedTicketsArray = JSON.parse(localStorage.getItem('selectedTickets') || '[]');
  if (selectedTicketsArray.length > 0) {
    // mở modal thanht toán
    paymentModal.style.display = "block";
  } else {
      alert('Vui lòng chọn ít nhất một vé');
  }
});

// Thêm event listeners khi document đã load
document.addEventListener('DOMContentLoaded', () => {
  // Pagination buttons
  document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
  document.getElementById('nextPage').addEventListener('click', () => changePage(1));

  ticketsContainer.addEventListener('click', (event) => {
    // Kiểm tra nếu click vào nút tăng/giảm số lượng
    if (event.target.matches('.btn')) {
      const ticketElement = event.target.closest('.ticket');
      const ticketType = ticketElement.querySelector('#ticket-info h6').textContent;
      const isIncrease = event.target.textContent === '+';
      updateTicket(ticketType, isIncrease ? 1 : -1);
    }
  });

    // Xử lý input change
  ticketsContainer.addEventListener('input', (event) => {
    if (event.target.matches('input[type="number"]')) {
        const ticketType = event.target.closest('.ticket').querySelector('.ticket-info strong').textContent;
        handleInput(ticketType);
    }
  });
});