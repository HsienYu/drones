const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const _files = require("./list.json");

const MaxPlaylist = 4;

const totalDuration = 450;

function mapping(f, key) {
    return {
        id: key,
        path: path.join(f.dir, f.content.filename),
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

let files = _.map(_files, mapping);
let pickFiles = _.shuffle(files);

let playlists = [];

for (let index = 0; index < MaxPlaylist; index++) {
    let playlist = [];
    let remainTime = totalDuration;
    while (remainTime > 0) {
        let clip = pickFiles.pop();
        playlist.push(clip);
        remainTime -= Math.round(clip.duration);
    }

    playlists[index] = playlist;
}

console.log(_.map(playlists, mapToPlayList));

let final_playlist = _.map(playlists, mapToPlayList);

module.exports.final_playlist;