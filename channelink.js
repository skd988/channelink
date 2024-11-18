const video_suggested_tag = 'ytd-compact-video-renderer';

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
    return fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet&id='
                                + videoId + '&key=' + API_KEY)
        .then(status)
        .then(data => {
            return data?.items?.length?
                data.items[0].snippet.channelId
                : Promise.reject('Data is invalid. id:' + videoId + 'key:' + API_KEY);
        })
        .then(channelId => fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&id='
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
    if (video.tagName.toLowerCase() !== video_suggested_tag)
        return;
    
    const href = video.querySelector('#thumbnail').getAttribute('href');
    const videoId = href.slice(href.indexOf('=') + 1);
    Promise.all([waitForElement(video, 'yt-formatted-string'), getChannelUrl(videoId)])
    .then(([channelNameElement, url]) =>
    {
        changeChannelNameToLink(channelNameElement, url);
        const videoObserver = new MutationObserver(() => changeChannelNameToLink(channelNameElement, url));
        videoObserver.observe(channelNameElement, {
           attributeFilter: ['title']
        });
    });
};

const addLinksToWatchList = () =>
{
    if(typeof API_KEY === undefined)
        return console.error('Error: extension requires an api key in api.js');
    
    waitForElement(document, video_suggested_tag)
    .then(video => 
    {
        const watch_later = video.parentElement;
        const observer = new MutationObserver(records => 
        {
            records.forEach(record => record.addedNodes.forEach(addChannelLink));
        });
        observer.observe(watch_later, {
            childList: true
        });
        watch_later.childNodes.forEach(addChannelLink);
    });
}

addLinksToWatchList();