const VIDEO_SUGGESTED_TAG = 'ytd-compact-video-renderer';
const SEARCH_FOR_URL = '<link itemprop="url" href="http://www.youtube.com/';
const YOUTUBE_BASE_DOMAIN = 'https://www.youtube.com/';

const waitForElement = (target, selector) =>
{
    return new Promise((resolve, reject) => 
    {
        const selection = target.querySelector(selector);
        if (selection)
            return resolve(selection);
        
        const observer = new MutationObserver(() => 
        {
            const selection = target.querySelector(selector);
            if(selection)
            {
                observer.disconnect();
                return resolve(selection);
            }
        });
        
        observer.observe(target, {
            childList: true,
            subtree: true
        });
    });
};

const fetchChannelUrl = videoUrl =>
{
	return fetch(YOUTUBE_BASE_DOMAIN + videoUrl)
	.then(res => res.ok? Promise.resolve(res.text()) : Promise.reject('Error:' + res.status))
	.then(text => text
                    .substr(text.indexOf(SEARCH_FOR_URL) + SEARCH_FOR_URL.length)
                    .split('"')[0])
    .catch(error => console.error(error));
};

const getVideoUrl = video =>
{
    return video.querySelector('#thumbnail').getAttribute('href');
};

const changeChannelNameToLink = (linkTag, title, videoUrl) =>
{
    linkTag.innerText = title;
	
	browser.storage.local.get(title)
	.then(urlObj => {
		if (urlObj[title])
			linkTag.setAttribute('href', urlObj[title]);
		else
			fetchChannelUrl(videoUrl)
			.then(url => 
			{
				if (url)
				{
					linkTag.setAttribute('href', url);
					const urlObj = {}
					urlObj[title] = url;
					browser.storage.local.set(urlObj);				
				}
			});
	})
	.catch(e => 
		console.error(e)
	);
};

const setupUpdatingLink = video =>
{
    if (video.tagName.toLowerCase() !== VIDEO_SUGGESTED_TAG)
        return;
    
    waitForElement(video, 'yt-formatted-string')
    .then(channelNameElement =>
    {
        channelNameElement.setAttribute('has-link-only_', '');
        channelNameElement.innerText = '';
        const linkTag = document.createElement('a');
        channelNameElement.appendChild(linkTag);
        
        linkTag.setAttribute('class', 'yt-simple-endpoint style-scope yt-formatted-string');
        changeChannelNameToLink(linkTag, 
            channelNameElement.getAttribute('title'), getVideoUrl(video));
        
        const videoObserver = new MutationObserver(() => 
                            changeChannelNameToLink(linkTag, 
                                channelNameElement.getAttribute('title'), getVideoUrl(video)));

        videoObserver.observe(channelNameElement, {
           attributeFilter: ['title']
        });
    });
};

const addLinksToWatchList = () =>
{    
    waitForElement(document, VIDEO_SUGGESTED_TAG)
    .then(video => 
    {
        const watchLater = video.parentElement;
        const observer = new MutationObserver(records => 
            records.forEach(record => record.addedNodes.forEach(setupUpdatingLink))
        );
        
        observer.observe(watchLater, {
            childList: true
        });
        watchLater.childNodes.forEach(setupUpdatingLink);
    });
};

addLinksToWatchList();