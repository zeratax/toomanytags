// ==UserScript==
// @name         toomanytags
// @version      1.7.4
// @description  Copies Tags from other sites (currently only panda)
// @author       ZerataX
// @namespace    mail@zera.tax
// @license      MIT
// @updateURL    https://openuserjs.org/meta/ZerataX/tmt.meta.js
// @include      /^https?://(www\.)?tsumino\.com/*
// @include      /^https?://(www\.)?pururin\.(us|io)\/contribute\/upload
// @require      https://raw.githubusercontent.com/dwachss/bililiteRange/master/bililiteRange.js
// @require      https://raw.githubusercontent.com/dwachss/bililiteRange/master/jquery.sendkeys.js
// @grant        none
// ==/UserScript==

var typed = false;
var currentTag = 0;
var maxTags = 0;
var load_btn = document.createElement("a");
var next_btn = document.createElement("a");
var tag_counter = document.createElement("span");
var pandaData;


function create_interface(){
    // adds button on top of the website
    if (window.location.hostname.replace("www.", "").split(".")[0] == "pururin") {
        var form_group = $('#uploadHentai');

        load_btn.id = "load-tags";
        form_group.append(load_btn);
        load_btn.innerHTML = '<i class="fa fa-tags"></i> Load Tags';
        load_btn.classList.add('btn');
        load_btn.classList.add('btn-gray');
        load_btn.classList.add('btn-sm');
        load_btn.onclick = function() { load_tags(); };

        next_btn.id = "next-tag";
        form_group.append(next_btn);
        next_btn.innerHTML = '<i class="fa fa-arrow-circle-o-right"></i> Next Tag';
        next_btn.classList.add('btn');
        next_btn.classList.add('btn-gray');
        next_btn.classList.add('btn-sm');
        next_btn.onclick = function() { next_tag(); };

        form_group.append(tag_counter);
        tag_counter.innerHTML = "0/0 Tags";
        tag_counter.style.color = "white";
    }else{
        alert("if you're still using this and want an update make an issue on github https://github.com/ZerataX/toomanytags/issues/new");
    }

}


// removes additional info from titles
function getTitle(title) {
    title = title.replace(/\([^\)]*\)/g, '')                                        // remove text inside ()
        .replace(/\[[^\]]*\]/g, '')                                                 // remove text inside []
        .replace(/\{[^\}]*\}/g, '')                                                 // remove text inside {}
        .replace(/\=[^\=]*\=/g, '');                                                // remove text inside ==
    title =  $('<div/>').html(title).text();                                        // replaces special charcters
    return(title);
}


// writes tags into input fields
function addTag(array, type, field) {
    if (array[currentTag].search(type) >= 0) {                                     // the panda api is a little weird about tags, they look like: "parody:touhou project" So I have to check every tag in an array individually.
        var value = array[currentTag].slice(array[currentTag].search(':') + 1);     // removes identifier, eg "parody:" from tag
        console.log(value);
        var input_field = $('.tt-input:eq('+ field +')');
        input_field.focus();
        input_field.trigger({type: 'keydown', key: "Backspace" });
        for (var index = 0; index < value.length; index++) {

            input_field.trigger({type: 'keydown', key: String(value).charAt(index) });
        }
        //input_field.val(value);
    }
}


// checks what kind the current tag is then passes it to addTag or writes it immediately.
function checkTags(array) {
    tags = array.gmetadata[0].tags;
    typed = true;
    if (currentTag == array.length) {
        typed = false;
    }
    if (tags[currentTag].search('language:') >= 0) {
        if (tags[currentTag].search('language:japanese') >= 0) {
            $('.form-control[name="language"]').val("13011");
        }else if(tags[currentTag].search('language:english') >= 0) {
            $('.form-control[name="language"]').val("13010");
        }else if (tags[currentTag] != "language:english" || tags[currentTag] != "language:japanese") {
            alert("please only upload english translations or japanese content");
        }
        currentTag++;
    }
    // tags that don't look weird in the api, like misc, go straight into the input field.
    if (tags[currentTag].search(':') < 0) {
        addTag(tags,'',4);
    }

    // check every tag for it's identifier and write it into it's corresponding input field.
    addTag(tags,'artist:',0);
    addTag(tags,'male:',4);
    addTag(tags,'group:',1);
    addTag(tags,'character:',3);
    addTag(tags,'parody:',2);

    $("#currentTag").text(maxTags - currentTag);
}


// skips to the next tag
function next_tag() {
    if(typed === true && currentTag <= tags.length - 2) {
        currentTag++;
        checkTags(pandaData);
    }else if (currentTag == tags.length - 1) {
        currentTag++;
        // category field gets added last, due to the way the api structers it's payload
        switch (pandaData.gmetadata[0].category.toLowerCase()) {
            case "doujinshi":
                $('.form-control[name="category"]').val("13003");
                break;
            case "artbook":
                $('.form-control[name="category"]').val("13001");
                break;
            case "game cg sets":
                $('.form-control[name="category"]').val("13008");
                break;
            case "manga":
                $('.form-control[name="category"]').val("13004");
                alert("Please make sure this is a Manga and not a Manga One-shot");
                break;
            case "artist cg sets":
                $('.form-control[name="category"]').val("13006");
                break;
            case "image sets":
                $('.form-control[name="category"]').val("13006");
                break;
            case "western":
                alert("this gallery has western origin");
                break;
            default:
                alert("category non-h is not a pururin category");
                break;
        }
        //alert("All tags used!");
        tag_counter.style.color = "#D45776";
    }
    console.log(currentTag);
    tag_counter.innerHTML = currentTag + "/" + maxTags + " Tags";
}


// loads tags from the current gallery
function load_tags() {
    //check if url entered
    source_link = $('.form-control[name="source"]');
    if (source_link.val()) {
        //seperate url into its fragments to get gallery_id aka book[4] and gallery_token aka book[5]
        //http://g.e-hentai.org/g/{gallery_id}/{gallery_token}/
        var book = source_link.val().replace("https:", "http:").split('/');
        if (book[0] != 'http:') {
            book.unshift('http:','');
        }
        var http = new XMLHttpRequest();
        var url = 'https://e-hentai.org/api.php';
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
                tag_counter.innerHTML = "0/" + maxTags + " Tags";
                checkTags(pandaData);
                console.log(title_eng);
                console.log(title_jpn);
                if (title_eng.toLowerCase() == title_jpn.toLowerCase()) {
                    $('.form-control[name="english"]').val(title_eng);
                } else {
                    $('.form-control[name="english"]').val(title_eng);
                    $('.form-control[name="japanese"]').val(title_jpn);
                }
            }
        };
        http.send(params);
    }else{
        alert("no url given");                                                      // gives a warning when no url is given
    }
}


function doc_keyUp(e) {
    if(e.code == "Enter") {
        next_tag();
    }
}


document.addEventListener('keyup', doc_keyUp, false);

window.onload = create_interface();
