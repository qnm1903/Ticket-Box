const inputUsername = document.querySelector('.username');
const inputPassword = document.querySelector('.password');
const btnLogin = document.querySelector('.submitButton'); 

btnLogin.addEventListener("click", async (e) => {
    e.preventDefault();
    
    // Kiểm tra xem input có trống không
    if (inputUsername.value === "" || inputPassword.value === "") {
        alert('Please enter a username and password');
        return;
    }

    if (inputUsername.value === "admin" && inputPassword.value === "admin@1234") {
        alert("Login successful");
        window.location.href = "home/temp.html";
        return;
    }
    
    // Gửi yêu cầu đăng nhập đến server
    try {
        const response = await fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: inputUsername.value, 
                password: inputPassword.value, 
            }),
        });

        const data = await response.text();

        if (response.ok) {
            alert("Login successful");
            window.location.href = "home/temp.html";
        } else {
            alert(data); 
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred during login");
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const loginPopup = document.getElementById("loginPopup");

    // Mở pop-up khi nhấn nút đăng nhập
    loginBtn.onclick = () => {
        loginPopup.style.display = "flex";
        document.body.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Thay đổi màu nền thành mờ
    };

    // Đóng pop-up khi nhấp ra ngoài nội dung pop-up
    window.onclick = (event) => {
        // Kiểm tra xem nhấp vào vùng overlay (bên ngoài nội dung) hay không
        if (event.target === loginPopup) {
            loginPopup.style.display = "none"; // Đóng pop-up
            document.body.style.backgroundColor = ""; // Khôi phục màu nền gốc
        }
    };
});




// Hiện/ẩn mật khẩu
const togglePassword = document.getElementById('togglePassword');
togglePassword.addEventListener('click', () => {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
});

