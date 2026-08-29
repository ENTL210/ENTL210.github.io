// Real photographs are dropped in at the `image` paths below. No file exists at
// them yet, so StoryBubble renders an empty framed placeholder until one does.
export const stops = [
  {
    id: "fertile-crescent",
    year: "c. 10,000 BCE",
    title: "The First Loaves",
    lon: 36,
    lat: 31,
    image: "/images/hum100/fertile-crescent.jpg",
    imageAlt: "Photograph representing early grain grinding in the Fertile Crescent",
    content: {
      intro:
        "Bread is older than farming itself. Charred flatbread fragments recovered at Shubayqa 1 in present-day Jordan date to roughly 14,400 years ago, made by Natufian people from wild, undomesticated grains some four thousand years before anyone deliberately planted a field (Live Science, 2018). Around 10,000 BCE, communities across the Fertile Crescent began domesticating wheat and barley, and that single shift let people stay in one place instead of following their food.",
      bullets: [
        "Wheat and barley were among the first crops ever domesticated, in the region spanning modern Iraq, Syria, and the Levant (Live Science, 2018).",
        "Sumerian cuneiform tablets from around 2500 BCE record more than thirty distinct bread types, from plain flatbreads to honey-sweetened loaves (Food Museum, n.d.).",
        "Grain surplus supported people who did not grow food, making priests, soldiers, and artisans possible for the first time.",
      ],
      outro:
        "Bread was never only nourishment. It was the surplus that let a society become complex enough to have an identity at all, and every loaf that follows in this story inherits that.",
    },
  },
  {
    id: "ancient-egypt",
    year: "c. 3000 BCE",
    title: "Bread Learns to Rise",
    lon: 31,
    lat: 30,
    image: "/images/hum100/ancient-egypt.jpg",
    imageAlt: "Photograph representing ancient Egyptian bread baking in a clay oven",
    content: {
      intro:
        "Leavened bread is generally credited to Egypt around 3000 BCE, and it was almost certainly an accident. Dough left sitting long enough caught wild airborne yeast, the same fermentation that produced Egyptian beer, and the result rose (Food Museum, n.d.). Egyptians baked in conical clay ovens called tabuns, grinding emmer wheat and barley on stone querns.",
      bullets: [
        "Laborers building the pyramids were paid partly in bread and beer, making bread a unit of value as much as a food (Food Museum, n.d.).",
        "Loaves were placed in tombs as offerings, carrying the dead into the afterlife.",
        "The same yeast culture served both the bakery and the brewery, tying two staples of Egyptian life to one process.",
      ],
      outro:
        "By this point bread had moved past sustenance into ritual and economy. It paid workers, it accompanied the dead, and it marked the difference between an ordinary meal and an occasion.",
    },
  },
  {
    id: "paris-baguette",
    year: "1920",
    title: "One Loaf, One Nation",
    lon: 2.35,
    lat: 48.85,
    zoom: 3.6,
    image: "/images/hum100/paris-baguette.jpg",
    imageAlt: "Photograph representing a Parisian bakery with fresh baguettes",
    content: {
      intro:
        "The baguette is far younger than its reputation suggests. Long thin loaves existed in nineteenth century Paris, but the standardized baguette only appeared in the early twentieth century, and the most credible explanation is a labor law. A 1920 French regulation barred bakers from starting work before four in the morning, and a thin loaf baked fast enough to still reach the counter by breakfast when a round loaf could not (Sortiraparis, n.d.).",
      bullets: [
        "The same 1920 regulation formalized the loaf itself, setting a minimum weight of 80 grams and a maximum length of 40 centimeters (Origin Trace, n.d.).",
        "Before the Revolution, bread type marked class outright, white bread for the wealthy and coarse dark bread for the poor, and post-revolutionary France debated a single pain d'égalité meant for every citizen (Origin Trace, n.d.).",
        "A 1993 decree legally defined an authentic baguette as flour, water, salt, and yeast, with no additives permitted (Origin Trace, n.d.).",
        "UNESCO added baguette culture to its intangible cultural heritage list in 2022 (Origin Trace, n.d.).",
      ],
      outro:
        "A shape that began as a workaround for a scheduling restriction ended up written into law and then recognized internationally as a piece of French identity worth protecting. This is the loaf that gets carried to Vietnam.",
    },
  },
  {
    id: "saigon-import",
    year: "1860s",
    title: "Bread Arrives as a Stranger",
    lon: 106.6,
    lat: 10.85,
    zoom: 3.6,
    image: "/images/hum100/saigon-import.jpg",
    imageAlt: "Photograph representing colonial-era Saigon with imported French goods",
    content: {
      intro:
        "France attacked Vietnam between 1858 and 1860, took Saigon by 1862, and established the colony of Cochinchina (The Culture Trip, n.d.). Wheat does not grow in Vietnam's climate, so every loaf had to be shipped from Europe at real expense, which made bread a luxury available almost exclusively to French colonists and administrators. Vietnamese locals called it bánh Tây, western bread.",
      bullets: [
        "Other French foods entered Vietnamese as loanwords in the same period: bơ from beurre, phô mai from fromage, bít tết from bifteck (Nguyen, 2014).",
        "During World War I, French authorities seized two German-owned import firms in Indochina and marketed their warehoused stock of pâté, cold cuts, and condiments to ordinary Vietnamese consumers, putting those ingredients within reach for the first time (Lion Brand, n.d.).",
        "Wartime wheat shortages pushed bakers to cut flour with locally abundant rice flour, producing a lighter loaf with a thinner, crackling crust better suited to the humidity (Lion Brand, n.d.).",
        "Expensive imported butter was commonly replaced with mayonnaise, which held up better in the heat (Lion Brand, n.d.).",
      ],
      outro:
        "Bread arrived as an instrument of exclusion, priced and positioned to mark who held power. What made it available to everyone else was a combination of colonial accident and wartime scarcity, and the adaptations forced by that scarcity are exactly what made the loaf Vietnamese.",
    },
  },
  {
    id: "banh-mi-birth",
    year: "1954 to 1958",
    title: "The Sandwich Becomes Vietnamese",
    lon: 106.7,
    lat: 10.75,
    zoom: 3.6,
    image: "/images/hum100/banh-mi-birth.jpg",
    imageAlt: "Photograph representing a Saigon street vendor assembling a banh mi sandwich",
    content: {
      intro:
        "The clearest evidence that the bread had been absorbed is linguistic. By 1945, bánh Tây had given way to bánh mì, simply wheat bread, dropping the reference to France entirely (Nguyen, 2014). The French had eaten casse-croûte, a baguette served beside a plate of separate cold cuts, pâté, and butter. Vietnamese cooks were the ones who put everything inside the bread.",
      bullets: [
        "After the 1954 partition, roughly one million northerners moved south, among them Mr. and Mrs. Lê (Great Aunty Three, n.d.).",
        "Their Saigon shop, later known as Bánh Mì Hòa Mã, opened around 1958 and is credited as the first to stuff the fillings inside the loaf so it could be eaten on the move (The Culture Trip, n.d.).",
        "Pickled carrot and daikon, cucumber, cilantro, and chili have no equivalent in the French original, and reflect a Vietnamese preference for bright acidity and fresh herbs.",
        "Bánh mì entered the Oxford English Dictionary on March 24, 2011, as a loanword rather than a translation (Great Aunty Three, n.d.).",
      ],
      outro:
        "Read as reclamation rather than westernization, bánh mì pushes back on the assumption that colonial contact only ever costs a culture something (Pacific Ties, n.d.). A colonizer's bread was renamed, rebuilt, and claimed, and then carried worldwide by the same diaspora produced by the rupture that created it.",
    },
  },
];

// Rendered alphabetically by leading author or organization, per APA.
export const sources = [
  {
    id: "food-museum",
    apa: "Food Museum. (n.d.). The history of bread making: A universal lens.",
    url: "https://foodmuseum.org.uk/the-history-of-bread-making-a-universal-lens/",
  },
  {
    id: "great-aunty-three",
    apa: "Great Aunty Three. (n.d.). The history of bánh mì: A Vietnamese staple.",
    url: "https://greatauntythree.com/the-history-of-banh-mi-a-vietnamese-staple.html",
  },
  {
    id: "lion-brand",
    apa: "Lion Brand. (n.d.). The history and origins of banh mi.",
    url: "https://lionbrand.com.au/blog/the-history-and-origins-of-banh-mi/",
  },
  {
    id: "live-science",
    apa: "Live Science. (2018). Who invented bread?",
    url: "https://www.livescience.com/62536-who-invented-bread.html",
  },
  {
    id: "nguyen",
    apa: "Nguyen, A. (2014). History to chew on. Eat Your Books.",
    url: "https://www.eatyourbooks.com/blog/2014/7/3/history-to-chew-on",
  },
  {
    id: "origin-trace",
    apa: "Origin Trace. (n.d.). The history of the baguette: How France's most iconic bread became a symbol of national identity.",
    url: "https://origin-trace.com/article/history-of-baguette/",
  },
  {
    id: "pacific-ties",
    apa: "Pacific Ties. (n.d.). A sandwich speaks: Exploring Vietnam's colonial history through bánh mì. UCLA.",
    url: "https://pacificties.org/a-sandwich-speaks-exploring-vietnams-colonial-history-through-banh-mi/",
  },
  {
    id: "sortiraparis",
    apa: "Sortiraparis. (n.d.). The baguette, the history of this Parisian bread that has become a French tradition and a national symbol.",
    url: "https://www.sortiraparis.com/en/where-to-eat-in-paris/food-events/articles/330833-history-baguette-parisian-tradition-french-national-symbol",
  },
  {
    id: "culture-trip",
    apa: "The Culture Trip. (n.d.). The curious history of Vietnam's bánh mì sandwich.",
    url: "https://theculturetrip.com/asia/vietnam/articles/the-curious-history-of-vietnams-banh-mi-sandwich",
  },
];
