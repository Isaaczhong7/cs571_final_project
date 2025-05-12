# cs571_final_project
## Project title: USA food allergy trend & prevelance
### Team member: Isaac Zhong, William Cai, Adith Sreeram Arjunan Sivakumar
Website: https://isaaczhong7.github.io/cs571_final_project/ 
<br>
Screencast: https://youtu.be/_f_eezYq9tQ?si=_FBVQZUCmXTwD1ms
<br>
For our project, we are handing in our home page, map1, map2, and map3 with its related js code and html file. Also we are included the dataset and the picture asset we used.
<br>
Isaac Zhong:<br>
I did all the part of map1 and from html to js code. In addition to code, I have created bar_allergy_data.csv, pie_allergy_data.csv, and total_pollen_score_ranking.csv file to support my visualization. For the library I used D3.js for Data binding + chart; TopoJSON for Map topology parsing; us-atlas for Map dataset. Lastly, the non-obvious features of map1 might be the bar and pie chart showing on map1 because in default the charts are not showing; when user click the specific state, it will show the charts in the bottom of the page where user needs to scroll down to see.
<br><br>

William Cai<br>
I wrote all of the html and js code for map2, and also wrote up the age_groups.csv file for my visualization. I also used us-atlas to obtain map data, TopoJSON to parse the map topology, and D3 for creating the visuals. I included functionality such that when one clicks a button, they can see the prevalence of food allergies for a specific age group. One non-obvious feature in this map is that these percentages per age group are available to see in list form only when one clicks a button to show the list.
<br><br>

Adith Sreeram Arjunan Sivakumar:<br>
I implemented all the interactive functionality and visual elements in **Map 3**, including:

- The base **USA choropleth map** showing percentage change in food allergy claims per state.
- A **region filter dropdown** that highlights only states within a selected region.
- A **state filter dropdown** to isolate and interact with one specific state.
- A **focus mode toggle** that highlights only states with ≥200% increase in claims.
- Display of a **bacteria-shaped SVG icon** on high-risk states when in focus mode, scaled to the magnitude of the percentage increase.
- Dynamic **tooltips** showing state name and exact % change on hover.
- Legends, centering, zoom, and interactive polish for a complete D3.js map experience.
- Integrated all data from `state_claims_data.csv` and assets like `germ.svg`.
- Contributed final polishing, documentation, filtering logic corrections, and dropdown behavior logic.
<br><br>
