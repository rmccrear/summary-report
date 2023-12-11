// import { data } from "./data.js";

export async function getGradeData(key, name) {
    let url = `https://api.sheety.co/${key}/${name}/allBadges`;
    const data = await fetch(url)
        .then((response) => response.json())
        .then(json => {
            // Do something with the data
            console.log(json.allBadges);
            return json.allBadges
        });
    return data;
}