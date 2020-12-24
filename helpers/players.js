class Players {
    constructor(client){
        this.client = client;
    }
    async getPlayers() {
        return new Promise((resolve, reject) => {
          this.client.participants.index({
            id: process.env.tournament_id,
            callback: (err, players) => {
              if (err) {
                reject(err);
              } else {
                resolve(players);
              }
            }
          });
        });
      }

      buildPlayers(players){
        const playerDetails = {};
        for(let index  of Object.keys(players)){
          const player = players[index].participant
          playerDetails[player.id] = { name: player.name.split('(')[0], w: 0, l: 0, d: 0, ga: 0, gf: 0, gd: 0, pts: 0 };
        }
        return playerDetails;
      }

      updatePlayerDetails(playerDetails, playerId, goalsFor, goalsAgainst, win, draw, loss, goalsDiff, points){
        const currPlayer = playerDetails[playerId];
        currPlayer.gf += goalsFor;
        currPlayer.ga += goalsAgainst;
        currPlayer.w += win;
        currPlayer.d += draw;
        currPlayer.l += loss;
        currPlayer.gd += goalsDiff;
        currPlayer.pts += points;
      }

      updateWinner(playerDetails, playerId, goalsFor, goalsAgainst){
        this.updatePlayerDetails(playerDetails, playerId, goalsFor, goalsAgainst, 1, 0, 0, (goalsFor-goalsAgainst), 3);
      
      }
      
      updateLoser(playerDetails, playerId, goalsFor, goalsAgainst){
        this.updatePlayerDetails(playerDetails, playerId, goalsFor, goalsAgainst, 0, 0, 1, (goalsFor-goalsAgainst), 0);
      }
      
      updateTiedPlayers(playerDetails, firstPlayerId, secondPlayerId, goals){
        this.updatePlayerDetails(playerDetails, firstPlayerId, goals, goals, 0, 1, 0, 0, 1);
        this.updatePlayerDetails(playerDetails, secondPlayerId, goals, goals, 0, 1, 0, 0, 1);
      }

      findLongestNameLength(playerDetails){
        let longest = 0; 
        playerDetails.forEach((player) => {
          longest =Math.max(player.name.length, longest);
        })
        return longest;
      
      }

      getPlayerName(players, pId){
        let playerName = ''
        for(let index  of Object.keys(players)){
          const player = players[index].participant
          if(player.id == pId){
            playerName = player.name.split('(')[0];
          }
        }  
        return playerName;
      }
    buildPlayerDetails(players){
        const playerDetails = {};
        for(let index  of Object.keys(players)){
          const player = players[index].participant
          playerDetails[player.id] = { name: player.name.split('(')[0], w: 0, l: 0, d: 0, ga: 0, gf: 0, gd: 0, pts: 0 };
        }
        
      
        return playerDetails;
      }
      
}
module.exports = Players;