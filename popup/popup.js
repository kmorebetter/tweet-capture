document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');

  const captureBtn = document.getElementById('captureBtn');
  
  captureBtn.addEventListener('click', async () => {
    console.log('Capture button clicked');
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab URL:', tab.url);
      
      // Check if we're on Twitter/X
      if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
        console.log('Not on Twitter/X');
        alert('Please navigate to a tweet on Twitter/X');
        return;
      }

      // Inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/contentScript.js']
        });
        console.log('Content script injected');
      } catch (e) {
        console.log('Content script already exists');
      }

      // Try to send a message to content script
      console.log('Sending test message...');
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'test',
        message: 'Hello from popup!'
      });
      
      console.log('Response from content script:', response);
      alert('Message sent successfully!');

    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
    }
  });
});
