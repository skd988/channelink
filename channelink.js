//const isFirefox = typeof InstallTrigger !== 'undefined';
// const watch_later_selector = isFirefox? 
            // '#items > ytd-item-section-renderer > #contents' :
            // 'ytd-watch-next-secondary-results-renderer > #items';

const watch_later_selector = 'ytd-watch-next-secondary-results-renderer > #items';

const createElementFromHtml = htmlString => 
{
	const elem = document.createElement('template');
	elem.innerHTML = htmlString.trim();
	return elem.content;
};

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

const waitForElementToDisappear = (target, selector) =>
{
    return new Promise((resolve, reject) => 
    {
        const selection = target.querySelector(selector);
        if (!selection)
            return resolve();
        
        const observer = new MutationObserver(() => 
        {
            const selection = target.querySelector(selector);
            if(!selection)
            {
                observer.disconnect();
                return resolve();
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
			const parent = channel.parentElement;
			const newChannel = channel.cloneNode(true);
			newChannel.innerText = channel.innerText;
			//const linkElement = createElementFromHtml('<a class="yt-simple-endpoint style-scope yt-formatted-string" \
            //        href="' + handler + '"/>');
			const linkElement = document.createElement('a');
			linkElement.setAttribute('href', handler);
			const linkElementNode = parent.appendChild(linkElement);

			const newChannelNode = linkElementNode.appendChild(newChannel);
			newChannelNode.innerText = channel.innerText;
			parent.removeChild(channel);
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
    waitForElement(document, watch_later_selector)
    .then(watch_later => 
    {
		const observer = new MutationObserver(records => 
		{
			records.forEach(record => record.addedNodes.forEach(addChannelLink));
		});
        observer.observe(watch_later, {
            childList: true
        });
		
		
        Array.from(watch_later.childNodes).forEach(addChannelLink)
    });
};

console.log('hello');
changeToLinks();