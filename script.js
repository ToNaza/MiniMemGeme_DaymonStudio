(() => {
  const items = document.querySelectorAll('.pc, .server');
  let hovered = null;

  items.forEach(item => {
    item.addEventListener('mouseenter', () => hovered = item);
    item.addEventListener('mouseleave', () => hovered = null);

    // кліком миші теж можна відкрити сторінку
    item.addEventListener('click', () => {
      const url = item.dataset.link;
      if (url) window.location.href = url; // відкриває локальну сторінку
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!hovered) return;

    const key = e.key;
    if (key === 'e' || key === 'E' || key === 'у' || key === 'У') {
      const url = hovered.dataset.link;
      if (url) window.location.href = url;
    }
  });
})();

















function openModal() {
  document.getElementById('modal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}
document.getElementById('closeModal').addEventListener('click', closeModal);