// ==UserScript==
// @name        toomanytags
// @namespace   zeratax@firemail.cc
// @description Copies Tags from other sites (currently only panda)
// @include     http://www.tsumino.com/contribute
// @include     http://tsumino.com/contribute
// @require     https://raw.githubusercontent.com/dwachss/bililiteRange/master/bililiteRange.js
// @author      ZerataX
// @version     1.4
// @grant       none
// ==/UserScript==

var currentTag = 0;
var typed = false;
var pandaData;
var maxTags = 0;

// removes additional info from titles
function getTitle(title) {
    title = title.replace(/\([^\)]*\)/g, '')                                        // remove text inside ()
        .replace(/\[[^\]]*\]/g, '')                                                 // remove text inside []
        .replace(/\{[^\}]*\}/g, '');                                                // remove text inside {}
    title =  $('<div/>').html(title).text();                                        // replaces special charcters
    return(title);
}

// used to type into input fields
$.fn.sendkeys = function (x){
    x = x.replace(/([^{])\n/g, '$1{enter}');                                        // turn line feeds into explicit break insertions, but not if escaped
    return this.each( function(){
        bililiteRange(this).bounds('selection').sendkeys(x).select();
        this.focus();
    });
};

// writes tags into input fields
function addTag(array, check, input) {
    if (array[currentTag].search(check) >= 0) {                                     // the panda api is a little weird about tags, they look like: "parody:touhou project" So I have to check every tag in an array individually.
        console.log(array[currentTag]);                                             // logs tag before edit
        var value = array[currentTag].slice(array[currentTag].search(':') + 1);     // removes identifier, eg "parody:" from tag
        console.log(value);                                                         // logs tag after edit
        $('.select2-search__field').focus();                                        // focuses input field
        $('.select2-search__field').eq(input).sendkeys ('{Enter}' + value);         // writes tag into input field
    }
}

// checks what kind the current tag is then passes it to addTag or writes it immediately.
function checkTags(array) {
    tags = array.gmetadata[0].tags;
    typed = true;
    if (currentTag == array.length) {
        typed = false;
    }
    // If available language tags are skipped, since tsumino is english only
    if (tags[currentTag].search('language:') >= 0) {
        if (tags[currentTag] != "language:english") {
         alert("please only upload english translations");   
        }
        console.log("language tag skipped");
        currentTag++;

    }
    if (tags[currentTag].search('language:') >= 0) {
        console.log("language tag skipped");
        currentTag++;
    }
    // tags that don't look weird in the api, like misc, go straight into the input field.
    if (tags[currentTag].search(':') < 0) {
        console.log(tags[currentTag]);
        console.log(tags[currentTag]);
        $('.select2-search__field').focus();
        $('.select2-search__field').eq(6).sendkeys ('{Enter}' + tags[currentTag]);
    }
    // check every tag for it's identifier and write it into it's corresponding input field.
    addTag(tags,'artist:',3);
    addTag(tags,'male:',6);
    addTag(tags,'group:',1);
    addTag(tags,'character:',5);
    addTag(tags,'parody:',4);
    $("#currentTag").text(maxTags - currentTag);
}

// adds button on top of the website
$(document).ready(function(){
    $('.row.row-no-margin').append('<div class="form-group" style="margin-top: 25px;"><button id="load-tags">LOAD TAGS</button><button id="next-tag">NEXT TAG</button></div>Tags Left:<i id="currentTag" class="button-expand-icon">' + currentTag + '</i><hr></hr>');
});

// skips to the next tag
$('#next-tag').click(function() {
    if(typed === true && currentTag <= tags.length - 2) {
        currentTag++;
        checkTags(pandaData);
    }else if (currentTag == tags.length - 1) {
        currentTag++;
        // category field gets added last, due to the way the api structers it's payload
        $('.select2-search__field').focus();
        $('.select2-search__field').eq(0).sendkeys ('{Enter}' + pandaData.gmetadata[0].category);
    }
    console.log(currentTag);
    $("#currentTag").text(maxTags - currentTag);
});

// loads tags from the current gallery
$('#load-tags').click(function() {
    //check if url entered
    if ($('#nttt').val()) {
        //seperate url into its fragments to get gallery_id aka book[4] and gallery_token aka book[5]
        //http://g.e-hentai.org/g/{gallery_id}/{gallery_token}/
        var book = $('#nttt').val().split('/');
        if (book[0] != 'http:') {
            book.unshift('http:','');
        }
        var http = new XMLHttpRequest();
        var url = 'http://g.e-hentai.org/api.php';
        var params = '{  "method": "gdata",  "gidlist": [ [' + book[4] + ',"' + book[5] + '"] ],"namespace": 1 }';
        http.open('POST', url, true);

        //Send the proper header information along with the request
        http.setRequestHeader('Content-type', 'application/json');

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                //var tags = {"gmetadata":[{"gid":618395,"token":"0439fa3666","archiver_key":"407328--dfb5f1192df11db32203e7467969aeca53786f67","title":"(Kouroumu 8) [Handful\u2606Happiness! (Fuyuki Nanahara)] TOUHOU GUNMANIA A2 (Touhou Project)","title_jpn":"(\u7d05\u697c\u59228) [Handful\u2606Happiness! (\u4e03\u539f\u51ac\u96ea)] TOUHOU GUNMANIA A2 (\u6771\u65b9Project)","category":"Non-H","thumb":"http:\/\/gt1.ehgt.org\/14\/63\/1463dfbc16847c9ebef92c46a90e21ca881b2a12-1729712-4271-6032-jpg_l.jpg","uploader":"avexotsukaai","posted":"1376143500","filecount":"20","filesize":51210504,"expunged":false,"rating":"4.43","torrentcount":"0","tags":["parody:touhou project","group:handful happiness","artist:nanahara fuyuki","full color","artbook"]}]};
                pandaData = JSON.parse(http.responseText);
                console.log(pandaData);
                var title_jpn = getTitle(pandaData.gmetadata[0].title_jpn).toLowerCase().trim();
                var title_eng = getTitle(pandaData.gmetadata[0].title).toLowerCase().trim();
                maxTags = pandaData.gmetadata[0].tags.length;
                checkTags(pandaData);
                console.log(title_eng);
                console.log(title_jpn);
                if (title_eng == title_jpn) {
                    $('#name').val( title_eng);
                } else {
                    $('#name').val( title_eng + ' / ' + title_jpn );
                }
            }
        };
        http.send(params);
    }else{
        alert("no url given");                                                      // gives a warning when no url is given
    }
});
