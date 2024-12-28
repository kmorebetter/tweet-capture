async function captureTweet(includeMetrics = true) {
  console.log('Attempting to capture tweet...');
  try {
    const tweetArticle = document.querySelector('article[data-testid="tweet"]');
    console.log('Tweet article found:', !!tweetArticle);
    
    if (!tweetArticle) {
      throw new Error('No tweet found on this page');
    }

    const tweetClone = tweetArticle.cloneNode(true);

    if (!includeMetrics) {
      const metrics = tweetClone.querySelector('[role="group"]');
      if (metrics) metrics.remove();
    }

    tweetClone.querySelectorAll('button, [role="button"]').forEach(el => {
      if (!el.closest('[role="group"]')) {
        el.remove();
      }
    });

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

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: null,
      logging: false
    });

    document.body.removeChild(container);

    return {
      imageData: canvas.toDataURL('image/png')
    };
  } catch (error) {
    return { error: error.message };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureTweet') {
    captureTweet(request.includeMetrics).then(sendResponse);
    return true;
  }
});
