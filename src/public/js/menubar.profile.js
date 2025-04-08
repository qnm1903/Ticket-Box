function toggleDropdown() {
    const options = document.querySelector('.account__options');
    options.style.display = options.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', function (event) {
    const accountContainer = document.querySelector('.top__right');
    const options = document.querySelector('.account__options');
    if (!accountContainer.contains(event.target)) {
        options.style.display = 'none';
    }
});