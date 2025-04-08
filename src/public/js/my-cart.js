import axios from 'https://cdn.skypack.dev/axios';

function encryptData(data, secretKey) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

function decryptData(encryptedData, secretKey) {
  let bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

document.addEventListener('DOMContentLoaded', () => {
    const selectAllCheckbox = document.getElementById('selectAllBTN');
    const selectAll = document.getElementById('selectAll');
    const ticketCheckboxes = document.querySelectorAll('.ticket-checkbox');
    const bookNowBtn = document.getElementById('bookNowBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const deleteModal = document.getElementById('deleteModal');
    const errorModal = document.getElementById('errorModal');
    const noSelectionModal = document.getElementById('noSelectionModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const closeErrorModalBtn = document.getElementById('closeErrorModalBtn');
    const closeNoSelectionModalBtn = document.getElementById('closeNoSelectionModalBtn');
    const secretkey = 'sahjbjV1bCj23dgaSABJkgkwv1j2SAjh';
  
    // Select All functionality
    selectAllCheckbox.addEventListener('click', () => {
      selectAll.checked = !selectAll.checked;
      ticketCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
      });
    });
  
    // Book Now functionality
    bookNowBtn.addEventListener('click', () => {
      const selectedTickets = document.querySelectorAll('.ticket-checkbox:checked');
      if (selectedTickets.length === 0) {
        noSelectionModal.style.display = 'flex';
      } else if (selectedTickets.length > 1) {
        errorModal.style.display = 'flex';
      } else {
        const selectedEventId = selectedTickets[0].getAttribute('data-event-id');
        const cartData = selectedTickets[0].getAttribute('data-cart');
        const encryptedData = encryptData(cartData, secretkey);
        window.location.href = `/detail/${selectedEventId}/booking?cart=${encodeURIComponent(encryptedData)}`; // Chuyển đến trang đặt vé với eventId
      }
    });
  
    // Delete functionality
    deleteBtn.addEventListener('click', () => {
      const selectedTickets = document.querySelectorAll('.ticket-checkbox:checked');
      if (selectedTickets.length > 0) {
        deleteModal.style.display = 'flex';
      } else {
        noSelectionModal.style.display = 'flex';
      }
    });
  
    // Confirm Delete
    confirmDeleteBtn.addEventListener('click', () => {
      const selectedTickets = document.querySelectorAll('.ticket-checkbox:checked');
      const selectedCartIDs = Array.from(selectedTickets).map(checkbox => checkbox.getAttribute('data-id'));
      
      // Gửi yêu cầu xóa đến backend
      axios.post('/api/shopping-cart/delete', { selectedCartIDs }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.data.success) {
            alert('Đã xóa vé khỏi giỏ hàng của bạn');
            window.location.reload(); // Reload the page to update the cart
          } else {
            alert('Xóa vé thất bại');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Có lỗi xảy ra trong quá trình xóa vật phẩm khỏi giỏ hàng');
        });
      
      deleteModal.style.display = 'none';
    });
  
    // Close modals
    cancelDeleteBtn.addEventListener('click', () => {
      deleteModal.style.display = 'none';
    });
  
    closeErrorModalBtn.addEventListener('click', () => {
      errorModal.style.display = 'none';
    });
  
    closeNoSelectionModalBtn.addEventListener('click', () => {
      noSelectionModal.style.display = 'none';
    });
});