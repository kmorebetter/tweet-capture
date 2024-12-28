document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded'); // Debug log

  // Get DOM elements
  const captureBtn = document.getElementById('captureBtn');
  const copyBtn = document.getElementById('copyBtn');
  const preview = document.getElementById('preview');
  const previewImage = document.getElementById('previewImage');
  const errorDiv = document.getElementById('error'); // Changed name to avoid confusion
  const includeMetrics = document.getElementById('includeMetrics');

  // Verify elements are found
  if (!captureBtn || !copyBtn || !preview || !previewImage || !errorDiv || !includeMetrics) {
    console.error('Required elements not found:', {
      captureBtn: !!captureBtn,
      copyBtn: !!copyBtn,
      preview: !!preview,
      previewImage: !!previewImage,
      errorDiv: !!errorDiv,
      includeMetrics: !!includeMetrics
    });
    return;
  }

  let currentImage = null;

  captureBtn.addEventListener('click', async () => {
    console.log('Capture button clicked');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab.url);
      
      if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
        console.log('Not on Twitter/X');
        errorDiv.classList.remove('hidden');
        preview.classList.add('hidden');
        return;
      }

      console.log('Sending message to content script...');
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'captureTweet',
        includeMetrics: includeMetrics.checked
      });

      console.log('Response received:', response);

      if (response && response.error) {
        throw new Error(response.error);
      }

      currentImage = response.imageData;
      previewImage.src = currentImage;
      preview.classList.remove('hidden');
      errorDiv.classList.add('hidden');
      copyBtn.disabled = false;

    } catch (err) {
      console.error('Error:', err);
      errorDiv.textContent = err.message || 'Failed to capture tweet';
      errorDiv.classList.remove('hidden');
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
      errorDiv.textContent = 'Failed to copy image';
      errorDiv.classList.remove('hidden');
    }
  });
});
