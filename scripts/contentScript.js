async function captureTweet(includeMetrics = true) {
  console.log('Attempting to capture tweet...'); // Debug log
  try {
    // Try both old and new selectors
    const tweetArticle = document.querySelector('article[data-testid="tweet"], article[data-testid="tweetDetail"]');
    console.log('Tweet element found:', !!tweetArticle); // Debug log
    
    if (!tweetArticle) {
      throw new Error('No tweet found on this page');
    }

    // Log the structure
    console.log('Tweet structure:', {
      hasMetrics: !!tweetArticle.querySelector('[role="group"]'),
      tweetText: tweetArticle.textContent.slice(0, 50) + '...'
    });

    // Rest of the function...
    const tweetClone = tweetArticle.cloneNode(true);

    if (!includeMetrics) {
      const metrics = tweetClone.querySelector('[role="group"]');
      if (metrics) metrics.remove();
    }

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 550px;
      background: ${getComputedStyle(document.body).backgroundColor};
      padding: 16px;
      border-radius: 16px;
      z-index: -1;
    `;
    container.appendChild(tweetClone);
    document.body.appendChild(container);

    console.log('About to capture with html2canvas...'); // Debug log
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: null,
      logging: true // Enable html2canvas logging
    });

    document.body.removeChild(container);
    console.log('Capture complete!'); // Debug log

    return {
      imageData: canvas.toDataURL('image/png')
    };
  } catch (error) {
    console.error('Capture error:', error); // Debug log
    return { error: error.message };
  }
}

// Add debug logging to message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request); // Debug log
  if (request.action === 'captureTweet') {
    captureTweet(request.includeMetrics).then(response => {
      console.log('Sending response:', response); // Debug log
      sendResponse(response);
    });
    return true;
  }
});

// Log when content script loads
console.log('Tweet Capture content script loaded!');
