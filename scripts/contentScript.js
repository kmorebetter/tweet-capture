console.log('Content script loaded!');

async function captureTweet(includeMetrics = true) {
  console.log('Starting tweet capture...');
  try {
    // Try different selectors for tweets
    const tweetArticle = document.querySelector('article[data-testid="tweet"], article[data-testid="tweetDetail"]');
    console.log('Tweet element found:', !!tweetArticle);

    if (!tweetArticle) {
      throw new Error('No tweet found on this page');
    }

    // Get the tweet's position and dimensions
    const rect = tweetArticle.getBoundingClientRect();
    console.log('Tweet dimensions:', rect);

    // Scroll tweet into view
    tweetArticle.scrollIntoView({ behavior: 'instant', block: 'center' });
    
    // Wait for any animations
    await new Promise(resolve => setTimeout(resolve, 500));

    // Request the screenshot from background script
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'captureArea',
        area: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        }
      }, resolve);
    });
  } catch (error) {
    console.error('Capture error:', error);
    return { error: error.message };
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'captureTweet') {
    captureTweet(request.includeMetrics).then(sendResponse);
    return true;
  }
});
