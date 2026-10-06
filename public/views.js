document.addEventListener('DOMContentLoaded', () => {
  if (!window.GP) return;
  const GP = window.GP;

  GP.registerRoute('/home', async () => {
    document.getElementById('app').innerHTML = `<div class="container section-padding"><h1>Welcome to Dumbarwadi Gram Panchayat</h1></div>`;
  });
});
