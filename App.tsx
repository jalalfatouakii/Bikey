import React, { useEffect, useRef, useState } from 'react';
import MapView, { Geojson, Marker, Polyline } from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import * as Location from 'expo-location';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';

import bikePathsData from './data/reseau_cyclable.geojson.json';
import arceaux from './data/csvjson.json';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bikePaths, setBikePaths] = useState([]);
  const [bixiData, setBixiData] = useState([]);
  const [bixiStations, setBixiStations] = useState([]);
  const [isBixiLoading, setIsBixiLoading] = useState(true);
  const [hideBixi, setHideBixi] = useState(false);
  const [hideBike, setHideBike] = useState(false);
  const mapRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [bixiType, setBixiType] = useState('default');


  /*
   * {customData && (
            <Geojson
              geojson={customData}
              strokeColor="#FF0000"
              strokeWidth={2}
            />
          )}
   */
    // Add new state for tracking the current map region
  


  // Update the getBixi function to use this loading state
async function getBixi() {
  try {
    setIsBixiLoading(true);
    console.log("Fetching Bixi stations...");
    // Fetch the station information data that contains coordinates
    let response = await fetch('https://gbfs.velobixi.com/gbfs/en/station_information.json');
    let stationInfoJson = await response.json();
    
    console.log("Number of stations:", stationInfoJson.data.stations.length);
    console.log("Station data:", stationInfoJson.data.stations);
    // Set the stations data directly
    setBixiStations(stationInfoJson.data.stations);
    console.log("bixiStations state updated");
  } catch(error) {
    console.error("Error fetching Bixi stations:", error);
  } finally {
    setIsBixiLoading(false);
  }
}

// Update the getBixiStatus function similarly
async function getBixiStatus() {
  try {
    console.log("Fetching Bixi status...");
    // Fetch the station status data that contains availability
    let response = await fetch('https://gbfs.velobixi.com/gbfs/en/station_status.json');
    let stationStatusJson = await response.json();
    console.log("Number of stations in status:", stationStatusJson.data.stations.length);
    console.log("Station status data:", stationStatusJson.data.stations[0]);
    // Set the status data directly
    setBixiData(stationStatusJson.data.stations);
    console.log("bixiData state updated");
  } catch(error) {
    console.error("Error fetching Bixi status:", error);
  }
}
  // 1. One for fetching the Bixi data immediately when the app starts
useEffect(() => {
    setHideBixi(true);
    setHideBixi(false);
    console.log("Initial Bixi data fetch");
    getBixi();
    getBixiStatus();
  }, []); // Empty dependency array means this runs once at mount

  useEffect(() => {

    // Convert GeoJSON to polylines
    const extractPolylines = () => {
      const polylines = [];
      
      // Process each feature in the GeoJSON
      bikePathsData.features.forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          // LineString has a single array of coordinates
          const coordinates = feature.geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0]
          }));
          
          polylines.push({
            coordinates,
            type: feature.properties.type || 'default', // Use your actual property name
            id: feature.id || Math.random().toString()
          });
        } 
        else if (feature.geometry.type === 'MultiLineString') {
          // MultiLineString has multiple arrays of coordinates
          feature.geometry.coordinates.forEach(line => {
            const coordinates = line.map(coord => ({
              latitude: coord[1],
              longitude: coord[0]
            }));
            
            polylines.push({
              coordinates,
              type: feature.properties.type || 'default',
              id: feature.id || Math.random().toString()
            });
          });
        }
      });
      
      setBikePaths(polylines);
    };

    async function getCurrentLocation() {
      try {
        setIsLoading(true);
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setIsLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        console.error("Error getting location:", error);
        setErrorMsg('Failed to get location');
      } finally {
        setIsLoading(false);
      }
    }
    
    
    getCurrentLocation();
    extractPolylines();
  }, []);
  


  const [mapRegion, setMapRegion] = useState({
    latitude: location ? location.coords.latitude : 45.5017,
    longitude: location ? location.coords.longitude : -73.5673,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const hideBixiThings = () => {
    setHideBixi(!hideBixi);
  }
  const returnBixiStatus = (id : any) => {
    //console.log("Bixi station ID:", bixiStations[id].name);
    // Find the station in bixiStations where station_id equals id
    const station = bixiStations.find(station => station.station_id === id);
    const valeurs = bixiData.find(station => station.station_id === id);
    if (!station) {
      console.error(`No station found with ID: ${id}`);
      return;
    }
    console.log("Bixi station data: lol", station, " iyiyiy",valeurs);
    let num = valeurs.num_bikes_available-valeurs.num_ebikes_available
    alert("Station : " + station.name + "\n Vélos electriques dispo : " +valeurs.num_ebikes_available + "\n Vélos mecaniques dispo : " + num + "\n Ancrages dispo : " + valeurs.num_docks_available);
    //console.log("Bixi station data:", bixiData[id]);
  }



  

  const returnValues = (id : any) => {
    const station = bixiStations.find(station => station.station_id === id);
    const valeurs = bixiData.find(station => station.station_id === id);
    if (!station || !valeurs) {

      return "0";
    }
    if (bixiType === 'default') {
      return valeurs.num_bikes_available}
    else if (bixiType === 'ebike') {
      return valeurs.num_ebikes_available
    }
    else if (bixiType === 'mechanic') {
      return valeurs.num_bikes_available-valeurs.num_ebikes_available
    }
    else if (bixiType === 'dock') {
      return valeurs.num_docks_available
    }
  }

  // Then modify the goToLocation function like this:
const goToLocation = () => {
  if (location && mapRef.current) {
    // Use the animateToRegion method for smooth animation
    mapRef.current.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0122,
      longitudeDelta: 0.0021,
    }, 500); // 1000ms = 1 second animation duration
  }
};
  const hideBikeThings = () => {
    setHideBike(!hideBike);
  }


  const renderBixiStations = () => {
    // Check if we have stations data
    if (!bixiStations || !Array.isArray(bixiStations)) {
      console.error("Invalid Bixi stations data:", bixiStations);
      return null;
    }
    
    return bixiStations.map((station) => (
      <Marker
        key={`bixi-${station.station_id}`}
        coordinate={{
          latitude: station.lat,
          longitude: station.lon,

        }}
        tracksViewChanges={false}
        onPress={() => returnBixiStatus(station.station_id)}
      >
        <View style={styles.circleMarkerRed} >
          <Text style={styles.markerText}>
          {returnValues(station.station_id)}
        </Text>
        </View>
      </Marker>
    ));
  };
  
  const listeArceaux = () =>{
    const liste = [];
    for (let i = 0; i < arceaux.length; i++) {
      const arceau = arceaux[i];
      liste.push({
        latitude: parseFloat(arceau.LAT),
        longitude: parseFloat(arceau.LONG),
      });
    }
    return liste;
  }

  const showBikeModal = () => {
    setModalVisible(true);
    return(
      <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(255, 255, 255)', width: '75%', maxHeight: '50%', margin: 'auto', borderRadius: 10, padding: 20 }}>  
              <Text>Modal Content</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>Close Modal</Text>
              </TouchableOpacity>
            </View>
          </Modal>
    )

  }


  // Function to determine polyline color based on type
  const getPolylineColor = (type) => {
    switch(type) {
      default: return '#0000FF';
    }
  };

  // Render loading indicator while waiting for location
  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const changeToEbike = () => {
    if (bixiType != "ebike"){
      setBixiType("ebike")
    }
    else{
      setBixiType("default")
    }
    
  }
  // Render error message if there's an error
  if (errorMsg) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  // Only render the map when we have location data
  return (
    <View style={styles.container}>
      {location && (
        
        <>
        
        <MapView
          style={styles.map}
          ref={mapRef}
          showsUserLocation={true}
          showsScale={true}
          mapType="standard"

          initialRegion={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
            //latitude: location.coords.latitude,
            //longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {!hideBike && listeArceaux().map((arceau, index) => (
            <Marker
              key={index}
              coordinate={arceau}
              tracksViewChanges={false}
            >
              <View style={styles.circleMarker} />
            </Marker>
          ))}

          {!hideBixi && renderBixiStations()}

          


          {/* Uncomment to render bike paths */}
          {/*
    ))}
    {/* Render each bike path as a Polyline
      {bikePaths.map(path => (
        <Polyline
          key={path.id}
          coordinates={path.coordinates}
          strokeColor={getPolylineColor(path.type)}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          tappable={true}
          onPress={() => console.log('Path pressed:', path.id)}
        />
      ))}
    */}

        </MapView>
        <TouchableOpacity
        style={styles.toggleEbike}
        activeOpacity={0.7}
        onPress={changeToEbike}>
          <Text style={styles.ebikeText}>Hello</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.goToLocationButton}
          activeOpacity={0.7}
          onPress={goToLocation}>
            <FontAwesomeIcon icon={faLocationArrow} style={{ color: "white" }} />

          </TouchableOpacity><TouchableOpacity
            style={styles.hideBikeButton}
            activeOpacity={0.7}
            onPress={hideBikeThings}
          >
            <Text style={styles.refreshButtonText}>{hideBike ? 'Show bikes' : 'Hide bikes'}</Text>
          </TouchableOpacity><TouchableOpacity
            style={styles.refreshButton}
            activeOpacity={0.7}
            onPress={hideBixiThings}
          >
            <Text style={styles.refreshButtonText}>{hideBixi ? 'Show Bixi' : 'Hide Bixi'}</Text>
          </TouchableOpacity></>
        
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  circleMarker: {
    width: 12, // Smaller size - adjust as needed
    height: 12, // Smaller size - adjust as needed
    borderRadius: 6, // Half of width/height for perfect circle
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: 'white', // Optional white border for visibility
  },
  circleMarkerRed: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 15, // Smaller size - adjust as needed
    height: 15, // Smaller size - adjust as needed
    borderRadius: 8, // Half of width/height for perfect circle
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: 'white', // Optional white border for visibility
  },
  refreshButton: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  backgroundColor: '#FF0000',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 25,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
refreshButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
toggleEbike: {
  position: 'absolute',
  top: 50,
  right: 15,
  backgroundColor: '#0000AA',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 25,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
ebikeText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
hideBikeButton: {
  position: 'absolute',
  bottom: 70,
  right: 15,
  backgroundColor: '#000000',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 25,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
goToLocationButton: {
  position: 'absolute',
  bottom: 120,
  right: 20,
  color: 'white',
  backgroundColor: '#0000ff',
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 25,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
markerText: {
    color: 'white', // or whatever color contrasts well with your circle
    fontSize: 8, // adjust size as needed
    fontWeight: 'bold',
    textAlign: 'center',
  },

});