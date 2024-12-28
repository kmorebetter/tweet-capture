chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'captureArea') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
      console.log('Screenshot captured');
      
      const img = new Image();
      
      img.onload = () => {
        console.log('Image loaded, creating canvas');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = request.area.width;
        canvas.height = request.area.height;
        
        ctx.drawImage(img,
          request.area.x, request.area.y,
          request.area.width, request.area.height,
          0, 0,
          request.area.width, request.area.height
        );
        
        console.log('Sending cropped image data');
        sendResponse({ imageData: canvas.toDataURL('image/png') });
      };

      img.src = dataUrl;
    });
    return true;
  }
});
