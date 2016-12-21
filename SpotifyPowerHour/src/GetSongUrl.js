
//runs fetch to get embeddable url for requested song

export function GetSongUrl(song, artist) {
    return fetch("https://www.googleapis.com/youtube/v3/search?&part=snippet&q=lyrics"+song+artist+"&type=video&key=REDACTED_GOOGLE_API_KEY")
    .then(function(res) {
      return res.json() ;
    }).then(function(json) {
        /** return "https://www.youtube.com/embed/watch?v="+json.items[0].id.videoId+"?autoplay=1" **/
        return "http://www.youtube.com/embed/"+json.items[0].id.videoId+"?autoplay=1"
    });
}

