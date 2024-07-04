const leagueNames = {
  GB1: "Premier League",
  L1: "Bundesliga",
  ES1: "La Liga",
  IT1: "Serie A",
  FR1: "Ligue 1",
};

const baseURL =
  "https://corsproxy.io/?https://transfermarkt-api-b4bhrnpwqa-ew.a.run.app/";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch data - Response not ok");
  }
  return response.json();
}

function createListItem(textContent) {
  const li = document.createElement("li");
  li.textContent = textContent;
  return li;
}

async function getCurrentClubsFromLeague(league_id) {
  try {
    const endpoint = `competitions/${league_id}/clubs`;
    const url = baseURL + endpoint;

    const data = await fetchJson(url);
    const teams = new Map();

    if (data && Array.isArray(data.clubs)) {
      data.clubs.forEach((club) => {
        teams.set(club.id, club.name);
      });
    }

    return teams;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function getCurrentPlayersFromClub(club_id) {
  try {
    const endpoint = `clubs/${club_id}/players`;
    const url = baseURL + endpoint;

    const data = await fetchJson(url);
    const players = new Map();

    if (data && Array.isArray(data.players)) {
      data.players.forEach((player) => {
        players.set(player.id, player.name);
      });
    }

    return players;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function getPlayerStats(player_id) {
  try {
    const endpoint = `players/${player_id}/stats`;
    const url = baseURL + endpoint;

    const data = await fetchJson(url);
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function getPlayerTransfers(player_id) {
  try {
    const endpoint = `players/${player_id}/transfers`;
    const url = baseURL + endpoint;

    const data = await fetchJson(url);
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

function aggregateAppearances(stats, transfers) {
  const appearancesByStint = [];

  stats.forEach((stat) => {
    const clubID = stat.clubID;
    const competitionName = stat.competitionName;
    const seasonID = stat.seasonID;
    const appearances = parseInt(stat.appearances || 0, 10);
    const goals = parseInt(stat.goals || 0, 10);

    const transfer = transfers.find(
      (transfer) =>
        transfer.to.clubID === clubID && transfer.season === seasonID
    );

    if (transfer) {
      const clubName = transfer.to.clubName;
      const isLoan =
        transfer.fee &&
        transfer.fee.includes("loan") &&
        !transfer.fee.includes("End of loan");

      appearancesByStint.push({
        clubID,
        clubName,
        seasonID,
        competitionName,
        appearances,
        goals,
        isLoan,
        date: transfer.date,
      });
    }
  });

  return appearancesByStint;
}

function formatAppearances(appearancesByStint) {
  const clubStints = {};

  appearancesByStint.forEach((stint) => {
    const key = `${stint.clubID}-${stint.isLoan ? "loan" : "permanent"}`;

    if (!clubStints[key]) {
      clubStints[key] = {
        clubName: stint.clubName,
        startSeason: stint.seasonID,
        endSeason: stint.seasonID,
        competitionName: stint.competitionName,
        appearances: stint.appearances,
        goals: stint.goals,
        isLoan: stint.isLoan,
      };
    } else {
      clubStints[key].endSeason = stint.seasonID;
      clubStints[key].appearances += stint.appearances;
      clubStints[key].goals += stint.goals;
    }
  });

  return Object.values(clubStints).map((stint) => ({
    ...stint,
    duration:
      stint.startSeason === stint.endSeason
        ? stint.startSeason
        : `${stint.startSeason}–${stint.endSeason}`,
  }));
}

function displayPlayerCareer(formattedData) {
  const ulElement = document.getElementById("career-list");
  ulElement.innerHTML = ""; // Clear any existing content

  formattedData.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.duration} ${entry.clubName} (${
      entry.competitionName
    }${entry.isLoan ? ", loan" : ""}): ${entry.appearances} appearances, ${
      entry.goals
    } goals`;
    ulElement.appendChild(li);
  });
}

async function displayLeagueTeams(league_id, teams) {
  const ulElement = document.getElementById("teams-list");

  const leagueLi = createListItem(leagueNames[league_id]);
  const teamUl = document.createElement("ul");

  for (const [teamId, teamName] of teams) {
    const teamLi = createListItem(teamName);
    const playerUl = document.createElement("ul");

    const players = await getCurrentPlayersFromClub(teamId);
    if (players) {
      players.forEach((playerName) => {
        const playerLi = createListItem(playerName);
        playerUl.appendChild(playerLi);
      });
    }

    teamLi.appendChild(playerUl);
    teamUl.appendChild(teamLi);
  }

  leagueLi.appendChild(teamUl);
  ulElement.appendChild(leagueLi);
}

async function displayTeams() {
  const leagueIds = ["GB1", "L1", "ES1", "IT1", "FR1"];
  const ulElement = document.getElementById("teams-list");
  ulElement.innerHTML = ""; // Clear any existing content

  for (const league_id of leagueIds) {
    const teams = await getCurrentClubsFromLeague(league_id);
    if (teams) {
      await displayLeagueTeams(league_id, teams);
    }
  }
}

async function displayPlayerStats(player_id) {
  const stats = await getPlayerStats(player_id);
  const transfers = await getPlayerTransfers(player_id);

  if (stats && transfers) {
    const appearancesByStint = aggregateAppearances(
      stats.stats,
      transfers.transfers
    );
    const formattedData = formatAppearances(appearancesByStint);
    displayPlayerCareer(formattedData);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  displayTeams();

  const playerId = "198709"; // Example player ID
  displayPlayerStats(playerId);
});
