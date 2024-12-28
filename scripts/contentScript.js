async function captureTweet(includeMetrics = true) {
  console.log('Attempting to capture tweet...');
  try {
    const tweetArticle = document.querySelector('article[data-testid="tweet"]');
    console.log('Tweet article found:', !!tweetArticle);
    
    if (!tweetArticle) {
      throw new Error('No tweet found on this page');
    }

    // Get the tweet's position and size
    const rect = tweetArticle.getBoundingClientRect();
    
    // Scroll the tweet into view if needed
    tweetArticle.scrollIntoView({ behavior: 'instant', block: 'center' });
    
    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send dimensions to background script for capture
    const response = await chrome.runtime.sendMessage({
      action: 'captureArea',
      area: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    });

    return response;
  } catch (error) {
    console.error('Capture error:', error);
    return { error: error.message };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureTweet') {
    captureTweet(request.includeMetrics).then(sendResponse);
    return true;
  }
});
