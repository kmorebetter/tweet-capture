// Create an offscreen canvas for image processing
let offscreenCanvas = new OffscreenCanvas(1, 1);
let ctx = offscreenCanvas.getContext('2d');

console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'captureArea') {
    console.log('Capturing area:', request.area);
    
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
      if (chrome.runtime.lastError) {
        console.error('Capture error:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        console.log('Screenshot captured');
        sendResponse({ imageData: dataUrl });
      }
    });
    
    return true; // Keep the message channel open for the async response
  }
});
