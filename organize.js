const content = require('./shuffle');
const _ = require('lodash');
const path = require('path');
const Max = require('max-api');

/* const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true); */

var a = 0;
var b = 0;
var c = 0;
var d = 0;
var _content = content();
var sc_a_content = _.find(_content, { index: 0 }).content;
var sc_b_content = _.find(_content, { index: 1 }).content;
var sc_c_content = _.find(_content, { index: 2 }).content;
var sc_d_content = _.find(_content, { index: 3 }).content;
var sub_content = _content[4].dir + '/' + _content[4].content.filename;


//console.log(sub_content.includes("/zh"));
//console.log(sub_content.includes("/en"));




/* process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else if (key.name === 'p') {
        i += 1;
        console.log('subtitle', sub_content);
        if (i < sc_a_content.length) {
            console.log('sc_a_path', sc_a_content[i].path);
        }
        if (i < sc_b_content.length) {
            console.log('sc_b_path', sc_b_content[i].path);
        }
        if (i < sc_c_content.length) {
            console.log('sc_c_path', sc_c_content[i].path);
        }
        if (i < sc_d_content.length) {
            console.log('sc_d_path', sc_d_content[i].path);
        }
    }
}); */


Max.addHandler("sc_a", () => {
    a += 1;
    //console.log('subtitle', sub_content);
    //Max.outlet('subtitle', sub_content);
    if (a < sc_a_content.length) {
        //console.log('sc_a_path', sc_a_content[i].path);
        Max.outlet('sc_a_path', sc_a_content[a].path);
    }

});

Max.addHandler("sc_b", () => {
    b += 1;
    //console.log('subtitle', sub_content);
    //Max.outlet('subtitle', sub_content);
    if (b < sc_b_content.length) {
        //console.log('sc_b_path', sc_b_content[i].path);
        Max.outlet('sc_b_path', sc_b_content[b].path);
    }
});

Max.addHandler("sc_c", () => {
    c += 1;
    //console.log('subtitle', sub_content);
    //Max.outlet('subtitle', sub_content);
    if (c < sc_c_content.length) {
        //console.log('sc_b_path', sc_b_content[i].path);
        Max.outlet('sc_c_path', sc_c_content[c].path);
    }
});

Max.addHandler("sc_d", () => {
    d += 1;
    //console.log('subtitle', sub_content);
    //Max.outlet('subtitle', sub_content);
    if (d < sc_d_content.length) {
        //console.log('sc_b_path', sc_b_content[i].path);
        Max.outlet('sc_d_path', sc_d_content[d].path);
    }
});


Max.addHandler("subtitle", () => {
    if (sub_content.toString().includes('/en') == true) {
        let sub_zh = sub_content.toString().replace('/en', '/zh');
        Max.outlet('sub_zh', sub_zh);
        Max.outlet('sub_en', sub_content);
    } else {
        let sub_en = sub_content.toString().replace('/zh', '/en');
        Max.outlet('sub_zh', sub_content);
        Max.outlet('sub_en', sub_en);
    }
});