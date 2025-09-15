const VIDEO_SUGGESTED_TAG = 'yt-lockup-view-model';
const WATCH_LATER_SELECTOR = 'div#items:has(> yt-lockup-view-model)';
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

const getChannelUrl = videoUrl =>
{
	return fetch(YOUTUBE_BASE_DOMAIN + videoUrl)
	.then(res => res.ok? Promise.resolve(res.text()) : Promise.reject('Error:' + res.status))
	.then(text => text
                    .substring(text.indexOf(SEARCH_FOR_URL) + SEARCH_FOR_URL.length)
                    .split('"')[0])
    .catch(error => console.error(error));
};

const getVideoUrl = video =>
{
    return video?.querySelector('a')?.getAttribute('href');
};

const changeChannelNameToLink = (linkTag, name, videoUrl) =>
{
    linkTag.innerText = name;
	
    getChannelUrl(videoUrl)
    .then(url => 
        linkTag.setAttribute('href', url)
    );
};

const setupUpdatingLink = video =>
{
    if (video.tagName.toLowerCase() !== VIDEO_SUGGESTED_TAG)
        return;
	
    waitForElement(video, 'yt-content-metadata-view-model span')
    .then(channelNameElement =>
    {
		const name = channelNameElement.innerText;

        channelNameElement.setAttribute('has-link-only_', '');
        const linkTag = document.createElement('a');
        
        linkTag.setAttribute('class', 'yt-simple-endpoint style-scope');
		linkTag.setAttribute('style', '--yt-endpoint-color:var(--yt-spec-text-secondary);--yt-endpoint-hover-color:var(--yt-spec-text-primary);');
        changeChannelNameToLink(linkTag, 
            name, getVideoUrl(video));
			
		channelNameElement.removeChild(channelNameElement.firstChild);

		channelNameElement.prepend(linkTag);
    });
};

const addLinksToWatchList = () =>
{    
    waitForElement(document, WATCH_LATER_SELECTOR)
    .then(watchLater => 
    {
        const observeWatchLaterRemoval = new MutationObserver(records =>
        {
            if(records.some(record => Array.from(record.removedNodes).some(removed => removed === watchLater)))
                addLinksToWatchList();
        });
        observeWatchLaterRemoval.observe(watchLater.parentElement, {childList:true});        
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
console.log('channelink loaded');