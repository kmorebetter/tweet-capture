document.addEventListener('DOMContentLoaded', () => {
  const captureButton = document.getElementById('captureButton');
  const previewImage = document.getElementById('previewImage');

  captureButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const bounds = await chrome.tabs.sendMessage(tab.id, { action: 'getTweetBounds' });
      
      if (bounds.error) {
        console.error('Error:', bounds.error);
        return;
      }

      const response = await chrome.runtime.sendMessage({
        action: 'captureArea',
        area: bounds
      });

      if (response.error) {
        console.error('Error:', response.error);
        return;
      }

      // Show preview
      previewImage.src = response.imageData;
      previewImage.style.display = 'block';

    } catch (error) {
      console.error('Error:', error);
    }
  });
});