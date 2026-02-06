
const apiKey = "AIzaSyD2XzwhQH1baDJE-lc1MT-jUYWPf1sfLTU";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
