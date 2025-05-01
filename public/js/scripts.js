const searchInput = document.querySelector('input[name="keyword"]');
const clearIcon = document.querySelector('.clear-icon');
searchInput.addEventListener('input', () => {
    clearIcon.style.display = searchInput.value ? 'block' : 'none';
});
clearIcon.addEventListener('click', () => {
    searchInput.value = '';
    clearIcon.style.display = 'none';
    searchInput.focus();
});