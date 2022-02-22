import { Loader } from "@googlemaps/js-api-loader";
import { TextField, Box, Paper, Card } from "@mui/material";
import { createRef, forwardRef, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-unused-vars */
let map: google.maps.Map;

// eslint-disable-next-line react/display-name
const SearchBar = forwardRef<HTMLDivElement>((props: any, ref) => (
  <div ref={ref}>
    <Card sx={{ m: 1, width: 400 }}>
      <TextField id='maps-search-bar' label='Search' variant='outlined' sx={{ width: '100%', height: '100%' }}/>
    </Card>
  </div>
));

function Map() {
  const searchRef = createRef<HTMLDivElement>();

  const searchBar = <SearchBar ref={searchRef} />

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("REACT_APP_GOOGLE_MAPS_API_KEY not defined");

    const loader = new Loader({
      apiKey,
      version: "weekly",
    });

    loader.load().then(() => {
      map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 28.603053295127882, lng: -81.19995194984672 },
        zoom: 12,
        streetViewControl: false,
        mapTypeControl: false,
      });

      map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchRef.current);
    });
  });

  return (
    <Box sx={{ height: '100%' }}>
      <div id="map"></div>
      {searchBar}
    </Box>
  );
}

export function DataMap() {
  return (
    <Map />
  );
}
