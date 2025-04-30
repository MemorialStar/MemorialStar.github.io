document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-detail').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = btn.closest('.goal').querySelector('.details-list');
      list.style.display = list.style.display === 'block' ? 'none' : 'block';
    });
  });

  document.querySelectorAll('.toggle-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.parentNode.querySelector('.explanation');
      p.style.display = p.style.display === 'block' ? 'none' : 'block';
    });
  });
});
