if (typeof browser === "undefined")
{
    var browser = chrome;
}

document.getElementById('api-form').addEventListener("submit", e =>
{
    e.preventDefault();
    const input = document.getElementById('api-input');
    browser.storage.sync.set({
        api_key: input.value
    });
    input.value = '';
});