chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  if (request.action === 'captureArea') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
      const img = new Image();
      
      img.onload = () => {
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
        
        sendResponse({ imageData: canvas.toDataURL() });
      };

      img.src = dataUrl;
    });
    return true; // Will respond asynchronously
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.action.openPopup();
  }
});
