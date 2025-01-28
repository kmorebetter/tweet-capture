console.log('Content script loaded!');

async function cropImage(dataUrl, area) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = area.width;
      canvas.height = area.height;
      const ctx = canvas.getContext('2d');
      
      // Use a white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img,
        area.x, area.y,
        area.width, area.height,
        0, 0,
        area.width, area.height
      );
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

async function captureTweet(includeMetrics = true) {
  console.log('Starting tweet capture...');
  try {
    // Try to find the main tweet container
    const mainContent = document.querySelector('main[role="main"]');
    if (!mainContent) {
      throw new Error('Could not find main content area');
    }

    // Try different selectors for tweets
    const tweetArticle = mainContent.querySelector('[data-testid="tweet"]') || 
                        mainContent.querySelector('[data-testid="tweetDetail"]') ||
                        mainContent.querySelector('article');
                        
    console.log('Tweet element found:', !!tweetArticle);

    if (!tweetArticle) {
      throw new Error('No tweet found on this page. Please make sure you are viewing a tweet.');
    }

    // Find the actual tweet content container
    const tweetContainer = tweetArticle.closest('[data-testid="cellInnerDiv"]') || 
                         tweetArticle.closest('[data-testid="tweet"]') ||
                         tweetArticle;

    // Add padding to ensure we capture the full tweet
    const padding = 20;
    
    // Get the tweet's position and dimensions
    const rect = tweetContainer.getBoundingClientRect();
    console.log('Tweet dimensions:', rect);

    // Ensure the tweet is in view
    tweetContainer.scrollIntoView({ behavior: 'instant', block: 'center' });
    
    // Wait for any animations and layout adjustments
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get updated position after scrolling
    const updatedRect = tweetContainer.getBoundingClientRect();
    
    // Calculate the capture area with padding
    const area = {
      x: Math.max(0, Math.round(updatedRect.left - padding)),
      y: Math.max(0, Math.round(updatedRect.top - padding)),
      width: Math.round(updatedRect.width + (padding * 2)),
      height: Math.round(updatedRect.height + (padding * 2))
    };
    
    console.log('Capture area:', area);
    
    // Request the screenshot from background script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'captureArea',
        area: area
      }, async response => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else if (response && response.error) {
          console.error('Response error:', response.error);
          reject(new Error(response.error));
        } else {
          try {
            console.log('Got screenshot, cropping...');
            const croppedImage = await cropImage(response.imageData, area);
            resolve({ imageData: croppedImage });
          } catch (error) {
            console.error('Error cropping image:', error);
            reject(error);
          }
        }
      });
    });
  } catch (error) {
    console.error('Capture error:', error);
    throw error;
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'captureTweet') {
    captureTweet(request.includeMetrics)
      .then(response => {
        console.log('Sending response back to popup:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error in capture process:', error);
        sendResponse({ error: error.message || 'Failed to capture tweet' });
      });
    return true; // Keep the message channel open for the async response
  }
});
