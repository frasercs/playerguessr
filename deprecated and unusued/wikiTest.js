// Function to fetch Wikipedia page content
async function fetchWikipediaPage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=text&formatversion=2&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.parse.text;
  } catch (error) {
    console.error("Fetch error: ", error);
  }
}

// Function to extract the "Senior career" section
function extractSeniorCareerSection(htmlText) {
  const regex =
    /<span class="mw-headline" id="Senior_career">Senior career<\/span>(.*?)<\/table>/s;
  const match = htmlText.match(regex);
  if (match && match[1]) {
    return match[1];
  } else {
    console.log("Senior career section not found");
  }
}

async function main() {
  const pageTitle = "Jadon_Sancho";
  const pageContent = await fetchWikipediaPage(pageTitle);
  const seniorCareerSection = extractSeniorCareerSection(pageContent);

  if (seniorCareerSection) {
    console.log(seniorCareerSection);
  }
}

main();
