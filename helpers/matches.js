const Players = require('./players');
const { padInt } = require('./utils');
const _ = require('lodash');

class Matches {
    constructor(client) {
        this.client = client;
        this.playersHelper = new Players(client);
    }

    async getMatches() {
        return new Promise((resolve, reject) => {

            this.client.matches.index({
                id: process.env.tournament_id,
                callback: function (error, matches) {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(matches)
                    }

                }
            });
        });
    }


    getChampions(sortedTable) {
        let results = "```"
        results += "\n"
        results += process.env.tournament_name
        results += "\n"
        results += "Champion: " + sortedTable[0].name;
        results += "\n"
        results += "Runner up: " + sortedTable[1].name;
        results += "```"
        return (results)
    }

    getTable(matches, playerDetails) {
        for (let index of Object.keys(matches)) {
            const match = matches[index].match;
            if (match.state == 'complete') {
                const outcome = this.determineMatchoutcome(match)
                let [firstPlayerGoals, secondPlayerGoals] = match.scoresCsv.split('-');
                firstPlayerGoals = parseInt(firstPlayerGoals, 10);
                secondPlayerGoals = parseInt(secondPlayerGoals, 10);
                if (outcome.result === 'noTie') {
                    const winningGoals = Math.max(firstPlayerGoals, secondPlayerGoals);
                    const losingGoals = Math.min(firstPlayerGoals, secondPlayerGoals);
                    this.playersHelper.updateWinner(playerDetails, outcome.winnerId, winningGoals, losingGoals)
                    this.playersHelper.updateLoser(playerDetails, outcome.loserId, losingGoals, winningGoals)
                } else {
                    this.playersHelper.updateTiedPlayers(playerDetails, outcome.firstPlayer, outcome.secondPlayer, firstPlayerGoals)
                }
            }
        }
        return playerDetails;
    }

    formatTable(sortedTable, longestNameLength) {
        let formattedTable = '```';
        formattedTable += '|  player  |w-d-l|gf|ga|pt|';
        formattedTable += "\n";
        formattedTable += '---------------------------';
        formattedTable += "\n";
        sortedTable.forEach((playerDetails) => {
            formattedTable += '|';
            formattedTable += [playerDetails.name.padEnd(longestNameLength, ' '), playerDetails.w + '-' + playerDetails.d + '-' + playerDetails.l, padInt(playerDetails.gf), padInt(playerDetails.ga), padInt(playerDetails.pts)].join('|');
            formattedTable += '|';
            formattedTable += "\n";
        });
        formattedTable += '```';
        return formattedTable;
    }
    determineMatchoutcome(match) {


        const outcome = { winnerId: null, loserId: null, result: '', firstPlayer: null, secondPlayer: null }
        if (match.winnerId != null) {
            outcome.winnerId = match.winnerId;
            outcome.loserId = match.loserId;
            outcome.result = 'noTie';
        } else {
            outcome.firstPlayer = match.player1Id;
            outcome.secondPlayer = match.player2Id;
            outcome.result = 'tie';
        }

        return outcome;
    }

    sortTable(table) {
        let tableValues = Object.values(table)
        let sortedTable = _.orderBy(tableValues, ['pts', 'gd', 'gf'], ['desc', 'desc', 'desc'])
        return sortedTable;

    }

    getFixtures(players, matches) {
        let fixtures = [];
        let i = 0
        for (let index of Object.keys(matches)) {
            const match = matches[index].match;
            if (i < 6 && match.state == 'open') {
                const firstPlayerName = this.playersHelper.getPlayerName(players, match.player1Id);
                const secondPlayerName = this.playersHelper.getPlayerName(players, match.player2Id);
                fixtures.push({ home: firstPlayerName, away: secondPlayerName, round: match.round, id: match.id, homeId: match.player1Id, awayId: match.player2Id });
                i++
            }
        }
        return fixtures;
    }

    formatFixtures(upcomingGames) {
        let formattedFixtures = '```';
        if (upcomingGames) {
            formattedFixtures += '  Upcoming Matches          ';
            formattedFixtures += "\n";
            formattedFixtures += '---------------------------';
            formattedFixtures += "\n";

            upcomingGames.forEach((game) => {
                formattedFixtures += ['R' + game.round + '-' + game.home + '(H): ' + game.away];
                formattedFixtures += "\n"

            });

        } else {
            formattedFixtures += 'Tournament Finished!'
        }

        formattedFixtures += '```';
        return formattedFixtures;
    }
    async getTournament() {
        return new Promise((resolve, reject) => {
            this.client.tournaments.show({
                id: process.env.tournament_id,

                callback: (err, tournament) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(tournament);
                    }
                }
            });
        });
    }
    isTournamentCompleted(tournament) {
        console.log(tournament.tournament.progressMeter);
        return tournament.tournament.progressMeter == 100
    }

    async getFixturesForUpdate() {
        const players = await this.playersHelper.getPlayers();
        const matches = await this.getMatches();
        let fixtures = this.getFixtures(players, matches);
        let length = fixtures.length
        let fixturesForUpdate = [];
        while (length--) {
            fixturesForUpdate.unshift({ key: fixtures[length].home + '(H):' + fixtures[length].away, value: fixtures[length].id, homeId: fixtures[length].homeId, awayId: fixtures[length].awayId })
        }
        return fixturesForUpdate;
    }

    async updateScore(matchId, home, away, homeId, awayId) {
        let winner = homeId;
        if (parseInt(home) === parseInt(away)) {
            winner = 'tie'
        }
        else if (parseInt(home) < parseInt(away)) {
            winner = awayId;
        }
        return new Promise((resolve, reject) => {
            this.client.matches.update({
                id: process.env.tournament_id,
                matchId: matchId,
                match: {
                    scoresCsv: home + '-' + away,
                    winnerId: winner
                },
                callback: function (error, matches) {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(matches)
                    }

                }
            })
        });
    }

}

module.exports = Matches