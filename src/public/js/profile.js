document.addEventListener("DOMContentLoaded", function () {
    const avatar = document.querySelector(".profile");
    const userInfo = document.querySelector(".profile-dropdown-menu"); // Updated selector

    if (avatar && userInfo) {
        // Toggle menu display on avatar click
        avatar.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent event propagation
            userInfo.classList.toggle("show-menu"); // Toggle class to show/hide the menu
        });

        // Close the menu when clicking outside
        document.addEventListener("click", function (event) {
            if (!userInfo.contains(event.target) && event.target !== avatar) {
                userInfo.classList.remove("show-menu"); // Hide the menu if clicked outside
            }
        });
    }
});
