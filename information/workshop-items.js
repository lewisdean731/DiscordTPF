const config = require("../configuration/config.json");
const tokenId = require("../configuration/tokenId.json");
const request = require("snekfetch")
exports.searchWorkshop = (message, searchString, rawSearch, client) => {
    var searchTerms = searchString
    const header = "https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/?key=" + tokenId.key + "&query_type=k_PublishedFileQueryType_RankedByTrend&page=1&numperpage=9&creator_appid=446800&child_publishedfileid=0&return_metadata=1&return_children=1&return_short_description=1&return_vote_data=1&search_text=" + searchString
    console.log(searchString)
    var arr = []
    request.get(header).then(result => {
        
        console.log((result.body.response.publishedfiledetails[0].title))
        
        var numberOfItems = Object.keys(result.body.response.publishedfiledetails).length
        try {
            for (var i = 0; i < numberOfItems; i++) {
                //console.log(i)
                arr.push(`${i + 1}. ${result.body.response.publishedfiledetails[i].title}`)
            }
        } catch (e) {
            console.log(e)
        } finally {
            message.channel.send(arr.join("\n"), { code: "" }).then((fMsg) => {
                message.channel.send("Select which mod you would like to view by typing in its number in the next 10 seconds.").then((msg) => {
                    message.channel.awaitMessages(response => response.content.length === 1, {
                        max: 1,
                        time: 10000,
                        errors: ['time']
                    }).then((collected) => {
                        collected.first().delete()
                        msg.delete()
                        fMsg.delete()
                        var number = collected.first().content - 1
                        var fileDetail = result.body.response.publishedfiledetails[number]
                        const creatorName = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${tokenId.key}&format=json&steamids=${fileDetail.creator}`
                        request.get(creatorName).then(results => {
                            try {
                                console.log(results.body.response.players[0].personaname)
                                var title = fileDetail.title + "\n"
                                var linkToWebsite = "http://steamcommunity.com/sharedfiles/filedetails/?id=" + fileDetail.publishedfileid
                                var fileSize = "Approximately " + (fileDetail.file_size / 1000000).toFixed(2) + "MB"
                                // console.log(fileSize)
                                // console.log(linkToWebsite)
                                var image = fileDetail.preview_url
                                function replacer(match, p1, p2, p3, string) {
                                    return p3
                                }
                                var cleaned = "```" + fileDetail.short_description.trim().replace(/\[(\w+)(?:='(.*)')?\](.*)\[\/\1\]/g, replacer).replace(/\[(\w+)(?:='(.*)')?\](.*)\[\/\1\]/g, replacer) + "..." + "```"
                                var fileDesc = cleaned + `\nRead more at [the mod's workshop page](${linkToWebsite})` // .replace(/[[hburlui/123456]789]/igm , " " ) 
                                var dependencies = []
                                var noOfDeps;
                                // get any dependencies required
                                if (fileDetail.num_children !== 0) {
                                    console.log("here")
                                    noOfDeps = fileDetail.num_children
                                    for (var j = 0; j < noOfDeps; j++) {
                                        request.post(
                                            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                                            {
                                                headers: {
                                                    'Content-Type': 'application/x-www-form-urlencoded'
                                                },
                                                data: `itemcount=1&publishedfileids[0]=${fileDetail.children[j].publishedfileid}`
                                            }
                                        )
                                            .then(res => {
                                                request.get(
                                                    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${tokenId.key}&format=json&steamids=${res.body.response.publishedfiledetails[0].creator}`
                                                ).then(creator => {
                                                    dependencies.push(`[${res.body.response.publishedfiledetails[0].title} by ${creator.body.response.players[0].personaname}](http://steamcommunity.com/sharedfiles/filedetails/?id=${res.body.response.publishedfiledetails[0].publishedfileid})`)
                                                    console.log(creator.body.response.players[0].personaname)
                                                })


                                            })
                                    }
                                } else {
                                    dependencies.push("No dependencies!")
                                    noOfDeps = 0
                                }

                                var creator = `[${results.body.response.players[0].personaname}](${results.body.response.players[0].profileurl})`
                                console.log(creator)
                                var subs = fileDetail.subscriptions
                                var views = fileDetail.views
                                var votes = (fileDetail.vote_data.score * 100).toPrecision(3) + "%"
                                console.log(votes)
                                var fileImage = fileDetail.preview_url

                                setTimeout(embed, 1000)
                                function embed() {
                                    message.channel.send({
                                        embed: {
                                            color: 3447003,
                                            author: {
                                                name: `Search results for "${rawSearch}"`
                                            },
                                            image: {
                                                url: fileImage
                                            },
                                            title: title,
                                            url: linkToWebsite,
                                            timestamp: new Date(),
                                            thumbnail: {
                                                url: results.body.response.players[0].avatarfull
                                            },
                                            footer: {
                                                icon_url: message.client.user.displayAvatarURL,
                                                text: "Requested by " + message.author.username
                                            },
                                            fields: [
                                                {
                                                    name: "Author",
                                                    value: creator

                                                },
                                                {
                                                    name: "**Item Description**",
                                                    value: fileDesc
                                                },
                                                {
                                                    name: "Total views",
                                                    value: views,
                                                    inline: true
                                                },
                                                {
                                                    name: "Total subscribers",
                                                    value: subs,
                                                    inline: true
                                                },
                                                {
                                                    name: "Rating",
                                                    value: votes,
                                                    inline: true
                                                },
                                                {
                                                    name: "File size",
                                                    value: fileSize,
                                                    inline: true
                                                },
                                                {
                                                    name: `Dependencies (${noOfDeps})`,
                                                    value: dependencies.join("\n")
                                                }
                                            ]
                                        }
                                    })
                                }

                            } catch (e) {
                                console.log(e)
                            }
                        })
                        console.log(collected.first().content)
                    }).catch(() => {
                        console.log("no msg")
                        msg.edit("No longer listening for messages.")
                    })
                })
            })
        }
    }).catch(e => {
        console.log(e)
        message.channel.send(`No results for ${rawSearch}`)
    })
}