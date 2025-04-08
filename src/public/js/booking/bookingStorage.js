// Thêm hàm kiểm tra route
const isBookingRelatedRoute = () => {
    const bookingRoutes = ['/booking', '/info', '/payment'];
    return bookingRoutes.some(route => window.location.pathname.endsWith(route));
};


// Hàm xóa thông tin vé đã chọn từ localStorage
const clearBookingInfo = () => {
    localStorage.removeItem('selectedTickets');
}
  
 // Thêm event listener để kiểm tra khi chuyển trang
window.addEventListener('beforeunload', (event) => {
    // Nếu đang ở trong route liên quan đến booking thì không xóa
    if (isBookingRelatedRoute()) {
        return;
    }
    
    // Nếu không phải route booking thì xóa localStorage
    clearBookingInfo();
});

// Thêm event listener cho popstate (khi người dùng bấm nút back/forward của trình duyệt)
window.addEventListener('popstate', () => {
    if (!isBookingRelatedRoute()) {
        clearBookingInfo();
    }
});

// // Thêm event listener cho click trên các link
// document.addEventListener('click', (e) => {
//     // Kiểm tra nếu click vào link
//     if (e.target.tagName === 'A') {
//         const href = e.target.getAttribute('href');
//         // Nếu link không phải route booking
//         if (href && !href.endsWith('/booking') && 
//             !href.endsWith('/info-filling') && 
//             !href.endsWith('/payment')) {
//             clearBookingInfo();
//         }
//     }
// });