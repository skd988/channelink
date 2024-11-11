const isFirefox = typeof InstallTrigger !== 'undefined'
const watch_later_selector = isFirefox? 
            '#items > ytd-item-section-renderer > #contents' :
            'ytd-watch-next-secondary-results-renderer > #items';

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

const addChannelLink = video =>
{
    waitForElement(video, 'yt-formatted-string')
    .then(channel => 
    {
        const href = video.querySelector('a').getAttribute('href');
        getChannelHandler(href.slice(href.indexOf('=') + 1))
        .then(handler =>
        {
            channel.innerHTML = '<a class="yt-simple-endpoint style-scope yt-formatted-string" \
                    href="' + handler + '">' + channel.innerText + '</a>';                    
        });
    });
};

const status = response => 
{
    return response.ok? Promise.resolve(response.json()) : Promise.reject('Error:' + response.status);
};

const getChannelHandler = videoId =>
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
            return data?.items?.length?
                data.items[0].snippet.customUrl
                : Promise.reject('Data is invalid')
        })
        .catch(error => console.error(error));
};

const changeToLinks = async () =>
{    
    const observer = new MutationObserver(records => 
    {
        records.forEach(record => record.addedNodes.forEach(addChannelLink));
    });

    waitForElement(document, watch_later_selector)
    .then(watch_later => 
    {
        observer.observe(watch_later, {
            childList: true
        });
        Array.from(watch_later.childNodes).forEach(addChannelLink)
    });
};

changeToLinks();