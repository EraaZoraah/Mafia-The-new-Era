# Geographic data notice

City silhouettes derive from the historical urban footprint polygons in https://github.com/drei01/geojson-world-cities (Apache-2.0). Original repository cites VDS Technologies world data. Accuracy varies; these are not current municipal boundaries. Dubai combines Dubayy, As Satwah and Ar Rashidiyah; Hong Kong combines Victoria and Kowloon from that source. Other cities combine matching nearby named footprint polygons. Geographical coordinates are projected with local latitude correction and uniformly scaled for the game.

The 40–60 game parcels are fictional, deterministically generated Voronoi subdivisions. They are not official neighborhoods, cadastral parcels or political boundaries. Parcel counts are a game-scale mapping of the footprint size and do not claim current population or legal-area accuracy. Larger cells are assigned to districts/harbor territories; smaller cells represent street blocks. Water/outside areas are excluded with the source outline clip.

Modified/derived files: public/city-geography.js and scripts/build-city-geography.py. Generated 16 October 2026. Reproduction script expects art/world-city-boundaries.geojson from the source repository. Preserve this attribution and GEOGRAPHY-LICENSE.txt in redistributed builds.
