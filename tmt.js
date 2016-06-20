// ==UserScript==
// @name        toomanytags
// @namespace   zeratax@firemail.cc
// @description Copies Tags from other sites (currently only panda)
// @include     http://www.tsumino.com/contribute
// @include     http://tsumino.com/contribute
// @require	    https://raw.githubusercontent.com/dwachss/bililiteRange/master/bililiteRange.js
// @author      PetersPark
// @version     1
// @grant       none
// ==/UserScript==

var currentTag = 0;
var typed = false;
var pandaData;
var maxTags = 0;


function getTitle(title) {
    title = title.replace(/\([^\)]*\)/g, '') // remove text inside ()
        .replace(/\[[^\]]*\]/g, ''); // remove text inside []
    return(title);
}

$.fn.sendkeys = function (x){
    x = x.replace(/([^{])\n/g, '$1{enter}'); // turn line feeds into explicit break insertions, but not if escaped
    return this.each( function(){
        bililiteRange(this).bounds('selection').sendkeys(x).select();
        this.focus();
    });
};

function addTag(array, check, input) {
    if (array[currentTag].search(check) >= 0) {
        console.log(array[currentTag]);
        var value = array[currentTag].slice(array[currentTag].search(':') + 1);
        console.log(value);
        $('.select2-search__field').focus();
        $('.select2-search__field').eq(input).sendkeys ('{Enter}' + value);
    }
}

function checkTags(array) {
    tags = array.gmetadata[0].tags;
    typed = true;
    if (currentTag == array.length) {
        typed = false;
    }
    if (tags[currentTag].search('language:') >= 0) { currentTag++; $("#currentTag").text(currentTag);}
    if (tags[currentTag].search('language:') >= 0) { currentTag++; $("#currentTag").text(currentTag);}
    if (tags[currentTag].search(':') < 0) {
        console.log(tags[currentTag]);
        console.log(tags[currentTag]);
        $('.select2-search__field').focus();
        $('.select2-search__field').eq(6).sendkeys ('{Enter}' + tags[currentTag]);
    }
    addTag(tags,'artist:',3);
    addTag(tags,'male:',6);
    addTag(tags,'group:',1);
    addTag(tags,'character:',5);
    addTag(tags,'parody:',4);
}


$(document).ready(function(){
    $('.row.row-no-margin').append('<div class="form-group" style="margin-top: 25px;"><button id="load-tags">LOAD TAGS</button><button id="next-tag">NEXT TAG</button></div>Tags Left:<i id="currentTag" class="button-expand-icon">' + currentTag + '</i>/<i id="maxTags" class="button-expand-icon">' + maxTags + '</i><hr></hr>');
});

$('#next-tag').click(function() {
    console.log(currentTag);
    if(typed === true && currentTag < tags.length) {
        checkTags(pandaData);
        currentTag++;
        $("#currentTag").text(currentTag);
    }else{
        $('.select2-search__field').focus();
        $('.select2-search__field').eq(0).sendkeys ('{Enter}' + pandaData.gmetadata[0].category);
    }
});

$('#load-tags').click(function() {
    if ($('#nttt').val()) {

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
                var title_jpn = getTitle(pandaData.gmetadata[0].title_jpn).trim();
                var title_eng = getTitle(pandaData.gmetadata[0].title).trim();
                maxTags = pandaData.gmetadata[0].tags.length;
                $("#maxTags").text(maxTags);
                checkTags(pandaData);
                $('#name').val( title_eng + ' / ' + title_jpn );
            }
        };
        http.send(params);
    }else{
        alert("no url given");
    }
});
