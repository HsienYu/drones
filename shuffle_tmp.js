const path = require('path');
const util = require('util');
const fs = require('fs');
const _ = require('lodash');


const Subs = require('./sub.json');
const Clips = require('./list.json');

const MAX_PLAYLIST = 4;

let sub = _.sample(Subs);
//console.log(sub.dir.includes("/en"));
//console.log(sub.dir.includes("/zh"));

let totalDuration = Math.round(sub.content.duration);

//console.log(sub);
//console.log(totalDuration);

function mapping(f, key) {
    return {
        id: key,
        path: path.join(f.dir, f.content.filename),
        tag: f.content.tag,
        duration: f.content.duration
    };
}

function mapToPlayList(playlist, key) {
    return {
        index: key,
        content: playlist,
        size: playlist.length,
        totalDuration: _.sumBy(playlist, function (o) { return Math.round(o.duration); })
    };
}


function generatePickFiles(pickedIds, ignoreTag) {
    pickedIds = pickedIds || [];
    ignoreTag = ignoreTag === undefined ? false : true;

    let newFiles = _.map(Clips, mapping);
    //console.log(newFiles);

    let remainingFiles = ignoreTag ?
        newFiles :
        _.filter(newFiles, function (f) {
            return f.tag == 0;
        });

    let files = _.filter(remainingFiles, function (f) {
        return !pickedIds.includes(f.id);
    });

    return _.shuffle(files);
}


let pickFiles = generatePickFiles();
// check remaining files and remaining total duration
// if not enough reset all tag to 0 and add all file to remainingFiles
console.log(pickFiles);

if (pickFiles.length == 0) {
    _.each(Clips, function (c) {
        c.content.tag = 0;
    });

    pickFiles = generatePickFiles();
    if (pickFiles.length == 0) {
        console.error('Can not find any files');
        return;
    }
}

let playlists = [];
let ids = [];

for (let index = 0; index < MAX_PLAYLIST; index++) {
    let playlist = [];
    let remainTime = totalDuration;
    while (remainTime > 0) {
        let clip = pickFiles.pop();
        if (!clip) {
            // re-create pickFiles
            pickFiles = generatePickFiles(ids, true);
            continue;
        }
        //console.log(clip);

        playlist.push(clip);
        ids.push(clip.id);
        // modify clip
        Clips[clip.id].content.tag = 1;

        remainTime -= Math.round(clip.duration);
    }

    playlists[index] = playlist;
}

fs.writeFileSync('list.json', JSON.stringify(Clips, null, 4));
var obj = _.map(playlists, mapToPlayList);
obj.push(sub);

//console.log(sub);
//console.log(util.inspect(_.map(playlists, mapToPlayList), false, null, true /* enable colors */));