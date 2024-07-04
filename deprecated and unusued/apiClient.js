require("dotenv").config();
const apiKey = process.env.SDIO_API_KEY;
const baseURL = "https://api.sportsdata.io/v4/soccer/";
const teams = new Map();

/*Leagues 
    1: EPL
    2: Bundesliga
    4: La Liga
    6: Serie A
    13: Ligue 1
*/

async function getCurrentClubsFromLeague(league_id) {
  try {
    const seasonId = await getSeasonId(league_id);
    const endpoint = `scores/json/SeasonTeams/${league_id}/${seasonId}?key=${apiKey}`;
    const url = baseURL + endpoint;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to get teams from API - Response not ok");
    }

    const data = await response.json();

    data.forEach((team) => {
      teams.set(team.TeamId, team.TeamName);
    });
    return teams;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getSeasonId(league_id) {
  const endpoint = `scores/json/Competitions?key=${apiKey}`;
  const url = baseURL + endpoint;
  const currentYear = new Date().getFullYear();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to get season ID from API - Response not ok");
    }

    const data = await response.json();
    const competition = data.find((comp) => comp.CompetitionId === league_id);

    if (!competition) {
      throw new Error(`Competition with ID ${league_id} not found`);
    }
    const season = competition.Seasons.find(
      (season) =>
        season.CurrentSeason ||
        new Date(season.StartDate).getFullYear() === currentYear
    );

    if (!season) {
      throw new Error(
        `No current or off-season data available for this year in league ${league_id}`
      );
    }
    return season.SeasonId;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getPlayersByTeam(team_id) {}

async function main() {
  const leagueId = 1; // Example: EPL
  const teams = await getCurrentClubsFromLeague(leagueId);
  console.log(teams);
}

main();
