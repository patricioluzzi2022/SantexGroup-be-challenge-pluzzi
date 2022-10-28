# Santex back-end developer hiring test

## Requisitos:

- docker
- docker-compose

## Para instalar las dependencias:

npm i

## Base de datos:

docker-compose up

## End-Points:

### Importar información de una liga especifica:

- POST ${HOST}:${PORT}/api/test/import/league
Body example: 
{
    "league": "PL"
}

- GET ${HOST}:${PORT}/api/test/players/{league code}

- POST ${HOST}:${PORT}/api/test/teams
Body example:
{
    "team": "Arsenal FC",
    "showPlayers": true
}

- GET ${HOST}:${PORT}/api/test/teams/{team name}/players

