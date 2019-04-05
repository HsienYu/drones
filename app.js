const list_obj = require("./list.json");
const _ = require('lodash');


var new_obj = list_obj;

var _dir = null;

var total_duration = 450;


_.forEach(new_obj, items => {

    if (_dir != items.dir) {
        //console.log('diff dir');
        if (items.content.tag == 0) {
            items.content.tag = 1;
            var duration = parseInt(items.content.duration);
            total_duration -= Math.round(duration);
            console.log('filename:', items.content.filename, 'duration:', items.content.duration, 'tag', items.content.tag);
        }
        console.log('total', total_duration);
    }
    //console.log('same dir')

    _dir = items.dir;

    if (total_duration == 0) return false;
});



