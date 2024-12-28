document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn');
  const copyBtn = document.getElementById('copyBtn');
  const preview = document.getElementById('preview');
  const previewImage = document.getElementById('previewImage');
  const error = document.getElementById('error');
  const includeMetrics = document.getElementById('includeMetrics');

  let currentImage = null;

  captureBtn.addEventListener('click', async () => {
    console.log('Capture button clicked'); // Debug log
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab); // Debug log
      
      if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
        error.classList.remove('hidden');
        preview.classList.add('hidden');
        return;
      }

      console.log('Sending message to content script...'); // Debug log
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'captureTweet',
        includeMetrics: includeMetrics.checked
      });
      console.log('Response received:', response); // Debug log

      if (response.error) {
        throw new Error(response.error);
      }

      currentImage = response.imageData;
      previewImage.src = currentImage;
      preview.classList.remove('hidden');
      error.classList.add('hidden');
      copyBtn.disabled = false;

    } catch (err) {
      console.error('Error:', err); // Debug log
      error.textContent = err.message || 'Failed to capture tweet';
      error.classList.remove('hidden');
      preview.classList.add('hidden');
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (err) {
      error.textContent = 'Failed to copy image';
      error.classList.remove('hidden');
    }
  });
});
