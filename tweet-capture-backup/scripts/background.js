chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'captureArea') {
    // Add padding only for the capture, not the canvas
    const capturePadding = 20;
    const adjustedArea = {
      ...request.area,
      height: request.area.height + capturePadding
    };

    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      console.log('Screenshot captured');
      
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        // Use original dimensions for the canvas
        const canvas = new OffscreenCanvas(request.area.width, request.area.height);
        const ctx = canvas.getContext('2d');
        
        // Draw only the part we want, excluding the bottom padding
        ctx.drawImage(bitmap,
          adjustedArea.x, adjustedArea.y,
          adjustedArea.width, request.area.height, // Use original height here
          0, 0,
          adjustedArea.width, request.area.height  // And here
        );
        
        const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
        const resultDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(resultBlob);
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        chrome.downloads.download({
          url: resultDataUrl,
          filename: `tweet-${timestamp}.png`,
          saveAs: true
        });
        
        console.log('Sending cropped image data');
        sendResponse({ imageData: resultDataUrl });
        
        bitmap.close();
      } catch (error) {
        console.error('Error processing screenshot:', error);
        sendResponse({ error: error.message });
      }
    });
    return true;
  }
});