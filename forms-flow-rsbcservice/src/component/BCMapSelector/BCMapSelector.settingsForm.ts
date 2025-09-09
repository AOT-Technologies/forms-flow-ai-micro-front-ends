import baseEditForm from "@aot-technologies/formiojs/lib/components/_classes/component/Component.form";

// Returns the configuration settings form for the BC Map Selector component, including map provider selection, geocoding configuration, boundary settings, and JSON-based settings validation.
const settingsForm = (...extend) => {
  return baseEditForm(
    [
      {
        key: "display",
        components: [
          {
            type: "textfield",
            key: "label",
            label: "Label",
            input: true,
            weight: 10,
          },
          {
            type: "textfield",
            key: "buttonLabelEmpty",
            label: "Button Label(Empty)",
            input: true,
            weight: 15,
            placeholder: "Select from Map",
            description: "Custom label for the map selection button. If empty, defaults to 'Select from Map'.",
          },
          {
            type: "textfield",
            key: "buttonLabelSelected",
            label: "Button Label(Selected)",
            input: true,
            weight: 15,
            placeholder: "Change Location",
            description: "Custom label for the map selection button. If selected, defaults to 'Change Location'.",
          },
          {
            type: "select",
            key: "mapProvider",
            label: "Map Provider",
            input: true,
            widget: "choicesjs",
            dataSrc: "values",
            data: {
              values: [
                { label: "OpenStreetMap", value: "openstreetmap" },
                { label: "Google Maps", value: "google" },
                { label: "Mapbox", value: "mapbox" },
                { label: "Custom", value: "custom" },
              ],
            },
            weight: 20,
            defaultValue: "openstreetmap",
            placeholder: "Select a Map Provider",
            multiple: false,
            searchEnabled: false,
          },
          {
            type: "select",
            key: "geocodingProvider",
            label: "Geocoding Provider",
            input: true,
            widget: "choicesjs",
            dataSrc: "values",
            data: {
              values: [
                { label: "Nominatim (OpenStreetMap)", value: "nominatim" },
                { label: "Google Geocoding API", value: "google" },
                { label: "Mapbox Geocoding API", value: "mapbox" },
                { label: "Disabled", value: "disabled" },
              ],
            },
            weight: 30,
            defaultValue: "nominatim",
            placeholder: "Select a Geocoding Provider",
            multiple: false,
            searchEnabled: false,
          },
          {
            type: "textfield",
            key: "googleApiKey",
            label: "Google Maps API Key",
            input: true,
            weight: 40,
            placeholder: "Enter Google Maps API Key",
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "google"
            },
            validate: {
              required: true,
              custom: function (context) {
                if (context.data.mapProvider === "google" && !context.value) {
                  return "Google API Key is required when using Google Maps";
                }
                return true;
              },
            },
          },
          {
            type: "textfield",
            key: "googleGeocodingApiKey",
            label: "Google Geocoding API Key",
            input: true,
            weight: 45,
            placeholder: "Enter Google Geocoding API Key (if different from Maps API Key)",
            conditional: {
              show: true,
              when: "geocodingProvider",
              eq: "google"
            },
          },
          {
            type: "select",
            key: "googleMapType",
            label: "Google Maps Type",
            input: true,
            widget: "choicesjs",
            dataSrc: "values",
            data: {
              values: [
                { label: "Roadmap", value: "roadmap" },
                { label: "Satellite", value: "satellite" },
                { label: "Hybrid", value: "hybrid" },
                { label: "Terrain", value: "terrain" },
              ],
            },
            weight: 47,
            defaultValue: "roadmap",
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "google"
            },
          },
          {
            type: "textfield",
            key: "mapboxAccessToken",
            label: "Mapbox Access Token",
            input: true,
            weight: 50,
            placeholder: "Enter Mapbox Access Token",
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "mapbox"
            },
            validate: {
              required: true,
              custom: function (context) {
                if (context.data.mapProvider === "mapbox" && !context.value) {
                  return "Mapbox Access Token is required when using Mapbox";
                }
                return true;
              },
            },
          },
          {
            type: "textfield",
            key: "mapboxStyleId",
            label: "Mapbox Style ID",
            input: true,
            weight: 52,
            placeholder: "mapbox/streets-v11",
            defaultValue: "mapbox/streets-v11",
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "mapbox"
            },
          },
          {
            type: "textfield",
            key: "mapboxGeocodingToken",
            label: "Mapbox Geocoding Access Token",
            input: true,
            weight: 55,
            placeholder: "Enter Mapbox Geocoding Access Token (if different from Maps token)",
            conditional: {
              show: true,
              when: "geocodingProvider",
              eq: "mapbox"
            },
          },
          {
            type: "textfield",
            key: "customTileUrl",
            label: "Custom Tile URL",
            input: true,
            weight: 60,
            placeholder: "https://example.com/{z}/{x}/{y}.png",
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "custom"
            },
            validate: {
              required: true,
              custom: function (context) {
                if (context.data.mapProvider === "custom" && !context.value) {
                  return "Custom Tile URL is required when using Custom provider";
                }
                if (context.value && !context.value.includes("{z}") || !context.value.includes("{x}") || !context.value.includes("{y}")) {
                  return "Custom Tile URL must include {z}, {x}, and {y} placeholders";
                }
                return true;
              },
            },
          },
          {
            type: "textfield",
            key: "customAttribution",
            label: "Custom Attribution",
            input: true,
            weight: 65,
            placeholder: "© Custom Map Provider",
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "custom"
            },
          },
          {
            type: "number",
            key: "customMaxZoom",
            label: "Custom Max Zoom Level",
            input: true,
            weight: 67,
            placeholder: "18",
            defaultValue: 18,
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "custom"
            },
            validate: {
              min: 1,
              max: 25,
            },
          },
          {
            type: "number",
            key: "customMinZoom",
            label: "Custom Min Zoom Level",
            input: true,
            weight: 69,
            placeholder: "1",
            defaultValue: 1,
            conditional: {
              show: true,
              when: "mapProvider",
              eq: "custom"
            },
            validate: {
              min: 0,
              max: 20,
              custom: function (context) {
                if (context.data.customMaxZoom && context.value >= context.data.customMaxZoom) {
                  return "Min zoom must be less than max zoom";
                }
                return true;
              },
            },
          },
          {
            type: "checkbox",
            key: "showSelectedCoordinates",
            label: "Show Selected Coordinates",
            input: true,
            weight: 70,
            defaultValue: true,
            description: "Display the selected coordinates information below the map",
          },
        ],
      },
      {
        key: "boundaries",
        label: "Geographic Boundaries",
        components: [
          {
            type: "checkbox",
            key: "useCustomBoundaries",
            label: "Use Custom Boundaries",
            input: true,
            weight: 10,
            defaultValue: false,
            description: "Enable to set custom geographic boundaries. If disabled, no boundary validation will be applied.",
          },
          {
            type: "textfield",
            key: "geoJsonUrl",
            label: "GeoJSON Boundary URL",
            input: true,
            weight: 15,
            placeholder: "https://example.com/boundary.geojson",
            conditional: {
              show: true,
              when: "useCustomBoundaries",
              eq: true
            },
            validate: {
              custom: function (context) {
                if (context.value && context.value.trim()) {
                  try {
                    new URL(context.value.trim());
                    return true;
                  } catch (error) {
                    return "Please enter a valid URL";
                  }
                }
                return true;
              },
            },
            description: "URL to fetch GeoJSON polygon data for boundary validation. If provided, rectangular boundaries below will be ignored.",
          },
          {
            type: "number",
            key: "northBoundary",
            label: "North Boundary (Latitude)",
            input: true,
            weight: 20,
            placeholder: "60.0",
            defaultValue: 60.0,
            step: 0.000001,
            conditional: {
              show: true,
              json: {
                "and": [
                  { "==": [{ "var": "useCustomBoundaries" }, true] },
                  { "!": [{ "var": "geoJsonUrl" }] }
                ]
              }
            },
            validate: {
              min: -90,
              max: 90,
              required: function (context) {
                return context.data.useCustomBoundaries && !context.data.geoJsonUrl;
              },
            },
          },
          {
            type: "number",
            key: "southBoundary",
            label: "South Boundary (Latitude)",
            input: true,
            weight: 30,
            placeholder: "48.0",
            defaultValue: 48.0,
            step: 0.000001,
            conditional: {
              show: true,
              json: {
                "and": [
                  { "==": [{ "var": "useCustomBoundaries" }, true] },
                  { "!": [{ "var": "geoJsonUrl" }] }
                ]
              }
            },
            validate: {
              min: -90,
              max: 90,
              required: function (context) {
                return context.data.useCustomBoundaries && !context.data.geoJsonUrl;
              },
              custom: function (context) {
                if (context.data.northBoundary && context.value >= context.data.northBoundary) {
                  return "South boundary must be less than north boundary";
                }
                return true;
              },
            },
          },
          {
            type: "number",
            key: "eastBoundary",
            label: "East Boundary (Longitude)",
            input: true,
            weight: 40,
            placeholder: "-114.0",
            defaultValue: -114.0,
            step: 0.000001,
            conditional: {
              show: true,
              json: {
                "and": [
                  { "==": [{ "var": "useCustomBoundaries" }, true] },
                  { "!": [{ "var": "geoJsonUrl" }] }
                ]
              }
            },
            validate: {
              min: -180,
              max: 180,
              required: function (context) {
                return context.data.useCustomBoundaries && !context.data.geoJsonUrl;
              },
            },
          },
          {
            type: "number",
            key: "westBoundary",
            label: "West Boundary (Longitude)",
            input: true,
            weight: 50,
            placeholder: "-139.0",
            defaultValue: -139.0,
            step: 0.000001,
            conditional: {
              show: true,
              json: {
                "and": [
                  { "==": [{ "var": "useCustomBoundaries" }, true] },
                  { "!": [{ "var": "geoJsonUrl" }] }
                ]
              }
            },
            validate: {
              min: -180,
              max: 180,
              required: function (context) {
                return context.data.useCustomBoundaries && !context.data.geoJsonUrl;
              },
              custom: function (context) {
                if (context.data.eastBoundary && context.value >= context.data.eastBoundary) {
                  return "West boundary must be less than east boundary";
                }
                return true;
              },
            },
          },
        ],
      },
      {
        key: "advanced",
        label: "Advanced Settings",
        components: [
          {
            type: "htmlelement",
            key: "eventsDocumentation",
            tag: "div",
            weight: 5,
            content: `
              <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
                <h4 style="margin-top: 0; color: #495057;">Component Events</h4>
                <p style="margin-bottom: 10px; color: #6c757d;">The BC Map Selector component emits the following events:</p>
                <ul style="margin-bottom: 15px; color: #6c757d;">
                  <li><strong>mapSelected</strong> - Fired when a location is selected on the map. Event data contains lat/long coordinates.</li>
                  <li><strong>mapCleared</strong> - Fired when the selected location is cleared from the map.</li>
                  <li><strong>addressSet</strong> - Fired when an address is programmatically set using the setAddress method. Event data contains the address string.</li>
                </ul>
                <h5 style="color: #495057;">Public Methods:</h5>
                <ul style="margin-bottom: 15px; color: #6c757d;">
                  <li><strong>setAddress(address: string)</strong> - Public method to set address programmatically. This method can be called externally to update the map location based on an address string.</li>
                </ul>
                <h5 style="color: #495057;">Example Event Listeners:</h5>
                <pre style="background-color: #f1f3f4; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;"><code>if(instance && !instance.mapSelectedListner){
  instance.root.on('mapSelected', async (event) => {
    const loc_data = event.data;
    instance.root.getComponent("lat").setValue(loc_data.lat)
    instance.root.getComponent("long").setValue(loc_data.long)
  });
  
  instance.root.on('mapCleared', async (event) => {
    instance.root.getComponent("lat").setValue('')
    instance.root.getComponent("long").setValue('')
  });

  instance.root.on('addressSet', async (event) => {
    const address = event.data;
    console.log('Address set programmatically:', address);
  });
}</code></pre>
                <h5 style="color: #495057;">Example Method Usage:</h5>
                <pre style="background-color: #f1f3f4; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;"><code>// Set address programmatically
await instance.setAddress('123 Main St, Vancouver, BC');</code></pre>
              </div>
            `,
          },
          {
            type: "textarea",
            key: "bcMapSettings",
            label: "BC Map Settings (JSON format)",
            input: true,
            rows: 8,
            resizable: true,
            weight: 10,
            as: "json",
            validate: {
              custom: function (context) {
                let currValue = context.data.bcMapSettings;

                // Ensure currValue is a string before calling trim()
                if (typeof currValue !== "string") {
                  return true;
                }

                currValue = currValue.trim();
                if (currValue === "" || currValue === '""') {
                  context.data.bcMapSettings = "";
                  return true;
                }
                try {
                  const parsed = JSON.parse(context.value);

                  // Validate structure if JSON is provided
                  if (parsed && typeof parsed === 'object') {
                    // Validate boundaries if provided
                    if (parsed.boundaries) {
                      const { north, south, east, west } = parsed.boundaries;
                      if (typeof north !== 'number' || typeof south !== 'number' ||
                        typeof east !== 'number' || typeof west !== 'number') {
                        return "Boundaries must contain numeric values for north, south, east, west";
                      }
                      if (south >= north) {
                        return "South boundary must be less than north boundary";
                      }
                      if (west >= east) {
                        return "West boundary must be less than east boundary";
                      }
                    }

                    // Validate map provider if provided
                    if (parsed.mapProvider && !['openstreetmap', 'google', 'mapbox', 'custom'].includes(parsed.mapProvider)) {
                      return "Invalid map provider. Must be one of: openstreetmap, google, mapbox, custom";
                    }

                    // Validate geocoding provider if provided
                    if (parsed.geocodingProvider && !['nominatim', 'google', 'mapbox', 'disabled'].includes(parsed.geocodingProvider)) {
                      return "Invalid geocoding provider. Must be one of: nominatim, google, mapbox, disabled";
                    }
                  }

                  return true;
                } catch (error) {
                  return "Invalid JSON format";
                }
              },
            },
            description: `
                        Advanced configuration in JSON format. Example:<pre>
{
  "boundaries": {
    "north": 60.0,
    "south": 48.0,
    "east": -114.0,
    "west": -139.0
  },
  "defaultZoom": 7,
  "enableAddressSearch": true,
  "offlineMode": "auto",
  "mapProvider": "openstreetmap",
  "geocodingProvider": "nominatim",
  "tileConfiguration": {
    "google": {
      "apiKey": "your-api-key",
      "mapType": "roadmap"
    },
    "mapbox": {
      "accessToken": "your-access-token",
      "styleId": "mapbox/streets-v11"
    },
    "custom": {
      "tileUrl": "https://example.com/{z}/{x}/{y}.png",
      "attribution": "© Custom Provider",
      "maxZoom": 18,
      "minZoom": 1
    }
  },
  "geocodingConfiguration": {
    "nominatim": {
      "baseUrl": "https://nominatim.openstreetmap.org/search"
    },
    "google": {
      "apiKey": "your-geocoding-api-key"
    },
    "mapbox": {
      "accessToken": "your-geocoding-token"
    }
  }
}</pre>
                        `,
          },
        ],
      },
      {
        key: "data",
        components: [],
      },
      {
        key: "validation",
        components: [],
      },
      {
        key: "api",
        components: [],
      },
      {
        key: "conditional",
        components: [],
      },
      {
        key: "logic",
        components: [],
      },
    ],
    ...extend
  );
};

export default settingsForm;