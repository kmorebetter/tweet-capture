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
    // First find the main content section that excludes the sidebar
    const mainSection = document.querySelector('div[data-testid="primaryColumn"]') ||
                       document.querySelector('main[role="main"] > div > div');
    
    if (!mainSection) {
      throw new Error('Could not find main content section');
    }

    console.log('Found main section:', mainSection);

    // Try different selectors for tweets within the main section
    const tweetArticle = mainSection.querySelector('article[data-testid="tweet"]') || 
                        mainSection.querySelector('article[data-testid="tweetDetail"]') ||
                        mainSection.querySelector('article');
                        
    console.log('Tweet element found:', !!tweetArticle);

    if (!tweetArticle) {
      throw new Error('No tweet found on this page. Please make sure you are viewing a tweet.');
    }

    // Find the actual tweet content container
    const tweetContainer = tweetArticle.closest('[data-testid="cellInnerDiv"]') || 
                         tweetArticle.closest('[data-testid="tweet"]') ||
                         tweetArticle;

    // Add padding to ensure we capture the full tweet
    const padding = 24; // Increased padding for safety
    
    // Ensure the tweet is in view
    tweetContainer.scrollIntoView({ behavior: 'instant', block: 'center' });
    
    // Wait for any animations and layout adjustments
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the tweet's dimensions from its container
    const containerRect = tweetContainer.getBoundingClientRect();
    
    // Get the main section's left position to calculate the correct x-offset
    const mainSectionRect = mainSection.getBoundingClientRect();
    
    // Calculate the capture area with padding
    const area = {
      x: Math.max(0, Math.round(mainSectionRect.left - padding)),
      y: Math.max(0, Math.round(containerRect.top - padding)),
      width: Math.round(mainSectionRect.width + (padding * 2)),
      height: Math.round(containerRect.height + (padding * 2))
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
  
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return;
  }
  
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
