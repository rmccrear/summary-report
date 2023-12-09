export function getDataFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if(data) {
        return JSON.parse(data);
    }
    else {
        return null;
    }
}

export function setDataToUrl(data) {
    const params = new URLSearchParams(window.location.search);
    params.set('data', JSON.stringify(data));
    // params.set('data', 'xyz');
    const newUrl = window.location.origin + window.location.pathname + "?" + params.toString();
    console.log(newUrl);
    window.history.pushState({path:newUrl},'',newUrl);
}