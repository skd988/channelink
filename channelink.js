const VIDEO_SUGGESTED_TAG = 'ytd-compact-video-renderer';
const SEARCH_FOR_URL = '<link itemprop="url" href="http://www.youtube.com/';


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
	return fetch(videoUrl)
	.then(res => res.ok? Promise.resolve(res.text()) : Promise.reject('Error:' + res.status))
	.then(text => text
                    .substr(text.indexOf(SEARCH_FOR_URL) + SEARCH_FOR_URL.length)
                    .split('"')[0])
    .catch(error => console.error(error));
};

const changeChannelNameToLink = (channelNameElement, url) =>
{
	channelNameElement.setAttribute('has-link-only_', '');
    channelNameElement.innerHTML = '<a class="yt-simple-endpoint style-scope yt-formatted-string" \
                    href="' + url + '">' + channelNameElement.getAttribute('title') + '</a>';                    
};

const addChannelLink = video =>
{
    if (video.tagName.toLowerCase() !== VIDEO_SUGGESTED_TAG)
        return;
    
    const href = video.querySelector('#thumbnail').getAttribute('href');
    Promise.all([waitForElement(video, 'yt-formatted-string'), getChannelUrl(href)])
    .then(([channelNameElement, url]) =>
    {
        changeChannelNameToLink(channelNameElement, url);
        const videoObserver = new MutationObserver(() => 
                                    changeChannelNameToLink(channelNameElement, url));
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
        {
            records.forEach(record => record.addedNodes.forEach(addChannelLink));
        });
        observer.observe(watchLater, {
            childList: true
        });
        watchLater.childNodes.forEach(addChannelLink);
    });
}

addLinksToWatchList();