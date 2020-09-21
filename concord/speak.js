const fs = require("fs");

const speak = (connection, filename) => {
    var nowRec = `data/${filename}.opus`;
    fs.access(nowRec, fs.constants.R_OK, (err) => {
        try {
            if (!err) {
                connection.play(nowRec, {format: "ogg"});
            } else {
                console.error(err);
            }
        } catch (ex) {
            console.error(ex);
        }
    });    
}

exports.speak = speak;