const VIDEO_SUGGESTED_TAG = 'ytd-compact-video-renderer';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/';

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

const status = response => 
{
    return response.ok? Promise.resolve(response.json()) : Promise.reject('Error:' + response.status);
};

const getChannelUrl = videoId =>
{
    return fetch(YOUTUBE_API_URL + 'videos?part=snippet&id='
                                + videoId + '&key=' + API_KEY)
        .then(status)
        .then(data => {
            return data?.items?.length?
                data.items[0].snippet.channelId
                : Promise.reject('Data is invalid. id:' + videoId + 'key:' + API_KEY);
        })
        .then(channelId => fetch(YOUTUBE_API_URL + 'channels?part=snippet&id='
                                + channelId + '&key=' + API_KEY))
        .then(status)
        .then(data => {
            if (!data?.items?.length)
                return Promise.reject('Data is invalid');
            
            return data.items[0].snippet.customUrl?
                data.items[0].snippet.customUrl 
                : 'channel/' + data.items[0].id;
        })
        .catch(error => console.error(error));
};

const changeChannelNameToLink = (channelNameElement, url) =>
{
    channelNameElement.innerHTML = '<a class="yt-simple-endpoint style-scope yt-formatted-string" \
                    href="' + url + '">' + channelNameElement.getAttribute('title') + '</a>';                    
};

const addChannelLink = video =>
{
    if (video.tagName.toLowerCase() !== VIDEO_SUGGESTED_TAG)
        return;
    
    const href = video.querySelector('#thumbnail').getAttribute('href');
    const videoId = href.slice((href.includes('shorts')? href.lastIndexOf('/') : href.indexOf('=')) + 1);
    Promise.all([waitForElement(video, 'yt-formatted-string'), getChannelUrl(videoId)])
    .then(([channelNameElement, url]) =>
    {
        changeChannelNameToLink(channelNameElement, url);
        const videoObserver = new MutationObserver(() => changeChannelNameToLink(channelNameElement, url));
        videoObserver.observe(channelNameElement, {
           attributeFilter: ['title']
        });
    })
    .catch(error => console.log(error));
};
let API_KEY;

if (typeof browser === "undefined")
{
    var browser = chrome;
}

const addLinksToWatchList = () =>
{
    browser.storage.sync.get('api_key').then(key => 
    {
        if(!Object.keys(key).length)
            return Promise.reject('Error: extension requires a youtube api key to function. Load it thorugh the extension popup')
        
        API_KEY = key['api_key'];
        
        fetch(YOUTUBE_API_URL + 'search?key=' + API_KEY)
        .then(response => response.ok? Promise.resolve() : Promise.reject('Error: api key is not valid'))
        .then(() => 
            waitForElement(document, VIDEO_SUGGESTED_TAG)
            .then(video => 
            {
                const watch_later = video.parentElement;
                const observer = new MutationObserver(records => 
                    records.forEach(record => record.addedNodes.forEach(addChannelLink))
                );

                observer.observe(watch_later, {
                    childList: true
                });
                watch_later.childNodes.forEach(addChannelLink);
            }))
        .catch(e => console.log(e));
    })
    .catch(e => console.log(e));
}

addLinksToWatchList();