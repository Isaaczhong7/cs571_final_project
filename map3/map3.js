const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const tooltip = d3.select("#tooltip");

const projection = d3.geoAlbersUsa()
  .scale(1300)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const color = d3.scaleSequential()
  .interpolator(d3.interpolateReds)
  .domain([0, 300]);

const stateIdToName = new Map([
  ["01", "Alabama"], ["02", "Alaska"], ["04", "Arizona"], ["05", "Arkansas"],
  ["06", "California"], ["08", "Colorado"], ["09", "Connecticut"], ["10", "Delaware"],
  ["11", "District of Columbia"], ["12", "Florida"], ["13", "Georgia"], ["15", "Hawaii"],
  ["16", "Idaho"], ["17", "Illinois"], ["18", "Indiana"], ["19", "Iowa"],
  ["20", "Kansas"], ["21", "Kentucky"], ["22", "Louisiana"], ["23", "Maine"],
  ["24", "Maryland"], ["25", "Massachusetts"], ["26", "Michigan"], ["27", "Minnesota"],
  ["28", "Mississippi"], ["29", "Missouri"], ["30", "Montana"], ["31", "Nebraska"],
  ["32", "Nevada"], ["33", "New Hampshire"], ["34", "New Jersey"], ["35", "New Mexico"],
  ["36", "New York"], ["37", "North Carolina"], ["38", "North Dakota"], ["39", "Ohio"],
  ["40", "Oklahoma"], ["41", "Oregon"], ["42", "Pennsylvania"], ["44", "Rhode Island"],
  ["45", "South Carolina"], ["46", "South Dakota"], ["47", "Tennessee"], ["48", "Texas"],
  ["49", "Utah"], ["50", "Vermont"], ["51", "Virginia"], ["53", "Washington"],
  ["54", "West Virginia"], ["55", "Wisconsin"], ["56", "Wyoming"]
]);

const regionMap = {
  "Northeast": ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Pennsylvania"],
  "Midwest": ["Ohio", "Michigan", "Indiana", "Wisconsin", "Illinois", "Minnesota", "Iowa", "Missouri", "North Dakota", "South Dakota", "Nebraska", "Kansas"],
  "South": ["Delaware", "Maryland", "District of Columbia", "Virginia", "West Virginia", "North Carolina", "South Carolina", "Georgia", "Florida", "Kentucky", "Tennessee", "Mississippi", "Alabama", "Oklahoma", "Texas", "Arkansas", "Louisiana"],
  "West": ["Montana", "Idaho", "Wyoming", "Colorado", "New Mexico", "Arizona", "Utah", "Nevada", "Washington", "Oregon", "California", "Alaska", "Hawaii"]
};

let allStates = [];
let highFocusStates = [];

Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  d3.csv("../dataset/state_claims_data.csv")
]).then(([us, data]) => {
  const nameToChange = new Map(data.map(d => [d.State, +d.percent_change]));
  allStates = data.map(d => d.State).sort();
  highFocusStates = data.filter(d => +d.percent_change >= 200).map(d => d.State);

  const states = topojson.feature(us, us.objects.states).features;

  const paths = svg.append("g")
    .selectAll("path")
    .data(states)
    .join("path")
    .attr("class", "state")
    .attr("d", path);

  const regionSelect = d3.select("#regionSelect");
  const stateSelect = d3.select("#stateSelect");
  const focusToggle = d3.select("#focusToggle");

  Object.keys(regionMap).forEach(region => {
    regionSelect.append("option").attr("value", region).text(region);
  });

  function updateStateDropdown(list) {
    stateSelect.selectAll("option:not([value='All'])").remove();
    list.forEach(state => {
      stateSelect.append("option").attr("value", state).text(state);
    });
  }

  updateStateDropdown(allStates); // default view

  function updateMap() {
    const selectedRegion = regionSelect.property("value");
    const selectedState = stateSelect.property("value");
    const focusMode = focusToggle.property("checked");

    const validStates = focusMode ? highFocusStates : allStates;
    updateStateDropdown(validStates);

    svg.selectAll(".germ").remove();

    paths
      .attr("fill", d => {
        const fips = d.id.toString().padStart(2, '0');
        const state = stateIdToName.get(fips);
        const value = nameToChange.get(state);

        const inFocus = focusMode ? value >= 200 : true;
        const inRegion = selectedRegion === "All" || regionMap[selectedRegion]?.includes(state);
        const isState = selectedState === "All" || selectedState === state;

        const isVisible = inFocus && (
          (selectedRegion === "All" && selectedState === "All") ||
          (selectedRegion !== "All" && inRegion && selectedState === "All") ||
          (selectedState !== "All" && selectedState === state)
        );

        return isVisible ? (value != null ? color(value) : "#ccc") : "#ddd";
      })
      .style("pointer-events", d => {
        const fips = d.id.toString().padStart(2, '0');
        const state = stateIdToName.get(fips);
        const value = nameToChange.get(state);

        const inFocus = focusMode ? value >= 200 : true;
        const inRegion = selectedRegion === "All" || regionMap[selectedRegion]?.includes(state);
        const isState = selectedState === "All" || selectedState === state;

        const isHoverable = inFocus && (
          (selectedRegion === "All" && selectedState === "All") ||
          (selectedRegion !== "All" && inRegion && selectedState === "All") ||
          (selectedState !== "All" && selectedState === state)
        );

        return isHoverable ? "all" : "none";
      });

    if (focusMode) {
      paths.each(function (d) {
        const fips = d.id.toString().padStart(2, '0');
        const state = stateIdToName.get(fips);
        const value = nameToChange.get(state);
        if (value >= 200) {
          const [x, y] = path.centroid(d);
          const scale = Math.min(2.5, value / 100);
          svg.append("image")
            .attr("class", "germ")
            .attr("xlink:href", "../assets/germ.svg")
            .attr("x", x - 10 * scale)
            .attr("y", y - 10 * scale)
            .attr("width", 20 * scale)
            .attr("height", 20 * scale);
        }
      });
    }
  }

  regionSelect.on("change", () => updateMap());
  stateSelect.on("change", () => updateMap());
  focusToggle.on("change", () => updateMap());

  updateMap();

  paths
    .on("mouseover", (event, d) => {
      const fips = d.id.toString().padStart(2, '0');
      const state = stateIdToName.get(fips);
      const value = nameToChange.get(state);

      const selectedRegion = regionSelect.property("value");
      const selectedState = stateSelect.property("value");
      const focusMode = focusToggle.property("checked");

      const inRegion = selectedRegion === "All" || regionMap[selectedRegion]?.includes(state);
      const isState = selectedState === "All" || selectedState === state;
      const isVisible = (!focusMode && (
        (selectedRegion === "All" && selectedState === "All") ||
        (selectedRegion !== "All" && inRegion && selectedState === "All") ||
        (selectedState !== "All" && selectedState === state)
      )) || (focusMode && value >= 200);

      if (!isVisible) return;

      tooltip.style("opacity", 1)
             .html(`${state}<br>% Change: ${value != null ? value + "%" : "N/A"}`);
    })
    .on("mousemove", event => {
      if (tooltip.style("opacity") === "1") {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      }
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Legend
  const legendWidth = 200;
  const legendHeight = 10;

  const legend = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 50})`);

  const legendScale = d3.scaleLinear()
    .domain(color.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => d + "%");

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

  linearGradient.selectAll("stop")
    .data(d3.ticks(0, 1, 10))
    .enter().append("stop")
    .attr("offset", d => d * 100 + "%")
    .attr("stop-color", d => color(d * 300));

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
});
