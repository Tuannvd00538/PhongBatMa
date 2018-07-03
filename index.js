const request = require('request');
var tokenFacebook = idPostLog = limit = timeScan = timeComment = idGroup = commentBlock = "";
var listPost = listUser = listCmt = [];

fs = require('fs')
fs.readFile('./config.json', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    data = JSON.parse(data);
    tokenFacebook = data.tokenAdmin;
    idGroup = data.idGroup;
    commentBlock = data.commentBlock;
    idPostLog = data.idPostLog;
    limit = data.limit;
    timeScan = data.timeScan;
    timeComment = data.timeComment;
    var block = commentBlock.split("|");
    function removeDuplicateUsingFilter(arr){
        let unique_array = arr.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        return unique_array
    }

    function checkUser(id) {
        var count = 0;
        listUser.forEach(function (value) {
            if (id == value) {
                count++;
            }
        });
        if (count != 0) {
            return false;
        } else {
            return true;
        }
    }

    setInterval(() => {
        request('https://graph.facebook.com/v3.0/' + idGroup + '/feed?fields=id,message,created_time,from&limit=' + limit + '&access_token=' + tokenFacebook, (error, response, body) => {
            if (error) console.log(error);
            json = JSON.parse(body);
            if (!json.error) {
                for (var i = 0; i < json.data.length; i++) {
                    let idPost = json.data[i].id;
                    listPost.push(idPost);
                };
            }
        });
        listPost = removeDuplicateUsingFilter(listPost);
        if(listPost.length >= 100) {
            listPost = [];
        }
        if (listPost.length != 0) {
            for(var i = 0; i < listPost.length; i++) {
                request('https://graph.facebook.com/v3.0/' + listPost[i] + '/comments?access_token=' + tokenFacebook, (error, response, body) => {
                    if (error) console.log(error);
                    json = JSON.parse(body);
                    if (!json.error && json.length != 0) {
                        for (var j = 0; j < json.data.length; j++) {
                            var cmt = json.data[j].message;
                            var idUserCmt = json.data[j].from.id;
                            var nameUserCmt = json.data[j].from.name;
                            block.forEach(function (value) {
                                if (cmt == value && checkUser(idUserCmt)) {
                                    console.log('blockUser', idUserCmt);
                                    listUser.push(idUserCmt);
                                    var dt = nameUserCmt + "/-name-/" + idUserCmt + "/-id-/" + cmt;
                                    listCmt.push(dt);
                                    request('https://graph.facebook.com/' + idGroup + '/members?method=delete&member=' + idUserCmt + '&access_token=' + tokenFacebook, (error, response, body) => {
                                        if (error) console.log(error);
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
        listUser = removeDuplicateUsingFilter(listUser);
        if(listUser.length >= 100) {
            listUser = [];
        }
    }, timeScan);

    setInterval(() => {
        for (let i = 0; i < listCmt.length; i++) {
            var element = listCmt[i];
            var name = element.split('/-name-/');
            var id = name[1].split('/-id-/');
            var cmtLog = "Kick User '" + name[0] + " (fb.com/" + id[0] + ")' | Comment '" + id[1] + "'";
            if (cmtLog.trim() != "")
                request("https://graph.facebook.com/" + idPostLog + "/comments/?method=post&message=" + encodeURI(cmtLog) + "&access_token=" + tokenFacebook, (err, res, body) => {
                    json = JSON.parse(body);
                    console.log(json)
                    if (!(json["error"] == undefined || json["error"] == null)) {
                        console.log("COMMENT '" + cmtLog + "' Thất bại");
                    }

                });
            listCmt = listCmt.filter(item => item !== element);
        }
        listCmt = removeDuplicateUsingFilter(listCmt);
    }, timeComment);
});