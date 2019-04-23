/* jshint esversion:6 */
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const Max = require('max-api');
const Subs = require('./sub.json');
const Clips = require('./list.json');


const MAX_PLAYLIST = 4; // 最大列表數量
const MIN_DIFF_CLIP_GAP = 5; // 最小不可重複的連續列表元素數量
//const TOTAL_DURATION = 450; // 列表目標時間

let sub = _.sample(Subs);
let TOTAL_DURATION = Math.round(sub.content.duration);
var sub_content = sub.dir + '/' + sub.content.filename;

class Item {
    /**
     * @param {NewClip} clip
     * @param {number} start Start time(second)
     */
    constructor(clip, start) {
        this.id = clip.id;
        this.kind = clip.kind;
        this.path = clip.path;
        this.duration = clip.duration;
        this.start = Math.round(start);
        this.end = Math.round(start + clip.duration);
        // console.log(this);
    }

    setStartTime(t) {
        this.start = t;
        this.end = t + this.duration;
    }
}

function clearAllClipTag(clips) {
    clips.forEach(clip => {
        clip.content.tag = 0;
    });
}



/**
 * @typedef {Object} NewClip
 * @property {number} id
 * @property {string} path
 * @property {string} kind
 * @property {number} tag
 * @property {number} duration
 *
 * @returns {NewClip}
 */
function mapping(f, key) {
    return {
        id: key,
        path: path.join(f.dir, f.content.filename),
        kind: getKind(f.dir),
        tag: f.content.tag,
        duration: f.content.duration
    };
}

/**
 *
 * @param {string} path
 */
function getKind(path) {
    return path.split(/\\\\|\//).pop();
}

/**
 *
 * @param {Array<Object>} clips
 */
function getAllKind(clips) {
    let result = [];
    clips.forEach(o => {
        result.push(getKind(o.dir));
    });

    return _.uniq(result);
}

/**
 * @typedef {Object} ClipListInfos
 * @property {Array<number>} ids
 * @property {Object} clips Use id be property name, clip be value.(like key-value)
 */

/**
 * @returns {ClipListInfos}
 */
function mappingToNewClips(clips, ignoreTag) {
    ignoreTag = ignoreTag === undefined ? false : true;

    let newClips = _.map(clips, mapping);
    let result = {};
    newClips.forEach(ele => {
        if (result[ele.kind] === undefined) {
            result[ele.kind] = {};
            result[ele.kind].ids = [];
            result[ele.kind].clips = {};
        }

        if (!ignoreTag && ele.tag !== 0) {
            return;
        }

        result[ele.kind].ids.push(ele.id);
        result[ele.kind].clips[ele.id] = ele;
    });

    return result;
}

/**
 * @typedef {Object} PickInfo
 * @property {Array<string>} kinds
 * @property {Object} clips
 *
 * @returns {PickInfo}
 */
function generatePickInfo(inputClips, ignoreTag) {
    let clips = mappingToNewClips(inputClips, ignoreTag);
    let kinds = getAllKind(inputClips);

    return {
        kinds: kinds,
        clips: clips
    };
}

/**
 * 取得列表已使用的種類
 * @param {Array<Item>} playlist
 * @param {number} clipGap 最後 x 個項目使用的種類
 */
function getUsedKind(playlist, clipGap) {
    let usedKind = [];
    let start = playlist.length - 1;
    let end = playlist.length > clipGap ? playlist.length - clipGap : 0;
    for (let index = start; index >= end; index--) {
        const element = playlist[index];
        usedKind.push(element.kind);
    }

    return usedKind;
}

/**
 * 取得目前列表要使用的時段
 * @param {Array<Item>} playlist
 */
function getNextStartTime(playlist) {
    return _.sumBy(playlist, function (o) { return o.duration; }) + 1;
}

/**
 * 取得可以使用的種類
 * @param {number} startTime
 * @param {Array<string>} allKinds
 * @param {Array<Item>} myPlayList
 * @param {number} minDiffClipGap
 * @param  {...Array<Item>} otherPlayLists
 */
function getCanPickKinds(startTime, allKinds, myPlayList, minDiffClipGap, ...otherPlayLists) {
    let usedKinds = [];
    usedKinds.push(...getUsedKind(myPlayList, minDiffClipGap));

    let sameTimeItems = getTimeItems(startTime, otherPlayLists);
    sameTimeItems.forEach(item => {
        usedKinds.push(item.kind);
    });

    return _.difference(allKinds, usedKinds);
}

/**
 * 確認是否所有列表都完成了
 * @param {Array<Array<Item>} playlists All Playlist
 * @param {number} targetDuration Total duration time of every playlist
 */
function isDone(playlists, targetDuration) {
    return _.every(playlists, function (p) {
        let sum = _.sumBy(p, function (o) { return o.duration; });
        if (sum < targetDuration) {
            return false;
        }
        return true;
    });
}

/**
 * 取得某時間的其他列表使用的項目
 * @param {number} time
 * @param  {...Array<Item>} otherPlayLists
 * @returns {Array<Item>}
 */
function getTimeItems(time, ...otherPlayLists) {
    let result = [];
    otherPlayLists.forEach(playlist => {
        playlist.forEach(item => {
            if (item.start >= time && item.end <= item) {
                result.push(_.assign({}, item));
            }
        });
    });

    return result;
}

/**
 * @param {Array} inputClips 輸入的 Clip 資料
 * @param {number} maxPlayList 最大列表數量
 * @param {number} totalDuration 每個列表總長度
 * @param {number} minDiffClipGap 最小不可重複的連續列表元素數量
 *
 * @returns {Array<Array<Item>>}
 */
function pickPlayList(inputClips, maxPlayList, totalDuration, minDiffClipGap) {
    let pickInfo = generatePickInfo(inputClips);

    /** @type {Array<Array<Item>>} */
    let allPlaylist = Array(maxPlayList);
    for (let index = 0; index < allPlaylist.length; index++) {
        allPlaylist[index] = [];
    }

    let usedIds = [];
    let currentPlaylistIndex = 0;
    let saveCounter = maxPlayList * 100;
    while (!isDone(allPlaylist, totalDuration)) {
        if (saveCounter-- <= 0) {
            console.error('Try too much times. Can not generator playlist');
            break;
        }

        // 取得可使用的種類
        const currentPlaylist = allPlaylist[currentPlaylistIndex];
        if (isDone([currentPlaylist], totalDuration)) {
            currentPlaylistIndex = ++currentPlaylistIndex % allPlaylist.length;
            continue;
        }
        const otherPlaylists = allPlaylist.slice(currentPlaylistIndex, 1);

        let nextStartTime = getNextStartTime(currentPlaylist);
        let canTakeKinds = getCanPickKinds(nextStartTime,
            pickInfo.kinds,
            currentPlaylist, minDiffClipGap,
            ...otherPlaylists);

        // 亂數取得一個種類
        let thisKind = _.sample(canTakeKinds);
        /** @type {ClipListInfos} */
        let info = pickInfo.clips[thisKind];

        // 挑選項目
        let canTakeIds = _.filter(info.ids, id => {
            return !_.includes(usedIds, id);
        });

        if (_.isEmpty(canTakeIds)) {
            console.log('reborn');
            pickInfo = generatePickInfo(inputClips, true);
            clearAllClipTag(inputClips);
            continue;
        }

        let pickedId = _.sample(canTakeIds);
        usedIds.push(pickedId);
        /** @type {NewClip} */
        let newClip = info.clips[pickedId];
        let item = new Item(newClip, nextStartTime);
        currentPlaylist.push(item);

        // next playlist
        currentPlaylistIndex = ++currentPlaylistIndex % allPlaylist.length;
    }

    return allPlaylist;
}

let result = pickPlayList(Clips, MAX_PLAYLIST, TOTAL_DURATION, MIN_DIFF_CLIP_GAP);
console.log(result);
console.log(TOTAL_DURATION);
let a = [];
let b = [];
let c = [];
let d = [];
_.forEach(result[0], (o) => {
    //console.log(o.path);
    a.push(o.path);
});
_.forEach(result[1], (o) => {
    //console.log(o.path);
    b.push(o.path);
});
_.forEach(result[2], (o) => {
    //console.log(o.path);
    c.push(o.path);
});
_.forEach(result[3], (o) => {
    //console.log(o.path);
    d.push(o.path);
});
if (sub_content.toString().includes('/en') == true) {
    let sub_zh = sub_content.toString().replace('/en', '/zh');
    Max.outlet('sub_zh', sub_zh);
    Max.outlet('sub_en', sub_content);
} else {
    let sub_en = sub_content.toString().replace('/zh', '/en');
    Max.outlet('sub_zh', sub_content);
    Max.outlet('sub_en', sub_en);
}

//console.log(a);
Max.outlet('result[0]', a);
Max.outlet('result[1]', b);
Max.outlet('result[2]', c);
Max.outlet('result[3]', d);
Max.outlet('totalduration', TOTAL_DURATION);

// 取得此次使用的 id 並更新 list.json
let usedIds = [];
result.forEach(p => {
    usedIds.push(..._.map(p, item => { return item.id; }));
});
usedIds.forEach(id => {
    Clips[id].content.tag = 1;
});
fs.writeFileSync('list.json', JSON.stringify(Clips, null, 4));