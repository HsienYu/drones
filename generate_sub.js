const fs = require('fs');
const path = require('path');
const async = require('async');
const { getVideoDurationInSeconds } = require('get-video-duration');

var dict = [];


fs.readdir('./assets/subs/', (err, items) => {
    //console.log(items);
    // loop through each directory
    async.eachSeries(items, (dir, cb1) => {
        //console.log('reading', dir);
        var dir = __dirname + '/assets/subs/' + dir;
        console.log('reading', dir);
        // get files for the directory
        fs.readdir(dir, (err, files) => {
            if (err) return cb1(err);
            // loop through each file
            async.eachSeries(files, (file, cb2) => {
                var filePath = path.resolve(dir + '/' + file);
                //console.log(filePath);
                // get info for the file
                fs.stat(filePath, (err, stats) => {
                    if (err) return cb2(err);
                    getVideoDurationInSeconds(filePath).then((duration) => {
                        var fileInfo = {
                            dir: dir, content: { filename: file, duration: duration, tag: 0 }
                        };
                        console.log('fileInfo', fileInfo);
                        dict.push(fileInfo);
                        cb2(null, fileInfo);


                    });
                });
            }, cb1);

        });
    }, (err, fileInfos) => {
        if (err) {
            console.info('error', err);
            return;
        }
        //done reading all the files, do something...
        console.log('done of reading all files!')
        //console.log('all', dict);
        fs.writeFile("sub.json", JSON.stringify(dict), function (err) {
            if (err) throw err;
            console.log('complete');
        });
    });
})

