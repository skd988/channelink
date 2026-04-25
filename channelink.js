const VIDEO_SUGGESTED_TAG = 'yt-lockup-view-model, ytd-compact-video-renderer';
const WATCH_LATER_SELECTOR = 'ytd-watch-next-secondary-results-renderer div:is(#contents, #items):has(> yt-lockup-view-model)';
const SEARCH_FOR_URL = '<link itemprop="url" href="http://www.youtube.com/';
const YOUTUBE_BASE_DOMAIN = 'https://www.youtube.com/';
const CHANNEL_NAME_SELECTOR = '.ytd-channel-name yt-formatted-string.ytd-channel-name, yt-content-metadata-view-model span';

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

const getChannelUrl = async videoUrl =>
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
    waitForElement(video, CHANNEL_NAME_SELECTOR)
    .then(channelNameElement =>
    {
		const name = channelNameElement.innerText;

        channelNameElement.setAttribute('has-link-only_', '');
        const linkTag = document.createElement('a');
        
        linkTag.setAttribute('class', 'yt-simple-endpoint style-scope');
		linkTag.setAttribute('style', '--yt-endpoint-color:var(--t4a6da19e16bf221a);--yt-endpoint-hover-color:var(--tffc2fd3a644f6275);');
        changeChannelNameToLink(linkTag, 
            name, getVideoUrl(video));
			
		channelNameElement.removeChild(channelNameElement.firstChild);

		channelNameElement.prepend(linkTag);
    });

    const removalObservation = new MutationObserver(records =>
    {
        if(records.some(record => Array.from(record.removedNodes).some(removed => removed?.classList.contains('ytLockupViewModelHost'))))
        {
            removalObservation.disconnect();
            setupUpdatingLink(video);
        }
    });

    removalObservation.observe(video, {
        childList: true
    });
};

const addLinksToWatchList = () =>
{    
    waitForElement(document, WATCH_LATER_SELECTOR)
    .then(watchLater => 
    {
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