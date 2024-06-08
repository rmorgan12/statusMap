// DDX Bricks Wiki - See https://developer.domo.com/docs/ddx-bricks/getting-started-using-ddx-bricks
// for tips on getting started, linking to Domo data and debugging your app
 
//Step 1. Select your data from the link in the bottom left corner
 
//Step 2. Style your map using the following properties 
//--------------------------------------------------
// Properties
//--------------------------------------------------

var mapboxAccessToken =  // https://account.mapbox.com/access-tokens


//--------------------------------------------------
// For ultimate flexibility, modify the code below!
//--------------------------------------------------
 
//Available globals
var domo = window.domo; // For more on domo.js: https://developer.domo.com/docs/dev-studio-guides/domo-js#domo.get
var datasets = window.datasets;
var ol = window.ol;
var container = document.getElementById('myDiv');
var vectorLayer;

if (mapboxAccessToken === ''){
  container.style.paddingLeft = '30px';
  var errorMessage = '"mapboxAccessToken" is undefined. Please enter a token.';
  displayTokenError(container, errorMessage);
  throw new Error(errorMessage);
}

//Data Column Names
var dataTitleField = 'Name';
var dataLongitudeField = 'Longitude';
var dataLatitudeField = 'Latitude';
var vetInfo = 'Modal';
var dataAccountStatus = 'Account Status'


var select = [dataTitleField, dataLongitudeField, dataLatitudeField,vetInfo,dataAccountStatus];
var query = `/data/v1/${datasets[0]}?fields=${select.join()}&limit=10000`;
domo.get(query).then(function(data){
  mapIt(data);
});

// Function to update the icon scale based on the map's zoom level
function updateIconScale() {
  var currentZoom = map.getView().getZoom();
  var iconScale = calculateIconScale(currentZoom);


 // Set the icon scale for all features in the vector layer
  vectorLayer.getSource().getFeatures().forEach(function (feature) {
    var iconStyle = feature.getStyle();
    if (iconStyle && iconStyle.getImage()) {
      iconStyle.getImage().setScale(iconScale);
    }
  });
}

// Function to calculate the icon scale based on the current zoom level
function calculateIconScale(zoom) {
  // You can adjust the scaling factor as needed to control the icon size
  // based on the map's zoom level
  return Math.pow(10, zoom - 200);
}

// Create the map with the data returned from the query
function mapIt(data) {
  console.log(data)
  // Use Mapbox Tiles
  var mapBoxLayers = [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        urls : [
          "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=" + mapboxAccessToken
        ]
      })
    })
  ];

  // Use Open Streetmaps Tiles
  var openStreetLayers = [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ];

  var map = new ol.Map({
    target: container,
    layers: mapBoxLayers,
    view: new ol.View({
      center: ol.proj.fromLonLat([-111.841425, 40.671731]),
      zoom: 10
    })
  });    

  var features = getMarkers(data);

  var vectorSource = new ol.source.Vector({
    features: features
  });
  
  var vectorLayer = new ol.layer.Vector({
    source: vectorSource
  });

  var selectInteraction = new ol.interaction.Select({
    layers: [vectorLayer]
  });

map.addInteraction(selectInteraction);

  // Select interaction logic
selectInteraction.on('select', function(event) {
  var selectedFeature = event.selected[0]; // Assuming only one feature can be selected at a time

  if (selectedFeature) {
    var placeName = selectedFeature.get(dataTitleField);
    var mapLat = selectedFeature.get(dataLatitudeField);
    var mapLong = selectedFeature.get(dataLongitudeField);
    var mapStatus = selectedFeature.get(dataAccountStatus);


    // Apply the custom selected style here
    selectedFeature.setStyle(selectedIconStyle);

    openModal(placeName, mapLat, mapLong, mapStatus);

  } else {
    // Reset the style of the previously selected feature
    if (selectedFeature) {
      selectedFeature.setStyle(iconStyle); // Use the original style
    }
    closeModal();
  }
});


// Add the vector layer to the map
  map.addLayer(vectorLayer);


// Update the icon scale when the map's zoom changes
  map.on('moveend', function () {
    updateIconScale();
  });


    // Initialize the icon scale
  updateIconScale();
}


// Open the modal with the selected place name
function openModal(placeName, mapLat, mapLong, dataAccountStatus) {
  var modal = document.getElementById('myModal');
  var modalContent = document.querySelector('.modal-content');
  var modalTitle = modalContent.querySelector('h3');
  var modalBody = modalContent.querySelector('p');
  var closeButton = modalContent.querySelector('.close');

  var modal = document.querySelector('.modal');


// Call the function with the appropriate status


 // Update the modal content
  modalBody.innerHTML = placeName;
  if (dataAccountStatus === 'Customer') {
        modalContent.style.background = 'green';
    } else if (dataAccountStatus === 'Prospect') {
        modalContent.style.background = 'blue';
    } else if (dataAccountStatus === 'Pilot') {
        modalContent.style.background = 'purple';
    }else if (dataAccountStatus === 'Dormant') {
        modalContent.style.background = 'orange';
    }else if (dataAccountStatus === 'New') {
        modalContent.style.background = 'yellow';
    }else if (dataAccountStatus === 'No Status') {
        modalContent.style.background = 'pink';
    }else {
        // Default background if status is unknown
        modalContent.style.background = 'gray';
    }

  // Calculate the position relative to the clicked location
  var clickX = mapLong; // Longitude
  var clickY = mapLat; // Latitude
  var modalWidth = modal.offsetWidth;
  var modalHeight = modal.offsetHeight;
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;

  // Ensure the modal stays within the viewport boundaries
  var modalLeft = Math.min(viewportWidth - modalWidth, Math.max(0, clickX - modalWidth / 2)) + 'px';
  var modalTop = Math.min(viewportHeight - modalHeight, Math.max(0, clickY - modalHeight / 2)) + 'px';

  // Set the modal position
  modal.style.left = modalLeft;
  modal.style.top = modalTop;

  // Display the modal
  modal.style.display = 'block';

  // Close the modal when the close button is clicked
  closeButton.addEventListener('click', function () {
    closeModal();
  });

  // Close the modal when another marker is clicked
  selectInteraction.on('select', function (event) {
    var selectedFeature = event.selected[0]; // Assuming only one feature can be selected at a time

    if (selectedFeature) {
      var newPlaceName = selectedFeature.get(dataTitleField);
      if (newPlaceName !== placeName) {
        closeModal();
        openModal(newPlaceName, selectedFeature.get(dataLatitudeField), selectedFeature.get(dataLongitudeField),selectedFeature.get(dataAccountStatus));

      }
    } else {
      closeModal();

    }
  });
}

// Close the modal
function closeModal() {
  var modal = document.getElementById('myModal');
  modal.style.display = 'none';

  // Reset the style of the selected feature back to its original style
  if (selectedFeature) {
    selectedFeature.setStyle(iconStyle);
    selectedFeature = null;
  }
}



function getMarkers(dataRows) {
  var features = [];

  var iconStyle = new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 1],
      src: "https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-school&size=40&hoffset=0&voffset=-1"
    }))
  });

  for (var i = 0; i < dataRows.length; i++){ 
    var column = dataRows[i];
    var longitude = column[dataLongitudeField];
    var latitude = column[dataLatitudeField];
    var school = column[dataTitleField];

    var iconFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'))
    });

    iconFeature.setProperties(column);
    iconFeature.setStyle(iconStyle);
    features.push(iconFeature);
  }

  return features;
}


// Define a custom style for selected features
var selectedIconStyle = new ol.style.Style({
  image: new ol.style.Icon({
    src: thumbnailPath, // Use the dynamic thumbnail path
    scale: 0.08, // Adjust the scale to make the icons smaller
    opacity: 0.7, // Reduce opacity to make it appear grayed out
  }),
});
