document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');

  const captureBtn = document.getElementById('captureBtn');
  const copyBtn = document.getElementById('copyBtn');
  const preview = document.getElementById('preview');
  const previewImage = document.getElementById('previewImage');
  const errorDiv = document.getElementById('error');
  const includeMetrics = document.getElementById('includeMetrics');

  let currentImage = null;
  
  async function downloadImage(dataUrl) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tweet-${timestamp}.png`;
    
    try {
      await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      });
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  }
  
  async function injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['scripts/contentScript.js']
      });
      console.log('Content script injected successfully');
      return true;
    } catch (error) {
      console.error('Failed to inject content script:', error);
      return false;
    }
  }
  
  async function captureTweet() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab);
      
      if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
        throw new Error('Please navigate to a tweet on Twitter/X');
      }

      // Inject content script if needed
      await injectContentScript(tab.id);

      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'captureTweet',
          includeMetrics: includeMetrics.checked
        }, response => {
          if (chrome.runtime.lastError) {
            // If content script isn't ready, try injecting again
            if (chrome.runtime.lastError.message.includes('receiving end does not exist')) {
              injectContentScript(tab.id).then(() => {
                // Retry the message after injection
                chrome.tabs.sendMessage(tab.id, {
                  action: 'captureTweet',
                  includeMetrics: includeMetrics.checked
                }, retryResponse => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else if (retryResponse && retryResponse.error) {
                    reject(new Error(retryResponse.error));
                  } else {
                    resolve(retryResponse);
                  }
                });
              });
            } else {
              reject(chrome.runtime.lastError);
            }
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  captureBtn.addEventListener('click', async () => {
    console.log('Capture button clicked');
    errorDiv.classList.add('hidden');
    preview.classList.add('hidden');
    copyBtn.disabled = true;
    captureBtn.disabled = true;
    
    try {
      const response = await captureTweet();
      console.log('Capture response:', response);

      if (response && response.imageData) {
        currentImage = response.imageData;
        
        // Automatically trigger download
        const downloaded = await downloadImage(currentImage);
        
        if (downloaded) {
          // Show preview after successful download
          previewImage.src = currentImage;
          preview.classList.remove('hidden');
          copyBtn.disabled = false;
        } else {
          throw new Error('Failed to save image');
        }
      } else {
        throw new Error('Failed to capture tweet');
      }
    } catch (err) {
      console.error('Error:', err);
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('hidden');
    } finally {
      captureBtn.disabled = false;
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      errorDiv.textContent = 'Copied to clipboard!';
      errorDiv.style.color = '#00BA7C'; // Success color
      errorDiv.classList.remove('hidden');
    } catch (err) {
      console.error('Copy error:', err);
      errorDiv.textContent = 'Failed to copy image';
      errorDiv.style.color = '#E0245E'; // Error color
      errorDiv.classList.remove('hidden');
    }
  });
});