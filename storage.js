

export function getDataFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if(data) {
        try {
          return urlon.parse(data);
        } catch {
            console.log("Couldn't parse data in query string.")
        }
    }
    else {
        return null;
    }
}

export function setDataToUrl(data) {
    const params = new URLSearchParams(window.location.search);
    params.set('data', urlon.stringify(data));
    // params.set('data', JSON.stringify(data));
    // params.set('data', 'xyz');
    const newUrl = window.location.origin + window.location.pathname + "?" + params.toString();
    console.log(newUrl);
    window.history.pushState({path:newUrl},'',newUrl);
}