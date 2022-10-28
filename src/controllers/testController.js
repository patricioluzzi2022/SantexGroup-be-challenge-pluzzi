const express = require('express');
const router = express.Router();
const mongo = require('mongodb');
const {getConnectionString} = require('../config/database');
const axios = require('axios');
require('dotenv').config();

const config = {
    headers: {
        'X-Auth-Token': process.env.FOOTBALL_API_KEY
    }
};

router.route('/status').get(async (req, res) => {
    res.status(200).send('Ok!');
});

const importCompetitions = async (league) => {
    
    await axios.get(
        `${process.env.FOOTBALL_API_URL}/competitions/${league}`,
        config
    )
    .then(result => {
        let connStr = getConnectionString();
        let mongoClient = mongo.MongoClient;

        mongoClient.connect(connStr, async (err, db) =>{
            if (err){
                db.close();
                throw err;
            }

            let competition = {
                id: result.data.id,
                name: result.data.name,
                code: result.data.code,
                area: result.data.area.name
            }

            let football = db.db(process.env.MONGODB_DATABASE);

            const rta = await football.collection("competitions").insertOne(competition, {});
        });
        
    })
    .catch(error => {
        console.log(error);
    });

    await axios.get(
        `${process.env.FOOTBALL_API_URL}/competitions/${league}/teams`,
        config
    )
    .then(result => {
        importTeams(league, result.data.teams);            
    })
    .catch(error => {
        console.log(error);
    });

}

const importTeams = async (league, teams) => {
    let connStr = getConnectionString();
    let mongoClient = mongo.MongoClient;

    mongoClient.connect(connStr, async (err, db) =>{
        if (err){
            db.close();
            throw err;
        }

        let data = teams.map(elt => {
            let team = {
                id: elt.id,
                name: elt.name,
                tla: elt.tla,
                shortName: elt.shortName,
                area: elt.area.name,
                address: elt.address,
                league: league
            }
            return team;
        });

        let football = db.db(process.env.MONGODB_DATABASE);

        const rta = await football.collection("teams").insertMany(data, {});

        teams.forEach(elt => {
            importPlayers(elt.id, elt.squad ? elt.squad : elt.coach);
        });
        
    });

}

const importPlayers = async (team, players) => {
    let connStr = getConnectionString();
    let mongoClient = mongo.MongoClient;

    mongoClient.connect(connStr, async (err, db) =>{
        if (err){
            db.close();
            throw err;
        }

        let data = players.map(p => {
            let player = {
                id: p.id,
                name: p.name,
                position: p.position ? p.position : 'Coach',
                dateOfBirth: p.dateOfBirth,
                nationality: p.nationality,
                team: team
            }
            return player;
        });

        let football = db.db(process.env.MONGODB_DATABASE);

        const rta = await football.collection("players").insertMany(data, {});
    });
}

router.route('/import/league').post(async (req, res) => {
    try {
        let league = req.body.league;

        importCompetitions(league);

        res.status(200).send('Done!');

    } catch (ex) {
        console.log(ex);
        res.status(500).send(ex);
    }
});

router.route('/players/:league').get(async (req, res) => {
    try {
        let league = req.params.league;

        let connStr = getConnectionString();
        let mongoClient = mongo.MongoClient;

        mongoClient.connect(connStr, async (err, db) =>{
            if (err){
                db.close();
                throw err;
            }

            let football = db.db(process.env.MONGODB_DATABASE);

            const competition = await football.collection("competitions").findOne({code: league});

            if(!competition){
                res.status(500).send('La liga no existe');
                return;
            }

            const result = await football.collection("players")
            .aggregate([
                {
                    $lookup:{
                      from: 'teams',
                      localField: 'team',
                      foreignField: 'id',
                      as: 'Team'
                    }
                },
                { 
                    $match: {
                        'Team.league': league
                    }
                    
                }
                
            ]).toArray();

            db.close();

            let rta = result.map(elt => {
                let player = {
                    name: elt.name,
                    position: elt.position,
                    dateOfBirth: elt.dateOfBirth,
                    nationality: elt.nationality
                }

                return player;
            });

            res.status(200).send(rta);
        });

        

    } catch (ex) {
        console.log(ex);
        res.status(500).send(ex);
    }
});

router.route('/teams/:team/players').get(async (req, res) => {
    try {
        let team = req.params.team;

        let connStr = getConnectionString();
        let mongoClient = mongo.MongoClient;

        mongoClient.connect(connStr, async (err, db) =>{
            if (err){
                db.close();
                throw err;
            }

            let football = db.db(process.env.MONGODB_DATABASE);

            const result = await football.collection("players")
            .aggregate([
                {
                    $lookup:{
                      from: 'teams',
                      localField: 'team',
                      foreignField: 'id',
                      as: 'Team'
                    }
                },
                { 
                    $match: {
                        'Team.name': team
                    }
                    
                }
                
            ]).toArray();

            db.close();

            let rta = result.map(elt => {
                let player = {
                    name: elt.name,
                    position: elt.position,
                    dateOfBird: elt.dateOfBird,
                    nationality: elt.nationality
                }

                return player;
            })

            res.status(200).send(rta);
        });

    } catch (ex) {
        console.log(ex);
        res.status(500).send(ex);
    }
});

router.route('/teams').post(async (req, res) => {
    try {
        let criteria = req.body;
        let connStr = getConnectionString();
        let mongoClient = mongo.MongoClient;

        mongoClient.connect(connStr, async (err, db) =>{
            if (err){
                db.close();
                throw err;
            }

            let football = db.db(process.env.MONGODB_DATABASE);

            const result = await football.collection("teams")
            .aggregate([
                {
                    $lookup:{
                        from: 'players',
                        localField: 'id',
                        foreignField: 'team',
                        as: 'Players'
                    }
                },
                { 
                    $match: {
                        'name': criteria.team
                    }
                }                
            ]).toArray();

            db.close();

            let rta = result.map(elt => {
                let team;

                if(criteria.showPlayers){
                    team = {
                        name: elt.name,
                        tla: elt.tla,
                        shortName: elt.sortName,
                        area: elt.area,
                        address: elt.address,
                        players: elt.Players.map(p => {
                            let player = {
                                name: p.name,
                                position: p.position,
                                dateOfBirth: p.dateOfBirth,
                                nationality: p.nationality
                            }
            
                            return player;
                        })
                    }
                }else{
                    team = {
                        name: elt.name,
                        tla: elt.tla,
                        shortName: elt.sortName,
                        area: elt.area,
                        address: elt.address
                    }
                }

                return team;
            })

            res.status(200).send(rta.length != 0 ? rta[0] : null);
        });

    } catch (ex) {
        console.log(ex);
        res.status(500).send(ex);
    }
});




module.exports = router;