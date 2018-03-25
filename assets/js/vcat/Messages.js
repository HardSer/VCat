function getMessageDialogs() {
    logInfo("DialogList", "Get DialogList");
    var url = "https://api.vk.com/method/execute.getDialogsWithProfilesNewFixGroups?lang=ru&https=1&count=40&access_token=" + token + "&v=5.69";
    url = craftURL(url);
    $.ajax({
        url: url,
        success: function (response) {
            //$('.cardContainer').append(response);
            var result = JSON.parse(response);
            logInfo("DialogList", "Got DialogList JSON");
            $.each(result['response']['a']['items'], function (index, value) {
                var dialogID = value['message']['user_id'];
                var name;
                if (value['message']['title'].length > 0) {
                    // No group chats for now, sorry!
                    var isGroup = "(Беседа)";
                    var isGroup2 = true;
                    var debugInfo2 = '<p class="card-text smallText"> <i>ID: ' + dialogID + '</i></p>\n';
                    if (!debugInfo) {
                        debugInfo2 = "<p></p>";
                    }
                     name = value['message']['title'] + " " + isGroup;
                     dialogID = parseInt(value['message']['chat_id']) + 2000000000;
                     $('.cardContainer').append('<div class="card cardDecor semi-transparent showDialog message messageBorder" vcat-isGroup="'+isGroup2+'" vcat-dialog="'+dialogID+'">\n' +
                     '    <div class="card-body messagePadding">\n' +
                     '        <h5 class="card-title noPadding smallTitle">' + name + '</h5>\n' +
                     '        <p class="card-text">' + value['message']['body'] + '</p>\n' +
                         debugInfo2 +
                     '    </div>\n' +
                     '</div>');
                } else {
                    name = getMessageDialogTitle(dialogID, result['response']);
                    var debugInfo2 = '<p class="card-text smallText"> <i>ID: ' + dialogID + '</i></p>\n';
                    if (!debugInfo) {
                        debugInfo2 = "<p></p>";
                    }
                    $('.cardContainer').append('<div class="card cardDecor semi-transparent showDialog message messageBorder" vcat-username="' + name + '" vcat-dialog="' + dialogID + '">\n' +
                        '    <div class="card-body messagePadding">\n' +
                        '        <h5 class="card-title noPadding smallTitle">' + name + '</h5>\n' +
                        '        <p class="card-text">' + value['message']['body'] + '</p>\n' +
                        debugInfo2 +
                        '    </div>\n' +
                        '</div>');
                }
            });
            feather.replace();
            $('.spinnerLoad').hide();
            $(".showDialog").click(function () {
                getMessages($(this).attr('vcat-dialog'), $(this).attr('vcat-username'), $(this).attr('vcat-isGroup'));
            });
            logInfo("DialogList", "Finish DialogList");
        }
    });
}

function getMessageDialogTitle(source_id, json) {
    var result;
    $.each(json['p'], function (index, value) {
        if (value['id'] === source_id) {
            result = value['first_name'] + " " + value['last_name'];
            return false;
        }
    });
    return result;
}

function getMessages(dialogID, uname, isGroup) {
    logInfo("Dialog", "Get Dialog");
    var url = "https://api.vk.com/method/messages.getHistory?lang=ru&peer_id=" + dialogID + "&access_token=" + token + "&v=5.74";
    url = craftURL(url);
    $('.cardContainer').html('<center class="spinnerLoad"><div class="spinner"></div></center>');
    $.ajax({
        url: url,
        success: function (response) {
            logInfo("Dialog", "Got Dialog JSON");
            var result = JSON.parse(response);
            result['response']['items'].reverse();
            var groupUsers;
            if (isGroup) {
                groupUsers = getGroupUsers(dialogID);
            }
            $.each(result['response']['items'], function (index, value) {
                var isSentByUser = value['out'];
                var time = timestampToTime(value['date']);
                var text = value['body'];
                text = text.replace(/(?:\r\n|\r|\n)/g, '<br>');
                var isSeen = value['read_state'];
                var userId = value['from_id'];
                var userName = uname;
                if (isGroup) {
                    userName = getGroupUsername(userId, groupUsers);
                }
                var cardAttachments = '<p class="card-text">';
                $.each(value['attachments'], function (index, value) {
                    var type = value['type'];
                    switch (type) {
                        case 'link':
                            cardAttachments += '<p><a href="' + value['link']['url'] + '">' + value['link']['url'] + '</a></p>';
                            break;
                        case 'photo':
                            cardAttachments += '<p><img class="dialogAttachPic" src="' + value['photo']['photo_604'] + '"></p>';
                            cardAttachments += '<p><a href="' + value['photo']['photo_604'] + '">Открыть!</a></p>';
                            break;
                        case 'doc':
                            if (value['doc']['ext'] === "gif") {
                                cardAttachments += '<p><img class="dialogAttachPic" src="' + value['doc']['url'] + '"></p>';
                            }
                            var size = value['doc']['size'] / 1000 / 1000;
                            size = size.toFixed(2);
                            cardAttachments += '<p><a href="' + value['doc']['url'] + '">' + value['doc']['title'] + ' (размер: ' + size + 'MB)</a></p>';
                            break;
                        case 'poll':
                            cardAttachments += '<p>Голосование: ' + value['poll']['question'] + ' (' + value['poll']['votes'] + ' голосов)</p>';
                            $.each(value['poll']['answers'], function (index, value) {
                                cardAttachments += '<p>- ' + value['text'] + ' (' + value['votes'] + ' голосов) [' + value['rate'] + '%]</p>';
                            });
                            break;
                        case 'audio':
                            var durMin = Math.floor(value['audio']['duration'] / 60);
                            var durSec = value['audio']['duration'] - durMin * 60;
                            cardAttachments += '<p>Аудиозапись: ' + value['audio']['title'] + ' от ' + value['audio']['artist'] + ' [' + durMin + ':' + durSec + ']</p>';
                            break;
                        case 'video':
                            var durMin = Math.floor(value['video']['duration'] / 60);
                            var durSec = value['video']['duration'] - durMin * 60;
                            cardAttachments += '<p>Видеозапись: ' + value['video']['title'] + ' (ID: ' + value['video']['id'] + ') [' + durMin + ':' + durSec + ']</p>';
                            break;
                        case 'sticker':
                            console.log(value['sticker']);
                            cardAttachments += '<p><img class="dialogAttachPic" src="' + value['sticker']['images'][0]['url'] + '"></p>';
                            if (debugInfo) {
                                cardAttachments += '<p>Информация о стикере: Коллекция - ' + value['sticker']['product_id'] + ', Код стикера - ' + value['sticker']['sticker_id'] + '</p>';
                            }
                            cardAttachments += '<p>Скачать - <a href="' + value['sticker']['images'][1]['url'] + '">64px</a>&nbsp;&nbsp;<a href="' + value['sticker']['images'][1]['url'] + '">128px</a>&nbsp;&nbsp;<a href="' + value['sticker']['images'][2]['url'] + '">256px</a>&nbsp;&nbsp;<a href="' + value['sticker']['images'][3]['url'] + '">352px</a>&nbsp;&nbsp;<a href="' + value['sticker']['images'][4]['url'] + '">512px</a></p>';
                            break;
                        default:
                            cardAttachments += '<p>Неподдерживаемый тип вложения: ' + type + '</p>';
                            break;
                    }
                });
                cardAttachments += '</p>';
                if (isSentByUser == 1) {
                    userName = "Я";
                    $('.cardContainer').append('<div class="card cardDecor semi-transparent message messageOut messageBorder">\n' +
                        '    <div class="card-body messagePadding">\n' +
                        '        <p class="card-text">' + text + '</p>\n' +
                        cardAttachments +
                        '        <p class="card-text smallText"> <i>(' + time + '), Прочитано: ' + isSeen + '</i></p>\n' +
                        '    </div>\n' +
                        '</div>');
                } else {
                    $('.cardContainer').append('<div class="card cardDecor semi-transparent message messageBorder">\n' +
                        '    <div class="card-body messagePadding">\n' +
                        '        <h5 class="card-title noPadding smallTitle">' + userName + '</h5>\n' +
                        '        <p class="card-text">' + text + '</p>\n' +
                        cardAttachments +
                        '        <p class="card-text smallText"> <i>(' + time + '), Прочитано: ' + isSeen + '</i></p>\n' +
                        '    </div>\n' +
                        '</div>');
                }
            });
            $('.cardContainer').append('<a id="endOfDialog"></a>');
            feather.replace();
            $('.spinnerLoad').hide();
            logInfo("Dialog", "Finish Dialog");
            setTimeout(function () {
                jump("endOfDialog");
            }, 500);
            $('.cardContainer').append('<div class="card cardDecor semi-transparent message messageBorder">\n' +
                '    <div class="card-body messagePadding">\n' +
                '<div class="input-group">' +
                '<input type="text" class="form-control writeBoxText bg-dark" placeholder="Сообщение">' +
                '<input type="hidden" class="vcatSend" vcat-sendto="'+dialogID+'">' +
                '<span class="input-group-btn">' +
                '<button class="btn btn-default btn-dark writeBoxButton" type="button">Отправить!</button>' +
                '</span>' +
                '</div>' +
                '    </div>\n' +
                '</div>');
            $(".writeBoxButton").click(function () {
                var sendState = sendMessage($(".vcatSend").attr('vcat-sendto'), $(".writeBoxText").val());
                if (sendState) {
                    getMessages(dialogID, uname, isGroup)
                }
            });
        }
    });
}

function getGroupUsers(chatID) {
    chatID = parseInt(chatID) - 2000000000;
    var url = "https://api.vk.com/method/messages.getChatUsers?lang=ru&fields=first_name,last_name&chat_id=" + chatID + "&access_token=" + token + "&v=5.74";
    console.log(url);
    logInfo("ChatUsers", "Get ChatUsers");
    url = craftURL(url);
    var result1;
    $.ajax({
        url: url,
        async:false,
        success: function (response) {
            var result = JSON.parse(response);
            logInfo("ChatUsers", "Got ChatUsers JSON");
            result1 = result;
            logInfo("ChatUsers", "Finish ChatUsers");
        }
    });
    return result1;
}

function getGroupUsername(userID, json) {
    var result;
    $.each(json['response'],function(index, value){
        if (value['id'] === userID) {
            result = value['first_name'] + " " + value['last_name'];
            return false;
        }
    });
    return result;
}

function sendMessage(dialogID, message) {
    var url = "https://api.vk.com/method/messages.send?message="+ encodeURIComponent(message) +"&peer_id=" + dialogID + "&access_token=" + token + "&v=5.74";
    logInfo("SendMessages", "Get SendMessages");
    url = craftURL(url);
    var result1 = false;
    $.ajax({
        url: url,
        async:false,
        success: function (response) {
            var result = JSON.parse(response);
            if (Array.isArray(response['error'])) {
                logInfo("SendMessages", "Error: "+result['error']['error_msg']);
                result1 = false;
            } else {
                logInfo("SendMessages", "Done");
                result1 = true;
            }
        }
    });
    return result1;
}