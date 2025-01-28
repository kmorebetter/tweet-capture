// Create an offscreen canvas for image processing
let offscreenCanvas = new OffscreenCanvas(1, 1);
let ctx = offscreenCanvas.getContext('2d');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'captureArea') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' })
      .then(dataUrl => {
        console.log('Screenshot captured, sending back to content script');
        sendResponse({ imageData: dataUrl });
      })
      .catch(error => {
        console.error('Error capturing screenshot:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // Keep the message channel open
  }
});