function getTweetBounds(tweetElement) {
  const bounds = tweetElement.getBoundingClientRect();
  
  // Find the engagement bar to exclude it
  const engagementBar = tweetElement.querySelector('[role="group"]');
  const engagementHeight = engagementBar ? engagementBar.offsetHeight : 0;
  
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height - engagementHeight
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTweetBounds') {
    const tweetElement = document.querySelector('article');
    if (tweetElement) {
      sendResponse(getTweetBounds(tweetElement));
    } else {
      sendResponse({ error: 'Tweet not found' });
    }
  }
  return true;
});