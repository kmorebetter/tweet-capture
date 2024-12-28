console.log('Content script loaded!');

// Listen for any messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  // Send back a simple response
  sendResponse({ received: true, message: 'Hello from content script!' });
  return true;
});
